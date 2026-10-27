-- chat_messages.question_id só era preenchida nas mensagens de pergunta; a resposta
-- do aluno (type = 'text') não dizia a qual pergunta pertencia, e a tela só
-- conseguia mostrá-la solta, no fim da lista. A partir de agora a resposta também
-- grava a pergunta respondida, para o chat agrupar resposta e avaliação sob o enunciado.
--
-- Backfill do histórico: a avaliação é gravada logo depois da resposta, então a
-- pergunta da resposta é a da avaliação que vem na mensagem seguinte da sessão.
-- Respostas cuja avaliação falhou não têm como ser ligadas e ficam com null.

with proxima as (
  select
    m.id,
    lead(m.type) over w as proximo_tipo,
    lead(m.evaluation_id) over w as proxima_avaliacao
  from public.chat_messages m
  window w as (partition by m.session_id order by m.created_at, m.id)
)
update public.chat_messages t
set question_id = e.question_id
from proxima p
join public.evaluations e on e.id = p.proxima_avaliacao
where t.id = p.id
  and t.type = 'text'
  and t.question_id is null
  and p.proximo_tipo = 'evaluation';

-- a avaliação também passa a gravar a pergunta (o frontend já lia por evaluations)
update public.chat_messages cm
set question_id = e.question_id
from public.evaluations e
where cm.evaluation_id = e.id
  and cm.type = 'evaluation'
  and cm.question_id is null;

create index chat_messages_session_question_idx
  on public.chat_messages (session_id, question_id);
