import { extractText, getDocumentProxy } from 'npm:unpdf@0.12.1';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { createUserClient } from '../_shared/supabaseClient.ts';
import { gerarPerguntas } from '../_shared/ai-provider.ts';
import { ErroIA, traduzirErroIA, jsonError } from '../_shared/errors.ts';

// mesmo orçamento de caracteres usado hoje em backend/routers/questions.py
const MAX_CONTEXT_CHARS_BY_PROVIDER: Record<string, number> = {
  groq: 16_000,
  gemini: 80_000,
};

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

    const form = await req.formData();
    const file = form.get('file');
    const quantidade = Number(form.get('quantidade') ?? 3);
    const sessionId = form.get('sessionId') as string | null;

    if (!(file instanceof File) || file.type !== 'application/pdf') {
      return jsonError('O arquivo enviado deve ser um PDF.', 400);
    }
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 20) {
      return jsonError('A quantidade de perguntas deve estar entre 1 e 20.', 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const textoExtraido = text.trim();

    if (!textoExtraido) {
      return jsonError('Não foi possível extrair texto do PDF.', 422);
    }

    const provider = (Deno.env.get('AI_PROVIDER') || 'groq').toLowerCase();
    const limite = MAX_CONTEXT_CHARS_BY_PROVIDER[provider] ?? MAX_CONTEXT_CHARS_BY_PROVIDER.groq;
    const contexto = textoExtraido.slice(0, limite);

    const perguntas = await gerarPerguntas(contexto, quantidade);

    // cria a sessão (ou reaproveita uma existente, se sessionId veio no form)
    let session;
    if (sessionId) {
      const { data, error } = await supabase
        .from('sessions')
        .update({ pdf_name: file.name, pdf_text: textoExtraido })
        .eq('id', sessionId)
        .select()
        .single();
      if (error) throw error;
      session = data;
    } else {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      const { data, error } = await supabase
        .from('sessions')
        .insert({ user_id: userId, title: cleanTitle, topic: cleanTitle, pdf_name: file.name, pdf_text: textoExtraido })
        .select()
        .single();
      if (error) throw error;
      session = data;
    }

    const pdfStoragePath = `${userId}/${session.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(pdfStoragePath, bytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw uploadError;

    await supabase.from('sessions').update({ pdf_storage_path: pdfStoragePath }).eq('id', session.id);

    const { data: questionRows, error: insertError } = await supabase
      .from('questions')
      .insert(
        perguntas.map((p) => ({
          session_id: session.id,
          user_id: userId,
          ordem: p.ordem,
          enunciado: p.enunciado,
          resposta_esperada: p.respostaEsperada,
          topicos_chave: p.topicosChave,
          dificuldade: p.dificuldade,
        })),
      )
      .select();
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        pdfName: file.name,
        perguntas: questionRows.map((q) => ({
          id: q.id,
          enunciado: q.enunciado,
          respostaEsperada: q.resposta_esperada,
          topicosChave: q.topicos_chave,
          dificuldade: q.dificuldade,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (erro) {
    console.error('upload-pdf falhou:', erro);
    if (erro instanceof ErroIA) {
      const amigavel = traduzirErroIA(erro);
      return jsonError(amigavel.mensagem, amigavel.status);
    }
    return jsonError('Falha inesperada ao processar o PDF.', 500);
  }
});
