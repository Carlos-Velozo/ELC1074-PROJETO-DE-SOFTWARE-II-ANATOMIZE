import { useState } from 'react';
import type { FC } from 'react';
import { Award, CheckCircle2, AlertCircle, TrendingUp, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { Language, SessionSummaryStats } from '../types';

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
    <section 
      aria-label={t.sessionSummaryTitle}
      className="w-full bg-white border border-emerald-200/90 rounded-2xl shadow-xs overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-emerald-50 via-emerald-50/40 to-white px-5 py-4 border-b border-emerald-100 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase mb-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t.sessionCompletedBadge}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              {t.sessionSummaryTitle}
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              {t.sessionSummarySubtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-zinc-500 hover:text-zinc-800 p-1.5 rounded-lg hover:bg-emerald-100/50 transition-colors shrink-0 cursor-pointer"
          title={isExpanded ? t.hideSummary : t.viewSummary}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Conteúdo Expansível */}
      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Grid de Métricas Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Nota Média */}
            <div className={`rounded-xl p-3.5 border flex flex-col justify-between ${
              isAprovado 
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50/60 border-amber-200 text-amber-950'
            }`}>
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                {t.averageScore}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-bold tracking-tight ${
                  isAprovado ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {stats.notaMedia.toFixed(1)}
                </span>
                <span className="text-xs text-zinc-400 font-medium">/ 10</span>
              </div>
            </div>

            {/* Acertos */}
            <div className="rounded-xl p-3.5 border border-zinc-200 bg-zinc-50/60 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
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
            <div className="rounded-xl p-3.5 border border-zinc-200 bg-zinc-50/60 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <X className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
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

            {/* Taxa de Aproveitamento */}
            <div className="rounded-xl p-3.5 border border-zinc-200 bg-zinc-50/60 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                {t.completionRate}
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-zinc-800 tracking-tight">
                  {taxaAcerto}%
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  ({stats.totalRespondidas}/{stats.totalPerguntas})
                </span>
              </div>
            </div>
          </div>

          {/* Seção Detalhada: Pontos a Melhorar e Conceitos Dominados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Pontos a Melhorar */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    {t.summaryPointsMissing}
                  </h3>
                </div>
              </div>

              {stats.pontosFaltantes.length > 0 ? (
                <>
                  <p className="text-[11px] text-amber-800 leading-normal">
                    {t.summaryPointsMissingDesc}
                  </p>
                  <ul className="space-y-1.5 pt-1">
                    {stats.pontosFaltantes.map((ponto, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{ponto}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-xs text-emerald-800 italic bg-white/70 rounded-lg p-2.5 border border-emerald-100">
                  {t.noPointsMissing}
                </p>
              )}
            </div>

            {/* Conceitos Dominados */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    {t.summaryPointsCorrect}
                  </h3>
                </div>
              </div>

              {stats.pontosAcertados.length > 0 ? (
                <>
                  <p className="text-[11px] text-emerald-800 leading-normal">
                    {t.summaryPointsCorrectDesc}
                  </p>
                  <ul className="space-y-1.5 pt-1">
                    {stats.pontosAcertados.map((ponto, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{ponto}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-xs text-zinc-500 italic bg-white/70 rounded-lg p-2.5 border border-zinc-200">
                  —
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
