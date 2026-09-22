-- A transcricao tambem consome uma chamada de IA e precisa respeitar a cota.
alter table public.ai_usage_events
  drop constraint ai_usage_events_kind_check;

alter table public.ai_usage_events
  add constraint ai_usage_events_kind_check
  check (kind in ('upload_pdf', 'gerar_perguntas', 'avaliar', 'transcribe_audio'));

create or replace function public.consumir_cota_ia(p_kind text)
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
    when 'transcribe_audio' then 60
    else null
  end;

  if v_limite is null then
    raise exception 'Tipo de uso desconhecido: %', p_kind using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

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