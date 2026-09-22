import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { createUserClient } from '../_shared/supabaseClient.ts';
import { consumirCotaIA } from '../_shared/rate-limit.ts';
import { ErroIA, traduzirErroIA, jsonError } from '../_shared/errors.ts';

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const PROMPT = `Ouça este áudio e forneça uma resposta em JSON com esta exata estrutura:
{
  "transcription": "A transcrição completa e exata do áudio",
  "summary": "Um resumo conciso do que a pessoa está comunicando",
  "context": "A interpretação da mensagem, significado e intenção por trás das palavras"
}

Responda APENAS com o JSON, sem explicações adicionais. Tudo em português.`;

function bytesParaBase64(bytes: Uint8Array): string {
  const tamanhoDoBloco = 0x8000;
  let binario = '';
  for (let inicio = 0; inicio < bytes.length; inicio += tamanhoDoBloco) {
    binario += String.fromCharCode(...bytes.subarray(inicio, inicio + tamanhoDoBloco));
  }
  return btoa(binario);
}

function normalizarMimeType(file: File): string {
  const mimeType = file.type.split(';', 1)[0].toLowerCase();
  if (mimeType === 'audio/mp4' || mimeType === 'audio/x-m4a') return 'audio/mp4';
  if (mimeType === 'audio/mpeg' || mimeType === 'audio/wav' || mimeType === 'audio/ogg' || mimeType === 'audio/flac') {
    return mimeType;
  }
  if (mimeType === 'audio/webm') return 'audio/webm';

  const extensao = file.name.split('.').pop()?.toLowerCase();
  const porExtensao: Record<string, string> = {
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    webm: 'audio/webm',
  };
  return porExtensao[extensao || ''] || 'audio/webm';
}

function parseResposta(texto: string): { transcription: string; summary: string; context: string } {
  const match = texto.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const resultado = JSON.parse(match[0]);
      return {
        transcription: typeof resultado.transcription === 'string' ? resultado.transcription : '',
        summary: typeof resultado.summary === 'string' ? resultado.summary : '',
        context: typeof resultado.context === 'string' ? resultado.context : '',
      };
    } catch {
      // Usa o texto bruto como transcrição quando o modelo não respeitar o JSON.
    }
  }
  return { transcription: texto, summary: '', context: '' };
}

async function transcrever(bytes: Uint8Array, mimeType: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new ErroIA('GEMINI_API_KEY não configurada nos secrets da function.');

  const modelo = Deno.env.get('GEMINI_TRANSCRIPTION_MODEL') || 'gemini-2.5-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ inline_data: { mime_type: mimeType, data: bytesParaBase64(bytes) } }, { text: PROMPT }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ErroIA(body?.error?.message || `Gemini respondeu ${response.status}`, response.status);
  }

  const body = await response.json();
  const partes = body?.candidates?.[0]?.content?.parts;
  const texto = Array.isArray(partes)
    ? partes
        .filter((parte) => typeof parte?.text === 'string')
        .map((parte) => parte.text)
        .join('')
    : '';
  if (typeof texto !== 'string' || !texto.trim()) {
    throw new ErroIA('A API não retornou uma transcrição válida.');
  }
  return parseResposta(texto);
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    const supabase = createUserClient(req);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return jsonError('NAO_AUTENTICADO', 401);
    if (!(await consumirCotaIA(supabase, 'transcribe_audio'))) return jsonError('COTA_EXCEDIDA', 429);

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return jsonError('CAMPOS_OBRIGATORIOS', 400);
    if (file.size === 0 || file.size > MAX_AUDIO_BYTES) return jsonError('FALHA_INESPERADA', 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = normalizarMimeType(file);
    const resultado = await transcrever(bytes, mimeType);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (erro) {
    console.error('transcribe-audio falhou:', erro);
    if (erro instanceof ErroIA) {
      const amigavel = traduzirErroIA(erro);
      return jsonError(amigavel.codigo, amigavel.status);
    }
    return jsonError('FALHA_INESPERADA', 500);
  }
});
