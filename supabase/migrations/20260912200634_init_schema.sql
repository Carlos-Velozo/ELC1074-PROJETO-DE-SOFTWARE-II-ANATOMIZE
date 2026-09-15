-- 1. profiles: dados extras do usuário, 1:1 com auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: dono lê/edita"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- trigger: cria a linha em profiles automaticamente no signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. sessions: mapeia StudySession do frontend
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  topic text not null default '',
  pdf_name text,
  pdf_storage_path text,
  pdf_text text,
  current_question_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "sessions: dono"
  on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. questions: perguntas geradas pela IA para uma sessão
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ordem int not null,
  enunciado text not null,
  resposta_esperada text not null,
  topicos_chave text[] not null default '{}',
  dificuldade text not null check (dificuldade in ('básica', 'intermediária', 'avançada')),
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

create policy "questions: dono"
  on public.questions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- agora que questions existe, liga a FK pendente de sessions.current_question_id
alter table public.sessions
  add constraint sessions_current_question_fk
  foreign key (current_question_id) references public.questions(id) on delete set null;

-- 4. evaluations: resultado da avaliação de uma resposta
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  resposta_aluno text not null,
  correta boolean not null,
  nota numeric(4, 2) not null check (nota >= 0 and nota <= 10),
  feedback text not null,
  pontos_acertados text[] not null default '{}',
  pontos_faltantes text[] not null default '{}',
  resposta_ideal text not null,
  created_at timestamptz not null default now()
);

alter table public.evaluations enable row level security;

create policy "evaluations: dono"
  on public.evaluations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. chat_messages: histórico de mensagens exibido no chat
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null check (sender in ('user', 'assistant')),
  type text not null check (type in ('text', 'question', 'evaluation')),
  content text,
  question_id uuid references public.questions(id) on delete set null,
  evaluation_id uuid references public.evaluations(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "chat_messages: dono"
  on public.chat_messages
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- mantém sessions.updated_at em dia a cada nova mensagem
create function public.touch_session_updated_at()
returns trigger as $$
begin
  update public.sessions set updated_at = now() where id = new.session_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_chat_message_insert
  after insert on public.chat_messages
  for each row execute procedure public.touch_session_updated_at();

-- índices de consulta mais comuns
create index sessions_user_updated_idx on public.sessions (user_id, updated_at desc);
create index questions_session_ordem_idx on public.questions (session_id, ordem);
create index chat_messages_session_created_idx on public.chat_messages (session_id, created_at);
