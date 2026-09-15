import type { FC } from 'react';
import { TRANSLATIONS, QUANTIDADES_PERGUNTAS } from '../types';
import type { Language } from '../types';

interface QuestionCountPickerProps {
  value: number;
  onChange: (quantidade: number) => void;
  lang: Language;
  disabled?: boolean;
}

/** usado no upload do PDF e ao gerar mais perguntas numa sessão existente */
export const QuestionCountPicker: FC<QuestionCountPickerProps> = ({ value, onChange, lang, disabled }) => {
  const t = TRANSLATIONS[lang];

  return (
    <label className="inline-flex items-center gap-2 text-xs text-zinc-500">
      <span>{t.questionCount}:</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400 focus:border-[#2e7d32] focus:outline-hidden disabled:opacity-50 cursor-pointer"
      >
        {QUANTIDADES_PERGUNTAS.map((quantidade) => (
          <option key={quantidade} value={quantidade}>
            {quantidade}
          </option>
        ))}
      </select>
    </label>
  );
};
