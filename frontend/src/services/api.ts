import type { Pergunta, EvaluationData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// FastAPI's HTTPException returns {"detail": "..."} with a friendly, already
// translated message (see backend/services/errors.py) — read that instead of
// dumping the raw response body.
async function extrairMensagemDeErro(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') return data.detail;
  } catch {
    // resposta não era JSON, cai no fallback abaixo
  }
  return response.statusText || 'Erro desconhecido ao conectar ao backend.';
}

export const apiService = {

  async uploadPdf(file: File, quantidade = 3): Promise<{ perguntas: Pergunta[]; pdfName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quantidade', String(quantidade));

    const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await extrairMensagemDeErro(response));
    }

    return await response.json();
  },

  async avaliarResposta(pergunta: Pergunta, respostaAluno: string, audioBlob?: Blob): Promise<EvaluationData> {
    let body: BodyInit;
    const headers: Record<string, string> = {};

    if (audioBlob) {
      const formData = new FormData();
      formData.append('pergunta', JSON.stringify(pergunta));
      formData.append('audio', audioBlob, 'resposta.webm');
      formData.append('resposta_transcrita', respostaAluno);
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({
        pergunta,
        resposta_transcrita: respostaAluno,
      });
    }

    const response = await fetch(`${API_BASE_URL}/avaliar`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(await extrairMensagemDeErro(response));
    }

    return await response.json();
  },
};
