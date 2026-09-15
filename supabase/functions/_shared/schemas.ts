import { DIFICULDADES } from './prompts.ts';

// Groq exige "additionalProperties: false" em todo objeto no modo strict.
export const ESQUEMA_RESPOSTA_GROQ = {
  type: 'object',
  properties: {
    perguntas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          enunciado: { type: 'string' },
          respostaEsperada: { type: 'string' },
          topicosChave: { type: 'array', items: { type: 'string' } },
          dificuldade: { type: 'string', enum: DIFICULDADES },
        },
        required: ['enunciado', 'respostaEsperada', 'topicosChave', 'dificuldade'],
      },
    },
  },
  required: ['perguntas'],
  additionalProperties: false,
};

export const ESQUEMA_AVALIACAO_GROQ = {
  type: 'object',
  properties: {
    nota: { type: 'number' },
    feedback: { type: 'string' },
    pontosAcertados: { type: 'array', items: { type: 'string' } },
    pontosFaltantes: { type: 'array', items: { type: 'string' } },
    respostaIdeal: { type: 'string' },
  },
  required: ['nota', 'feedback', 'pontosAcertados', 'pontosFaltantes', 'respostaIdeal'],
  additionalProperties: false,
};

// Gemini usa um subconjunto de OpenAPI schema; não aceita "additionalProperties".
export const ESQUEMA_RESPOSTA_GEMINI = {
  type: 'object',
  properties: {
    perguntas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          enunciado: { type: 'string' },
          respostaEsperada: { type: 'string' },
          topicosChave: { type: 'array', items: { type: 'string' } },
          dificuldade: { type: 'string', enum: DIFICULDADES },
        },
        required: ['enunciado', 'respostaEsperada', 'topicosChave', 'dificuldade'],
      },
    },
  },
  required: ['perguntas'],
};

export const ESQUEMA_AVALIACAO_GEMINI = {
  type: 'object',
  properties: {
    nota: { type: 'number' },
    feedback: { type: 'string' },
    pontosAcertados: { type: 'array', items: { type: 'string' } },
    pontosFaltantes: { type: 'array', items: { type: 'string' } },
    respostaIdeal: { type: 'string' },
  },
  required: ['nota', 'feedback', 'pontosAcertados', 'pontosFaltantes', 'respostaIdeal'],
};
