import type { FC } from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';
import { TRANSLATIONS, DIFFICULTY_LABELS } from '../types';
import type { Pergunta, Language } from '../types';

interface QuestionCardProps {
  pergunta: Pergunta;
  lang: Language;
  isActive?: boolean;
  onSelect?: () => void;
}

export const QuestionCard: FC<QuestionCardProps> = ({ pergunta, lang, isActive, onSelect }) => {
  const t = TRANSLATIONS[lang];
  const dificuldade = DIFFICULTY_LABELS[lang][pergunta.dificuldade] ?? pergunta.dificuldade;

  return (
    <div className="flex items-start gap-3.5 max-w-2xl w-full">
      <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center text-white shadow-xs">
        <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
      </div>

      {/* o card inteiro era um <button>, o que impedia selecionar o enunciado;
          escolher a pergunta agora é um botão próprio no rodapé */}
      <div
        className={`flex-1 bg-white border rounded-2xl rounded-tl-xs p-4 space-y-3 shadow-2xs transition-colors ${
          isActive ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-zinc-200/90'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 tracking-wider uppercase">
            <HelpCircle className="w-4 h-4" />
            <span>{t.questionBadge} #{pergunta.ordem}</span>
          </div>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 capitalize">
            {t.difficulty}: {dificuldade}
          </span>
        </div>

        <p className="text-zinc-900 text-[15px] font-medium leading-relaxed selection:bg-emerald-100">
          {pergunta.enunciado}
        </p>

        {pergunta.topicosChave?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-zinc-400">{t.keyTopics}:</span>
            {pergunta.topicosChave.map((topico, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200/60 text-zinc-600"
              >
                {topico}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          {isActive ? (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 select-none">
              {t.answeringThis}
            </span>
          ) : (
            <button
              type="button"
              onClick={onSelect}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-zinc-300 text-zinc-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              {t.answerThis}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
