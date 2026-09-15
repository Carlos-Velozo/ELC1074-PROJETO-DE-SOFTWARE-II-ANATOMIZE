-- Cada clique em "gerar perguntas", cada upload e cada resposta enviada dispara
-- uma chamada paga à API de IA, e o único freio até aqui era o botão desabilitado
-- no navegador — nada que impeça alguém de chamar a Edge Function em loop.

create table public.ai_usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('upload_pdf', 'gerar_perguntas', 'avaliar')),
  created_at timestamptz not null default now()
);

create index ai_usage_events_user_kind_idx
  on public.ai_usage_events (user_id, kind, created_at desc);

-- RLS ligada e SEM nenhuma policy: a tabela fica inacessível via PostgREST.
-- Só a função abaixo (security definer) escreve e lê. Também não damos GRANT
-- para authenticated, senão o aluno poderia apagar o próprio histórico de uso.
alter table public.ai_usage_events enable row level security;

-- Os limites moram DENTRO da função, nunca como parâmetro: a função é chamada
-- com o JWT do próprio aluno, então um parâmetro de limite seria escolhido por
-- ele. Devolve true quando a chamada foi autorizada e registrada.
create function public.consumir_cota_ia(p_kind text)
returns boolean
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limite int;
  v_janela interval := interval '1 hour';
  v_usados int;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado.' using errcode = '28000';
  end if;

  v_limite := case p_kind
    when 'upload_pdf' then 20
    when 'gerar_perguntas' then 20
    when 'avaliar' then 60
    else null
  end;

  if v_limite is null then
    raise exception 'Tipo de uso desconhecido: %', p_kind using errcode = '22023';
  end if;

  -- serializa as chamadas do mesmo usuário: sem isso duas requisições simultâneas
  -- leem a mesma contagem e ambas passam pelo limite
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  -- housekeeping barato, restrito às linhas do próprio usuário
  delete from public.ai_usage_events
  where user_id = v_user_id and created_at < now() - interval '1 day';

  select count(*) into v_usados
  from public.ai_usage_events
  where user_id = v_user_id
    and kind = p_kind
    and created_at > now() - v_janela;

  if v_usados >= v_limite then
    return false;
  end if;

  insert into public.ai_usage_events (user_id, kind) values (v_user_id, p_kind);
  return true;
end;
$$ language plpgsql;

grant execute on function public.consumir_cota_ia(text) to authenticated;
