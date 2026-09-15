-- As policies originais conferem só `auth.uid() = user_id` da própria linha, e
-- nunca de quem é a linha PAI referenciada. Ler continua isolado (cada tabela
-- filtra pelo próprio user_id), mas ESCREVER não estava:
--
--   B podia inserir um chat_message com user_id = B e session_id = <sessão de A>.
--   A nunca veria a mensagem, porém o trigger on_chat_message_insert dispara
--   touch_session_updated_at() e bumpa o updated_at da sessão de A — ou seja, B
--   reordenava a sidebar de A. Mesma brecha em questions/evaluations, e sessions
--   aceitava current_question_id apontando para uma pergunta de outro usuário.
--
-- Agora todo INSERT/UPDATE também prova que o pai é do mesmo dono.

drop policy "chat_messages: dono" on public.chat_messages;

create policy "chat_messages: dono"
  on public.chat_messages
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy "questions: dono" on public.questions;

create policy "questions: dono"
  on public.questions
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

drop policy "evaluations: dono" on public.evaluations;

create policy "evaluations: dono"
  on public.evaluations
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.questions q
      where q.id = question_id and q.user_id = auth.uid()
    )
  );

drop policy "sessions: dono" on public.sessions;

create policy "sessions: dono"
  on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      current_question_id is null
      or exists (
        select 1 from public.questions q
        where q.id = current_question_id and q.user_id = auth.uid()
      )
    )
  );
