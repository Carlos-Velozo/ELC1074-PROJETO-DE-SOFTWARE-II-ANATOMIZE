import { useState, useRef, useEffect } from 'react';
import type { FC, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { FileText, Mic, Square, ArrowUp } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { Language } from '../types';

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  onTranscribeAudio: (audioBlob: Blob) => Promise<string>;
  onTranscriptionError: (error: unknown) => void;
  /** nome do PDF já preso à sessão; ele é imutável, por isso é só exibição */
  pdfName?: string;
  /** sem pergunta selecionada não há o que responder, então a caixa fica travada */
  hasSelectedQuestion: boolean;
  lang: Language;
  disabled?: boolean;
}

export const ChatInputBar: FC<ChatInputBarProps> = ({
  onSendMessage,
  onTranscribeAudio,
  onTranscriptionError,
  pdfName,
  hasSelectedQuestion,
  lang,
  disabled = false,
}) => {
  const t = TRANSLATIONS[lang];
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const isLocked = disabled || !hasSelectedQuestion;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSend = () => {
    if (!text.trim() || isLocked) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const formatos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
      const mimeType = formatos.find((formato) => MediaRecorder.isTypeSupported(formato));
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || mimeType || 'audio/webm',
        });
        stream.getTracks().forEach((track) => track.stop());
        setIsTranscribing(true);
        try {
          const transcription = await onTranscribeAudio(audioBlob);
          const textoTranscrito = transcription.trim();
          if (textoTranscrito) {
            setText(textoTranscrito);
            requestAnimationFrame(() => inputRef.current?.focus());
          }
        } catch (error) {
          console.error('Erro ao transcrever áudio:', error);
          onTranscriptionError(error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acessar o microfone. Verifique as permissões no navegador.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {pdfName && (
        <div
          title={`${t.attachedPdf}: ${pdfName}`}
          className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600"
        >
          <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
          <span className="truncate">{pdfName}</span>
        </div>
      )}

      <div className="relative flex items-center bg-white rounded-xl border border-zinc-300 shadow-xs hover:border-zinc-400 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-100 transition-all p-1.5 pl-3">
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 px-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-sm font-medium text-zinc-700">
              {t.audioRecording} ({formatTime(recordingTime)})
            </span>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLocked || isTranscribing}
            placeholder={hasSelectedQuestion ? t.answerPlaceholder : t.selectQuestionFirst}
            className="flex-1 px-3 py-2 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 focus:outline-hidden disabled:opacity-50"
          />
        )}

        {text.trim() && !isRecording && !isTranscribing ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={isLocked}
            className="w-10 h-10 rounded-lg bg-[#2e7d32] hover:bg-[#256628] active:bg-[#1d501f] text-white flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="w-10 h-10 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
            title={t.stopRecording}
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        ) : isTranscribing ? (
          <span className="px-3 text-xs text-zinc-500">{t.processingAudio}</span>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={isLocked}
            className="w-10 h-10 rounded-lg bg-[#2e7d32] hover:bg-[#256628] active:bg-[#1d501f] text-white flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
            title={t.recordAnswer}
          >
            <Mic className="w-5 h-5 stroke-[2]" />
          </button>
        )}
      </div>
    </div>
  );
};
