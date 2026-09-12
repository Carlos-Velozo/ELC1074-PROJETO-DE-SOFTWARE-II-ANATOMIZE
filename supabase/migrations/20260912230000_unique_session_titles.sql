-- Títulos de sessão vinham direto do nome do PDF, sem controle de colisão: subir
-- o mesmo arquivo três vezes produzia três linhas idênticas na sidebar. Esta
-- migration torna o título único por usuário e dá ao cliente uma forma segura
-- de renomear.

-- 1. normaliza o que já existe antes de criar as restrições

-- corta títulos acima do novo limite (o check abaixo falharia)
update public.sessions
set title = left(title, 120)
where char_length(title) > 120;

-- título vazio não passa no check; usa o nome do PDF ou um fallback
update public.sessions
set title = coalesce(nullif(trim(pdf_name), ''), 'Sessão sem nome')
where trim(title) = '';

-- desduplica: a 2ª ocorrência de um mesmo título vira "título (1)", a 3ª "(2)"...
-- o loop procura o primeiro sufixo realmente livre, porque o usuário pode já ter
-- uma sessão chamada "título (1)" à mão.
do $$
declare
  linha record;
  candidato text;
  n int;
begin
  for linha in
    select id, user_id, title
    from (
      select
        id,
        user_id,
        title,
        row_number() over (partition by user_id, title order by created_at, id) as ordem
      from public.sessions
    ) as numeradas
    where ordem > 1
    order by id
  loop
    n := 1;
    loop
      candidato := left(linha.title, 120 - char_length(' (' || n || ')')) || ' (' || n || ')';
      exit when not exists (
        select 1 from public.sessions
        where user_id = linha.user_id and title = candidato
      );
      n := n + 1;
    end loop;

    update public.sessions set title = candidato where id = linha.id;
  end loop;
end;
$$;

-- 2. restrições

-- sem isso um cliente pode gravar um título de megabytes via PostgREST
alter table public.sessions
  add constraint sessions_title_len check (char_length(title) between 1 and 120);

create unique index sessions_user_title_uniq on public.sessions (user_id, title);

-- 3. helper: primeiro título livre na forma "base", "base (1)", "base (2)"...
--
-- security invoker (padrão) de propósito: a policy "sessions: dono" continua
-- valendo dentro da função, então ela só enxerga as sessões de quem chamou.
create function public.unique_session_title(p_base text, p_exclude_id uuid default null)
returns text as $$
declare
  base_limpa text;
  candidato text;
  n int := 0;
begin
  -- remove caracteres de controle, colapsa espaços e corta no limite da coluna
  base_limpa := trim(regexp_replace(regexp_replace(coalesce(p_base, ''), '[[:cntrl:]]', '', 'g'), '\s+', ' ', 'g'));
  base_limpa := left(base_limpa, 120);

  if base_limpa = '' then
    raise exception 'O nome da sessão não pode ficar vazio.' using errcode = '22023';
  end if;

  loop
    if n = 0 then
      candidato := base_limpa;
    else
      -- reserva espaço para o sufixo sem estourar o limite de 120
      candidato := left(base_limpa, 120 - char_length(' (' || n || ')')) || ' (' || n || ')';
    end if;

    exit when not exists (
      select 1
      from public.sessions
      where user_id = auth.uid()
        and title = candidato
        and (p_exclude_id is null or id <> p_exclude_id)
    );

    n := n + 1;
  end loop;

  return candidato;
end;
$$ language plpgsql set search_path = public;

-- 4. renomear: resolve a colisão e devolve o título de fato gravado
--
-- não toca em updated_at: a sidebar ordena por updated_at desc, e renomear não
-- deve reordenar a lista.
create function public.rename_session(p_session_id uuid, p_new_title text)
returns text as $$
declare
  titulo_final text;
begin
  titulo_final := public.unique_session_title(p_new_title, p_session_id);

  update public.sessions
  set title = titulo_final
  where id = p_session_id;

  -- a RLS filtra sessões de outros usuários, então 0 linhas = não é sua
  if not found then
    raise exception 'Sessão não encontrada.' using errcode = 'P0002';
  end if;

  return titulo_final;
end;
$$ language plpgsql set search_path = public;

grant execute on function public.unique_session_title(text, uuid) to authenticated;
grant execute on function public.rename_session(uuid, text) to authenticated;
