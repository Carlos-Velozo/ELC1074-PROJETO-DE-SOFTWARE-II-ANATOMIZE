import type { ChatMessage, EvaluationData, Pergunta, StudySession } from '../types';
import { supabase } from './supabaseClient';
import { FunctionsHttpError } from '@supabase/supabase-js';

async function extrairMensagemDeErro(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === 'string') return body.error;
    } catch {
      // corpo não era JSON, cai no fallback abaixo
    }
  }
  if (error instanceof Error) return error.message;
  return 'Erro desconhecido ao conectar ao backend.';
}

function formatarHorario(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function mapearPergunta(row: {
  id: string;
  enunciado: string;
  resposta_esperada: string;
  topicos_chave: string[];
  dificuldade: string;
}): Pergunta {
  return {
    id: row.id,
    enunciado: row.enunciado,
    respostaEsperada: row.resposta_esperada,
    topicosChave: row.topicos_chave,
    dificuldade: row.dificuldade as Pergunta['dificuldade'],
  };
}

function mapearAvaliacao(row: {
  correta: boolean;
  nota: number;
  feedback: string;
  pontos_acertados: string[];
  pontos_faltantes: string[];
  resposta_ideal: string;
}): EvaluationData {
  return {
    correta: row.correta,
    nota: row.nota,
    feedback: row.feedback,
    pontosAcertados: row.pontos_acertados,
    pontosFaltantes: row.pontos_faltantes,
    respostaIdeal: row.resposta_ideal,
  };
}

export const apiService = {

  async uploadPdf(
    file: File,
    quantidade = 3,
  ): Promise<{ sessionId: string; title: string; perguntas: Pergunta[]; pdfName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quantidade', String(quantidade));

    const { data, error } = await supabase.functions.invoke('upload-pdf', { body: formData });
    if (error) throw new Error(await extrairMensagemDeErro(error));

    return data;
  },

  async avaliarResposta(questionId: string, respostaTranscrita: string): Promise<EvaluationData & { evaluationId: string }> {
    const { data, error } = await supabase.functions.invoke('avaliar', {
      body: { questionId, respostaTranscrita },
    });
    if (error) throw new Error(await extrairMensagemDeErro(error));

    return data;
  },

  async listarSessions(): Promise<StudySession[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, current_question:questions!sessions_current_question_fk(*)')
      .order('updated_at', { ascending: false });
    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      topic: row.topic,
      pdfName: row.pdf_name ?? undefined,
      currentQuestion: row.current_question ? mapearPergunta(row.current_question) : undefined,
      messages: [],
      updatedAt: row.updated_at,
    }));
  },

  async carregarMensagens(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, question:questions(*), evaluation:evaluations(*)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      sender: row.sender,
      type: row.type,
      content: row.content ?? undefined,
      pergunta: row.question ? mapearPergunta(row.question) : undefined,
      evaluation: row.evaluation ? mapearAvaliacao(row.evaluation) : undefined,
      timestamp: formatarHorario(row.created_at),
    }));
  },

  async inserirMensagemTexto(sessionId: string, userId: string, content: string): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ session_id: sessionId, user_id: userId, sender: 'user', type: 'text', content })
      .select()
      .single();
    if (error) throw error;

    return {
      id: data.id,
      sender: 'user',
      type: 'text',
      content: data.content,
      timestamp: formatarHorario(data.created_at),
    };
  },

  async inserirMensagensDePerguntas(sessionId: string, userId: string, perguntas: Pergunta[]): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(
        perguntas.map((p) => ({
          session_id: sessionId,
          user_id: userId,
          sender: 'assistant' as const,
          type: 'question' as const,
          question_id: p.id,
        })),
      )
      .select();
    if (error) throw error;

    return data.map((row, idx) => ({
      id: row.id,
      sender: 'assistant',
      type: 'question',
      pergunta: perguntas[idx],
      timestamp: formatarHorario(row.created_at),
    }));
  },

  async inserirMensagemAvaliacao(
    sessionId: string,
    userId: string,
    evaluationId: string,
    evaluation: EvaluationData,
  ): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        sender: 'assistant',
        type: 'evaluation',
        evaluation_id: evaluationId,
      })
      .select()
      .single();
    if (error) throw error;

    return {
      id: data.id,
      sender: 'assistant',
      type: 'evaluation',
      evaluation,
      timestamp: formatarHorario(data.created_at),
    };
  },

  async definirPerguntaAtual(sessionId: string, questionId: string): Promise<void> {
    const { error } = await supabase.from('sessions').update({ current_question_id: questionId }).eq('id', sessionId);
    if (error) throw error;
  },

  // devolve o título de fato gravado: o contador "(1)", "(2)" para nomes repetidos
  // é resolvido no servidor, então pode diferir do que foi digitado
  async renomearSession(sessionId: string, title: string): Promise<string> {
    const { data, error } = await supabase.rpc('rename_session', {
      p_session_id: sessionId,
      p_new_title: title,
    });
    if (error) throw error;

    return data as string;
  },
};
