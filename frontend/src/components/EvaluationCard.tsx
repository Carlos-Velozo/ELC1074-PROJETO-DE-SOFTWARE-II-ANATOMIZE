import type { FC } from 'react';
import { CheckCircle2, AlertCircle, GraduationCap, Check, X } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { EvaluationData, Language } from '../types';

interface EvaluationCardProps {
  evaluation: EvaluationData;
  lang: Language;
}

export const EvaluationCard: FC<EvaluationCardProps> = ({ evaluation, lang }) => {
  const t = TRANSLATIONS[lang];
  const isAprovado = evaluation.nota >= 7.0;

  return (
    <div className="flex items-start gap-3.5 max-w-2xl w-full">
      <div className="w-8 h-8 rounded-lg bg-[#2e7d32] shrink-0 flex items-center justify-center text-white shadow-xs">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4.5 h-4.5"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-3.79c-2.35-.37-4.18-2.22-4.55-4.57.94-.13 1.94.1 2.68.65.94.7 1.87 2.05 1.87 3.71v4zm2 0v-4c0-1.66.93-3.01 1.87-3.71.74-.55 1.74-.78 2.68-.65-.37 2.35-2.2 4.2-4.55 4.57V16.5z" />
        </svg>
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${isAprovado
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
          >
            {isAprovado ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{evaluation.nota.toFixed(1)} / 10</span>
          </div>
        </div>

        <p className="text-zinc-800 text-[15px] leading-relaxed font-normal">
          {evaluation.feedback}
        </p>

        {(evaluation.pontosAcertados?.length > 0 || evaluation.pontosFaltantes?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            {evaluation.pontosAcertados?.length > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-900 space-y-1">
                <span className="font-semibold flex items-center gap-1 text-[11px] text-emerald-700 uppercase tracking-wide">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  {t.pointsCorrect}
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-700">
                  {evaluation.pontosAcertados.map((ponto, i) => (
                    <li key={i} className="truncate">{ponto}</li>
                  ))}
                </ul>
              </div>
            )}

            {evaluation.pontosFaltantes?.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 text-amber-900 space-y-1">
                <span className="font-semibold flex items-center gap-1 text-[11px] text-amber-700 uppercase tracking-wide">
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  {t.pointsMissing}
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-700">
                  {evaluation.pontosFaltantes.map((ponto, i) => (
                    <li key={i} className="truncate">{ponto}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {evaluation.respostaIdeal && (
          <div className="bg-[#fcfdfa] border-l-4 border-[#2e7d32] border-y border-r border-zinc-200/80 rounded-r-lg p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2e7d32] uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" />
              <span>{t.modelAnswerHeader}</span>
            </div>
            <p className="text-zinc-700 text-sm leading-relaxed">
              {evaluation.respostaIdeal}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
