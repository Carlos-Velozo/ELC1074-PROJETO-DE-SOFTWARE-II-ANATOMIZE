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

const MAX_PDF_BYTES = 20 * 1024 * 1024;

// file.name é controlado pelo cliente e vai virar caminho no Storage. As policies
// do bucket conferem que o primeiro segmento é o auth.uid(), então um nome com
// "../" é uma tentativa de escapar da pasta do usuário.
function sanitizarNomeArquivo(nome: string): string {
  const base = nome.split(/[\\/]/).pop() ?? '';
  const limpo = base
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^[._-]+/, '')
    .slice(0, 100);
  return limpo || 'documento.pdf';
}

// file.type vem do navegador e é forjável; os magic bytes não.
function pareceMesmoPdf(bytes: Uint8Array): boolean {
  const assinatura = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
  return assinatura.every((byte, i) => bytes[i] === byte);
}

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

    // corta antes de req.formData(), que carregaria o corpo inteiro em memória
    const tamanhoDeclarado = Number(req.headers.get('content-length') ?? 0);
    if (tamanhoDeclarado > MAX_PDF_BYTES) {
      return jsonError('O PDF deve ter no máximo 20 MB.', 413);
    }

    const form = await req.formData();
    const file = form.get('file');
    const quantidade = Number(form.get('quantidade') ?? 3);

    if (!(file instanceof File) || file.type !== 'application/pdf') {
      return jsonError('O arquivo enviado deve ser um PDF.', 400);
    }
    if (file.size > MAX_PDF_BYTES) {
      return jsonError('O PDF deve ter no máximo 20 MB.', 413);
    }
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 20) {
      return jsonError('A quantidade de perguntas deve estar entre 1 e 20.', 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!pareceMesmoPdf(bytes)) {
      return jsonError('O arquivo enviado deve ser um PDF.', 400);
    }

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

    // uma sessão sempre nasce de um upload, e o PDF dela é imutável depois disso
    const pdfName = sanitizarNomeArquivo(file.name);
    const tituloBase = pdfName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

    // unique_session_title devolve "base", "base (1)", "base (2)"... conforme o
    // que o usuário já tem. O retry cobre a corrida entre dois uploads paralelos,
    // barrada pelo índice sessions_user_title_uniq (23505).
    let session;
    for (let tentativa = 0; ; tentativa++) {
      const { data: titulo, error: tituloError } = await supabase
        .rpc('unique_session_title', { p_base: tituloBase });
      if (tituloError) throw tituloError;

      const { data, error } = await supabase
        .from('sessions')
        .insert({ user_id: userId, title: titulo, topic: titulo, pdf_name: pdfName, pdf_text: textoExtraido })
        .select()
        .single();

      if (!error) {
        session = data;
        break;
      }
      if (error.code !== '23505' || tentativa >= 3) throw error;
    }

    const pdfStoragePath = `${userId}/${session.id}/${pdfName}`;
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
        title: session.title,
        pdfName,
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
