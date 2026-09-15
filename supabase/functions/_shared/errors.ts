// Porta backend/services/errors.py::traduzir_erro_ia
//
// As functions devolvem um CÓDIGO estável em vez de uma frase pronta: quem sabe
// o idioma do aluno é o frontend (TRANSLATIONS.errors), não o servidor. O campo
// "error" continua vindo em português como fallback para logs e curl.

import { corsHeaders } from './cors.ts';

export class ErroIA extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export type CodigoErro =
  | 'NAO_AUTENTICADO'
  | 'CAMPOS_OBRIGATORIOS'
  | 'PDF_INVALIDO'
  | 'PDF_MUITO_GRANDE'
  | 'PDF_SEM_TEXTO'
  | 'QUANTIDADE_INVALIDA'
  | 'SESSAO_NAO_ENCONTRADA'
  | 'SESSAO_SEM_PDF'
  | 'PERGUNTA_NAO_ENCONTRADA'
  | 'COTA_EXCEDIDA'
  | 'IA_SOBRECARREGADA'
  | 'IA_MODELO_INDISPONIVEL'
  | 'IA_AUTENTICACAO'
  | 'IA_INDISPONIVEL'
  | 'FALHA_INESPERADA';

const MENSAGENS_PT: Record<CodigoErro, string> = {
  NAO_AUTENTICADO: 'Usuário não autenticado.',
  CAMPOS_OBRIGATORIOS: 'Faltam campos obrigatórios na requisição.',
  PDF_INVALIDO: 'O arquivo enviado deve ser um PDF.',
  PDF_MUITO_GRANDE: 'O PDF deve ter no máximo 20 MB.',
  PDF_SEM_TEXTO: 'Não foi possível extrair texto do PDF.',
  QUANTIDADE_INVALIDA: 'A quantidade de perguntas deve estar entre 1 e 20.',
  SESSAO_NAO_ENCONTRADA: 'Sessão não encontrada.',
  SESSAO_SEM_PDF: 'Esta sessão não tem um PDF processado.',
  PERGUNTA_NAO_ENCONTRADA: 'Pergunta não encontrada.',
  COTA_EXCEDIDA: 'Você fez muitas solicitações à IA. Aguarde alguns minutos e tente novamente.',
  IA_SOBRECARREGADA: 'A IA está recebendo muitas solicitações agora. Aguarde um minuto e tente novamente.',
  IA_MODELO_INDISPONIVEL: 'O modelo de IA configurado não está disponível no momento. Avise a equipe.',
  IA_AUTENTICACAO: 'Falha de autenticação com o serviço de IA. Avise a equipe para verificar a chave de API.',
  IA_INDISPONIVEL: 'O serviço de IA está indisponível no momento. Tente novamente em instantes.',
  FALHA_INESPERADA: 'Não foi possível processar a solicitação agora. Tente novamente em instantes.',
};

export interface ErroAmigavel {
  status: number;
  codigo: CodigoErro;
}

export function traduzirErroIA(erro: ErroIA): ErroAmigavel {
  const codigo = erro.status;

  if (codigo === 429) return { status: 429, codigo: 'IA_SOBRECARREGADA' };
  if (codigo === 404) return { status: 503, codigo: 'IA_MODELO_INDISPONIVEL' };
  if (codigo === 401 || codigo === 403) return { status: 503, codigo: 'IA_AUTENTICACAO' };
  if (typeof codigo === 'number' && codigo >= 500) return { status: 503, codigo: 'IA_INDISPONIVEL' };

  return { status: 503, codigo: 'IA_INDISPONIVEL' };
}

export function jsonError(codigo: CodigoErro, status: number): Response {
  return new Response(JSON.stringify({ code: codigo, error: MENSAGENS_PT[codigo] }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
