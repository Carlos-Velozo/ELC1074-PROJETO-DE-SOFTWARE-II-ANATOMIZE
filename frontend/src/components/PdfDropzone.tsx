import { useRef, useState } from 'react';
import type { FC, DragEvent as ReactDragEvent, ChangeEvent as ReactChangeEvent } from 'react';
import { Paperclip, Sparkles } from 'lucide-react';
import { TRANSLATIONS, QUANTIDADES_PERGUNTAS } from '../types';
import type { Language } from '../types';
import { QuestionCountPicker } from './QuestionCountPicker';

const MAX_PDF_BYTES = 20 * 1024 * 1024;

interface PdfDropzoneProps {
  onUploadPdf: (file: File, quantidade: number) => void;
  lang: Language;
  isProcessing: boolean;
  processingStatus: string;
}

export const PdfDropzone: FC<PdfDropzoneProps> = ({ onUploadPdf, lang, isProcessing, processingStatus }) => {
  const t = TRANSLATIONS[lang];
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number>(QUANTIDADES_PERGUNTAS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // conveniência para o aluno; a validação que vale é a da Edge Function
  const validarEEnviar = (file: File) => {
    const ehPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!ehPdf) {
      setLocalError(t.dropzoneInvalidType);
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setLocalError(t.dropzoneTooLarge);
      return;
    }
    setLocalError(null);
    onUploadPdf(file, quantidade);
  };

  const handleFileChange = (e: ReactChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validarEEnviar(file);
    e.target.value = '';
  };

  const handleDrop = (e: ReactDragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) validarEEnviar(file);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#2e7d32] mb-4 shadow-2xs select-none">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-3.79c-2.35-.37-4.18-2.22-4.55-4.57.94-.13 1.94.1 2.68.65.94.7 1.87 2.05 1.87 3.71v4zm2 0v-4c0-1.66.93-3.01 1.87-3.71.74-.55 1.74-.78 2.68-.65-.37 2.35-2.2 4.2-4.55 4.57V16.5z" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-zinc-800 mb-2 select-none">{t.startTitle}</h2>
      <p className="text-sm text-zinc-500 leading-relaxed max-w-md mb-4 select-none">{t.startSubtitle}</p>

      {/* fora do dropzone: um <select> dentro de um <button> seria HTML inválido */}
      <div className="mb-4">
        <QuestionCountPicker value={quantidade} onChange={setQuantidade} lang={lang} disabled={isProcessing} />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isProcessing) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        disabled={isProcessing}
        className={`w-full rounded-2xl border-2 border-dashed px-6 py-10 transition-colors ${
          isProcessing
            ? 'border-emerald-200 bg-emerald-50/60 cursor-default'
            : isDragging
              ? 'border-[#2e7d32] bg-emerald-50 cursor-pointer'
              : 'border-zinc-300 hover:border-[#2e7d32] hover:bg-emerald-50/40 cursor-pointer'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-3 text-sm italic text-zinc-600">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
            <span>{processingStatus || t.generatingQuestions}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 select-none">
            <Paperclip className="w-6 h-6 text-zinc-400 -rotate-45" />
            <span className="text-sm font-medium text-zinc-700">{t.dropzoneCta}</span>
            <span className="text-xs text-zinc-400">{t.dropzoneHint}</span>
          </div>
        )}
      </button>

      {localError && <p className="mt-3 text-xs text-amber-700">{localError}</p>}
    </div>
  );
};
