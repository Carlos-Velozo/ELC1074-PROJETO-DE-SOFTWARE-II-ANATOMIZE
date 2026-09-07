import type { FC } from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { Pergunta, Language } from '../types';

interface QuestionCardProps {
  pergunta: Pergunta;
  lang: Language;
}

export const QuestionCard: FC<QuestionCardProps> = ({ pergunta, lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="flex items-start gap-3.5 max-w-2xl w-full">
      <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center text-white shadow-xs">
        <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
      </div>

      <div className="flex-1 bg-white border border-zinc-200/90 rounded-2xl rounded-tl-xs p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 tracking-wider uppercase">
            <HelpCircle className="w-4 h-4" />
            <span>{t.questionBadge} #{pergunta.id}</span>
          </div>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 capitalize">
            {t.difficulty}: {pergunta.dificuldade}
          </span>
        </div>

        <p className="text-zinc-900 text-[15px] font-medium leading-relaxed">
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
      </div>
    </div>
  );
};
