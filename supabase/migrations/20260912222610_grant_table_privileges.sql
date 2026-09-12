-- "Automatically expose new tables" estava desligado na criação do projeto,
-- então as tabelas criadas nas migrations não ganharam GRANT nenhum para a
-- role authenticated. RLS controla quais LINHAS um usuário vê; sem o GRANT,
-- ele não pode nem tentar a operação na tabela.

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.sessions,
  public.questions,
  public.evaluations,
  public.chat_messages
to authenticated;
