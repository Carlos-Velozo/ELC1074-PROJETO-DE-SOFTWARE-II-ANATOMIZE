import { montarPrompt, montarPromptAvaliacao, DIFICULDADES } from './prompts.ts';
import {
  ESQUEMA_RESPOSTA_GROQ,
  ESQUEMA_AVALIACAO_GROQ,
  ESQUEMA_RESPOSTA_GEMINI,
  ESQUEMA_AVALIACAO_GEMINI,
} from './schemas.ts';
import { ErroIA } from './errors.ts';

const MAXIMO_TENTATIVAS = 5;
const MODELO_GROQ_PADRAO = 'openai/gpt-oss-20b';
const MODELO_GEMINI_PADRAO = 'gemini-3.5-flash-lite';

export interface Pergunta {
  ordem: number;
  enunciado: string;
  respostaEsperada: string;
  topicosChave: string[];
  dificuldade: string;
}

export interface Avaliacao {
  correta: boolean;
  nota: number;
  feedback: string;
  pontosAcertados: string[];
  pontosFaltantes: string[];
  respostaIdeal: string;
}

function provider(): 'groq' | 'gemini' {
  return (Deno.env.get('AI_PROVIDER') || 'groq').toLowerCase() === 'gemini' ? 'gemini' : 'groq';
}

// --- chamadas brutas às APIs, retornam o texto JSON (ainda não parseado) ---

async function chamarGroq(prompt: string, schemaName: string, schema: object, temperature: number): Promise<string> {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) throw new ErroIA('GROQ_API_KEY não configurada nos secrets da function.');
  const modelo = Deno.env.get('GROQ_MODEL') || MODELO_GROQ_PADRAO;

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelo,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      response_format: {
        type: 'json_schema',
        json_schema: { name: schemaName, strict: true, schema },
      },
    }),
  });

  if (!resp.ok) {
    const corpo = await resp.json().catch(() => null);
    const codigo = corpo?.error?.code;
    const erro = new ErroIA(corpo?.error?.message || `Groq respondeu ${resp.status}`, resp.status);
    (erro as ErroIA & { jsonValidateFailed?: boolean }).jsonValidateFailed = codigo === 'json_validate_failed';
    throw erro;
  }

  const data = await resp.json();
  const texto = data?.choices?.[0]?.message?.content;
  if (!texto) throw new ErroIA('A API não retornou conteúdo. O conteúdo pode ter sido bloqueado.');
  return texto;
}

async function chamarGemini(prompt: string, schema: object, temperature: number): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new ErroIA('GEMINI_API_KEY não configurada nos secrets da function.');
  const modelo = Deno.env.get('GEMINI_MODEL') || MODELO_GEMINI_PADRAO;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature,
        },
      }),
    },
  );

  if (!resp.ok) {
    const corpo = await resp.json().catch(() => null);
    throw new ErroIA(corpo?.error?.message || `Gemini respondeu ${resp.status}`, resp.status);
  }

  const data = await resp.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new ErroIA('A API não retornou um JSON válido.');
  return texto;
}

// --- geração de perguntas ---

export async function gerarPerguntas(contexto: string, quantidade: number): Promise<Pergunta[]> {
  const usarGemini = provider() === 'gemini';
  let ultimaQuantidade = 0;

  for (let tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa++) {
    let prompt = montarPrompt(contexto, quantidade);
    if (tentativa > 1) {
      prompt += `\n\nEsta é a tentativa ${tentativa}. A resposta anterior foi inválida. Gere um JSON válido com exatamente ${quantidade} perguntas.`;
    }

    let textoResposta: string;
    try {
      textoResposta = usarGemini
        ? await chamarGemini(prompt, ESQUEMA_RESPOSTA_GEMINI, 0.2)
        : await chamarGroq(prompt, 'perguntas_anatomia', ESQUEMA_RESPOSTA_GROQ, 0.2);
    } catch (erro) {
      const ehRetentavel = (erro as ErroIA & { jsonValidateFailed?: boolean }).jsonValidateFailed;
      if (ehRetentavel && tentativa < MAXIMO_TENTATIVAS) continue;
      throw erro;
    }

    let resultado: unknown;
    try {
      resultado = JSON.parse(textoResposta);
    } catch {
      if (tentativa < MAXIMO_TENTATIVAS) continue;
      throw new ErroIA('A API retornou perguntas que não formam um JSON válido.');
    }

    const perguntas = (resultado as { perguntas?: unknown[] })?.perguntas;
    ultimaQuantidade = Array.isArray(perguntas) ? perguntas.length : 0;

    if (ultimaQuantidade !== quantidade || !validarPerguntas(perguntas)) {
      continue;
    }

    return (perguntas as Omit<Pergunta, 'ordem'>[]).map((p, indice) => ({ ordem: indice + 1, ...p }));
  }

  throw new ErroIA(
    `Após ${MAXIMO_TENTATIVAS} tentativas, a API retornou ${ultimaQuantidade} perguntas; eram esperadas ${quantidade}.`,
  );
}

function validarPerguntas(perguntas: unknown): perguntas is Omit<Pergunta, 'ordem'>[] {
  if (!Array.isArray(perguntas)) return false;
  return perguntas.every((p) => {
    if (typeof p !== 'object' || p === null) return false;
    const pergunta = p as Record<string, unknown>;
    if (typeof pergunta.enunciado !== 'string' || !pergunta.enunciado.trim()) return false;
    if (typeof pergunta.respostaEsperada !== 'string' || !pergunta.respostaEsperada.trim()) return false;
    if (!Array.isArray(pergunta.topicosChave) || pergunta.topicosChave.length === 0) return false;
    if (!pergunta.topicosChave.every((t) => typeof t === 'string' && t.trim())) return false;
    if (!DIFICULDADES.includes(pergunta.dificuldade as typeof DIFICULDADES[number])) return false;
    return true;
  });
}

// --- avaliação de resposta ---

const NOTA_MINIMA_CORRETA = 7.0;

export async function avaliarResposta(
  pergunta: { enunciado: string; respostaEsperada: string; topicosChave: string[] },
  respostaAluno: string,
): Promise<Avaliacao> {
  const usarGemini = provider() === 'gemini';
  const promptBase = montarPromptAvaliacao(pergunta, respostaAluno.trim());

  for (let tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa++) {
    let prompt = promptBase;
    if (tentativa > 1) {
      prompt += `\n\nEsta é a tentativa ${tentativa}. A resposta anterior não formou um JSON válido. Responda novamente respeitando o esquema.`;
    }

    let textoResposta: string;
    try {
      textoResposta = usarGemini
        ? await chamarGemini(prompt, ESQUEMA_AVALIACAO_GEMINI, 0.1)
        : await chamarGroq(prompt, 'avaliacao_resposta', ESQUEMA_AVALIACAO_GROQ, 0.1);
    } catch (erro) {
      const ehRetentavel = (erro as ErroIA & { jsonValidateFailed?: boolean }).jsonValidateFailed;
      if (ehRetentavel && tentativa < MAXIMO_TENTATIVAS) continue;
      throw erro;
    }

    let avaliacao: Record<string, unknown>;
    try {
      avaliacao = JSON.parse(textoResposta);
    } catch {
      if (tentativa < MAXIMO_TENTATIVAS) continue;
      throw new ErroIA('Após as tentativas, a avaliação permaneceu inválida.');
    }

    if (!validarAvaliacao(avaliacao)) {
      if (tentativa < MAXIMO_TENTATIVAS) continue;
      throw new ErroIA('Após as tentativas, a avaliação permaneceu inválida.');
    }

    return {
      correta: (avaliacao.nota as number) >= NOTA_MINIMA_CORRETA,
      nota: avaliacao.nota as number,
      feedback: avaliacao.feedback as string,
      pontosAcertados: avaliacao.pontosAcertados as string[],
      pontosFaltantes: avaliacao.pontosFaltantes as string[],
      respostaIdeal: avaliacao.respostaIdeal as string,
    };
  }

  throw new ErroIA('Não foi possível avaliar a resposta.');
}

function validarAvaliacao(avaliacao: Record<string, unknown>): boolean {
  const nota = avaliacao.nota;
  if (typeof nota !== 'number' || nota < 0 || nota > 10) return false;
  if (typeof avaliacao.feedback !== 'string' || !avaliacao.feedback.trim()) return false;
  if (typeof avaliacao.respostaIdeal !== 'string' || !avaliacao.respostaIdeal.trim()) return false;
  for (const campo of ['pontosAcertados', 'pontosFaltantes']) {
    const itens = avaliacao[campo];
    if (!Array.isArray(itens) || !itens.every((i) => typeof i === 'string' && i.trim())) return false;
  }
  return true;
}
