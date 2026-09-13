import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { createUserClient } from '../_shared/supabaseClient.ts';
import { avaliarResposta } from '../_shared/ai-provider.ts';
import { ehIdioma } from '../_shared/prompts.ts';
import { ErroIA, traduzirErroIA, jsonError } from '../_shared/errors.ts';

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    const supabase = createUserClient(req);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return jsonError('Usuário não autenticado.', 401);
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { questionId, respostaTranscrita, lang } = body as {
      questionId?: string;
      respostaTranscrita?: string;
      lang?: string;
    };
    const idioma = ehIdioma(lang) ? lang : 'PT';

    if (!questionId || !respostaTranscrita) {
      return jsonError("Campos 'questionId' e 'respostaTranscrita' são obrigatórios.", 400);
    }

    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();
    if (questionError || !question) {
      return jsonError('Pergunta não encontrada.', 404);
    }

    const pergunta = {
      enunciado: question.enunciado,
      respostaEsperada: question.resposta_esperada,
      topicosChave: question.topicos_chave,
    };

    const avaliacao = await avaliarResposta(pergunta, respostaTranscrita, idioma);

    const { data: evaluationRow, error: insertError } = await supabase
      .from('evaluations')
      .insert({
        question_id: questionId,
        user_id: userId,
        resposta_aluno: respostaTranscrita,
        correta: avaliacao.correta,
        nota: avaliacao.nota,
        feedback: avaliacao.feedback,
        pontos_acertados: avaliacao.pontosAcertados,
        pontos_faltantes: avaliacao.pontosFaltantes,
        resposta_ideal: avaliacao.respostaIdeal,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    return new Response(JSON.stringify({ evaluationId: evaluationRow.id, ...avaliacao }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (erro) {
    console.error('avaliar falhou:', erro);
    if (erro instanceof ErroIA) {
      const amigavel = traduzirErroIA(erro);
      return jsonError(amigavel.mensagem, amigavel.status);
    }
    return jsonError('Falha inesperada ao avaliar a resposta.', 500);
  }
});
