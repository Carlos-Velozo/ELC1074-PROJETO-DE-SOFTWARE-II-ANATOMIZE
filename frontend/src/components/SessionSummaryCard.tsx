import { useState } from 'react';
import type { FC } from 'react';
import { Award, CheckCircle2, TrendingUp, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { Language, SessionSummaryStats } from '../types';
import { formatarNota } from '../services/idioma';

interface SessionSummaryCardProps {
  stats: SessionSummaryStats;
  lang: Language;
}

export const SessionSummaryCard: FC<SessionSummaryCardProps> = ({ stats, lang }) => {
  const t = TRANSLATIONS[lang];
  const [isExpanded, setIsExpanded] = useState(true);

  const isAprovado = stats.notaMedia >= 7.0;
  const taxaAcerto = stats.totalRespondidas > 0
    ? Math.round((stats.acertos / stats.totalRespondidas) * 100)
    : 0;

  return (
    <div className="flex items-start gap-3.5 max-w-2xl w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Avatar do assistente alinhado com QuestionCard e EvaluationCard */}
      <div className="w-8 h-8 rounded-lg bg-[#2e7d32] shrink-0 flex items-center justify-center text-white shadow-xs">
        <Award className="w-4.5 h-4.5 text-white" />
      </div>

      {/* Corpo do Card */}
      <div className="flex-1 bg-white border border-emerald-300/80 rounded-2xl rounded-tl-xs p-4 sm:p-5 space-y-4 shadow-2xs">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3.5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{t.sessionCompletedBadge}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              {t.sessionSummaryTitle}
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {t.sessionSummarySubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors shrink-0 cursor-pointer"
            title={isExpanded ? t.hideSummary : t.viewSummary}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Conteúdo Expansível */}
        {isExpanded && (
          <div className="space-y-4 pt-0.5">
            {/* Grid de Indicadores Principais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Nota Média */}
              <div
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isAprovado
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  {t.averageScore}
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span
                    className={`text-2xl font-bold tracking-tight ${
                      isAprovado ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {formatarNota(stats.notaMedia, lang)}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">/ 10</span>
                </div>
              </div>

              {/* Acertos */}
              <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/80 flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                  {t.correctCount}
                </span>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-zinc-800 tracking-tight">
                    {stats.acertos}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium ml-1">
                    / {stats.totalRespondidas}
                  </span>
                </div>
              </div>

              {/* Erros */}
              <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/80 flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <X className="w-3 h-3 text-amber-600 stroke-[2.5]" />
                  {t.incorrectCount}
                </span>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-zinc-800 tracking-tight">
                    {stats.erros}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium ml-1">
                    / {stats.totalRespondidas}
                  </span>
                </div>
              </div>

              {/* Concluídas */}
              <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/80 flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  {t.completionRate}
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-zinc-800 tracking-tight">
                    {taxaAcerto}%
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    ({stats.totalRespondidas}/{stats.totalPerguntas})
                  </span>
                </div>
              </div>
            </div>

            {/* Seções Detalhadas no padrão de EvaluationCard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              {/* Pontos a Melhorar */}
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-100 text-amber-900 space-y-1.5">
                <span className="font-semibold flex items-center gap-1 text-[11px] text-amber-700 uppercase tracking-wide">
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  {t.summaryPointsMissing}
                </span>
                {stats.pontosFaltantes.length > 0 ? (
                  <>
                    <p className="text-[11px] text-amber-800/90 leading-tight">
                      {t.summaryPointsMissingDesc}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-zinc-700 text-xs pt-0.5">
                      {stats.pontosFaltantes.map((ponto, i) => (
                        <li key={i} className="leading-relaxed">{ponto}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-emerald-800 italic pt-1">
                    {t.noPointsMissing}
                  </p>
                )}
              </div>

              {/* Conceitos Dominados */}
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-900 space-y-1.5">
                <span className="font-semibold flex items-center gap-1 text-[11px] text-emerald-700 uppercase tracking-wide">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  {t.summaryPointsCorrect}
                </span>
                {stats.pontosAcertados.length > 0 ? (
                  <>
                    <p className="text-[11px] text-emerald-800/90 leading-tight">
                      {t.summaryPointsCorrectDesc}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-zinc-700 text-xs pt-0.5">
                      {stats.pontosAcertados.map((ponto, i) => (
                        <li key={i} className="leading-relaxed">{ponto}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-zinc-500 italic pt-1">—</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
