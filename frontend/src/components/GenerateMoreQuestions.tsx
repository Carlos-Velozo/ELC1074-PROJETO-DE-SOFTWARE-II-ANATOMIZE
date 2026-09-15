import { useState } from 'react';
import type { FC } from 'react';
import { Plus } from 'lucide-react';
import { TRANSLATIONS, QUANTIDADES_PERGUNTAS } from '../types';
import type { Language } from '../types';
import { QuestionCountPicker } from './QuestionCountPicker';

interface GenerateMoreQuestionsProps {
  onGenerate: (quantidade: number) => void;
  lang: Language;
  disabled?: boolean;
}

export const GenerateMoreQuestions: FC<GenerateMoreQuestionsProps> = ({ onGenerate, lang, disabled }) => {
  const t = TRANSLATIONS[lang];
  const [quantidade, setQuantidade] = useState<number>(QUANTIDADES_PERGUNTAS[0]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
      <QuestionCountPicker value={quantidade} onChange={setQuantidade} lang={lang} disabled={disabled} />

      <button
        type="button"
        onClick={() => onGenerate(quantidade)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:border-[#2e7d32] hover:text-[#2e7d32] hover:bg-emerald-50/60 disabled:opacity-50 disabled:cursor-default transition-colors cursor-pointer shadow-2xs"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{t.generateMore}</span>
      </button>
    </div>
  );
};
