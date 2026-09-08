import type { Request, Response } from 'express';
import { serverError, clientError, createData } from '../utils/responseData.ts';

import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

const getMimeTypeFromUrl = (url: string): string => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    webm: 'audio/webm',
  };
  return mimeTypes[ext] || 'audio/mpeg';
};

export const transcribeAudio = async (request: Request, response: Response) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const { audioUrl } = request.body;
    if (!audioUrl) {
      return clientError(response, 'Audio não fornecido');
    }
    if (!audioUrl.startsWith('http://') && !audioUrl.startsWith('https://')) {
      return clientError(response, 'URL do áudio deve começar com http:// ou https://');
    }
    const res = await axios({
      method: 'GET',
      url: audioUrl,
      responseType: 'arraybuffer',
    });

    const contentType = res.headers['content-type'];
    const mimeType =
      (typeof contentType === 'string' ? contentType : null) || getMimeTypeFromUrl(audioUrl) || 'audio/mpeg';

    const audioPart = {
      inlineData: {
        data: Buffer.from(res.data).toString('base64'),
        mimeType,
      },
    };

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        audioPart,
        `Ouça este áudio e forneça uma resposta em JSON com esta exata estrutura:
          {
            "transcription": "A transcrição completa e exata do áudio",
            "summary": "Um resumo conciso do que a pessoa está comunicando",
            "context": "A interpretação da mensagem, significado e intenção por trás das palavras"
          }

          Responda APENAS com o JSON, sem explicações adicionais. Tudo em português.`,
      ],
    });
    const textTranscribed = aiResponse.text || '';

    let parsedResponse;
    try {
      const jsonMatch = textTranscribed.match(/\{[\s\S]*\}/);
      parsedResponse = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : {
            transcription: textTranscribed,
            summary: '',
            context: '',
          };
    } catch {
      parsedResponse = {
        transcription: textTranscribed,
        summary: '',
        context: '',
      };
    }

    return createData(response, parsedResponse);
  } catch (error) {
    if (error instanceof Error) {
      console.log('erro:', error);
      return serverError(response, `Não foi possível realizar a transcrição. Motivo: ${error.message} `);
    }
  }
};

export const transcribeAudioFile = async (request: Request, response: Response) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const file = (request as any).file;
    if (!file) {
      return clientError(response, 'Arquivo de áudio não fornecido');
    }

    const mimeType = file.mimetype || getMimeTypeFromUrl(file.originalname) || 'audio/mpeg';

    const audioPart = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType,
      },
    };

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        audioPart,
        `Ouça este áudio e forneça uma resposta em JSON com esta exata estrutura:
        {
          "transcription": "A transcrição completa e exata do áudio",
          "summary": "Um resumo conciso do que a pessoa está comunicando",
          "context": "A interpretação da mensagem, significado e intenção por trás das palavras"
        }

        Responda APENAS com o JSON, sem explicações adicionais. Tudo em português.`,
      ],
    });
    const textTranscribed = aiResponse.text || '';

    let parsedResponse;
    try {
      const jsonMatch = textTranscribed.match(/\{[\s\S]*\}/);
      parsedResponse = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : {
            transcription: textTranscribed,
            summary: '',
            context: '',
          };
    } catch {
      parsedResponse = {
        transcription: textTranscribed,
        summary: '',
        context: '',
      };
    }

    return createData(response, parsedResponse);
  } catch (error) {
    if (error instanceof Error) {
      console.log('erro:', error);
      return serverError(response, `Não foi possível realizar a transcrição. Motivo: ${error.message} `);
    }
  }
};
