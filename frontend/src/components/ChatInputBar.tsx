import { useState, useRef, useEffect } from 'react';
import type { FC, KeyboardEvent as ReactKeyboardEvent, ChangeEvent as ReactChangeEvent } from 'react';
import { Paperclip, Mic, Square, ArrowUp } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { Language } from '../types';

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  onSendAudio: (audioBlob: Blob, transcribedText?: string) => void;
  onUploadPdf: (file: File) => void;
  lang: Language;
  disabled?: boolean;
}

export const ChatInputBar: FC<ChatInputBarProps> = ({
  onSendMessage,
  onSendAudio,
  onUploadPdf,
  lang,
  disabled = false,
}) => {
  const t = TRANSLATIONS[lang];
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ReactChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPdf(file);
      e.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        onSendAudio(audioBlob);
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
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      <div className="relative flex items-center bg-white rounded-xl border border-zinc-300 shadow-xs hover:border-zinc-400 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-100 transition-all p-1.5 pl-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isRecording}
          title={t.uploadPdf}
          className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors shrink-0 disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5 -rotate-45" />
        </button>

        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 px-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-sm font-medium text-zinc-700">
              {t.audioRecording} ({formatTime(recordingTime)})
            </span>
          </div>
        ) : (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={t.placeholder}
            className="flex-1 px-3 py-2 bg-transparent text-sm text-zinc-800 placeholder-zinc-400 focus:outline-hidden disabled:opacity-50"
          />
        )}

        {text.trim() && !isRecording ? (
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled}
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
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="w-10 h-10 rounded-lg bg-[#2e7d32] hover:bg-[#256628] active:bg-[#1d501f] text-white flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
            title="Gravar resposta em voz alta"
          >
            <Mic className="w-5 h-5 stroke-[2]" />
          </button>
        )}
      </div>
    </div>
  );
};
