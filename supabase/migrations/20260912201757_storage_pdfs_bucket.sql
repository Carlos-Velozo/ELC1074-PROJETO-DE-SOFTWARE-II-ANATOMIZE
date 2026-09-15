-- bucket privado para os PDFs enviados pelos alunos
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;

-- convenção de path: {user_id}/{session_id}/{nome-do-arquivo}
-- storage.foldername(name) quebra o path em um array; [1] é o primeiro segmento (user_id)

create policy "pdfs: dono lê"
  on storage.objects
  for select
  using (
    bucket_id = 'pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pdfs: dono envia"
  on storage.objects
  for insert
  with check (
    bucket_id = 'pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pdfs: dono apaga"
  on storage.objects
  for delete
  using (
    bucket_id = 'pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
