// Porta backend/services/errors.py::traduzir_erro_ia

import { corsHeaders } from './cors.ts';

export class ErroIA extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export interface ErroAmigavel {
  status: number;
  mensagem: string;
}

export function traduzirErroIA(erro: ErroIA): ErroAmigavel {
  const codigo = erro.status;

  if (codigo === 429) {
    return {
      status: 429,
      mensagem: 'A IA está recebendo muitas solicitações agora. Aguarde um minuto e tente novamente.',
    };
  }
  if (codigo === 404) {
    return {
      status: 503,
      mensagem: 'O modelo de IA configurado não está disponível no momento. Avise a equipe.',
    };
  }
  if (codigo === 401 || codigo === 403) {
    return {
      status: 503,
      mensagem: 'Falha de autenticação com o serviço de IA. Avise a equipe para verificar a chave de API.',
    };
  }
  if (typeof codigo === 'number' && codigo >= 500) {
    return {
      status: 503,
      mensagem: 'O serviço de IA está indisponível no momento. Tente novamente em instantes.',
    };
  }

  return {
    status: 503,
    mensagem: 'Não foi possível processar a solicitação com a IA agora. Tente novamente em instantes.',
  };
}

export function jsonError(mensagem: string, status: number): Response {
  return new Response(JSON.stringify({ error: mensagem }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
