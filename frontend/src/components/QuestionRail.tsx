import { useEffect, useState } from 'react';
import type { FC, RefObject } from 'react';
import { TRANSLATIONS, idDoBlocoPergunta } from '../types';
import type { GrupoPergunta, Language } from '../types';

/**
 * Id da pergunta cujo bloco ocupa a faixa superior da área de rolagem. Observa só
 * uma faixa fina perto do topo, então apenas um bloco por vez a cruza.
 */
function usePerguntaVisivel(
  ids: (number | string)[],
  containerRef: RefObject<HTMLElement | null>,
): string | null {
  const [visivel, setVisivel] = useState<string | null>(null);
  // a lista muda de identidade a cada render; a chave mantém o effect estável
  const chave = ids.join('|');

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !chave) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setVisivel(entry.target.id.replace(/^q-/, ''));
        }
      },
      { root: container, rootMargin: '0px 0px -75% 0px' },
    );

    for (const id of chave.split('|')) {
      const el = document.getElementById(idDoBlocoPergunta(id));
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [chave, containerRef]);

  return visivel;
}

interface QuestionRailProps {
  grupos: GrupoPergunta[];
  currentQuestionId?: number | string;
  containerRef: RefObject<HTMLElement | null>;
  lang: Language;
}

/** marcadores no canto da tela, um por pergunta, para voltar rápido a qualquer uma */
export const QuestionRail: FC<QuestionRailProps> = ({ grupos, currentQuestionId, containerRef, lang }) => {
  const t = TRANSLATIONS[lang];
  const visivel = usePerguntaVisivel(
    grupos.map((g) => g.pergunta.id),
    containerRef,
  );

  if (grupos.length < 2) return null;

  const irPara = (id: number | string) =>
    document.getElementById(idDoBlocoPergunta(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <nav
      aria-label={t.questionNavLabel}
      className="absolute right-1.5 md:right-3 top-1/2 -translate-y-1/2 z-10 max-h-[60%] overflow-y-auto flex flex-col items-center gap-1.5 py-2 px-1 rounded-full bg-white/80 backdrop-blur-sm border border-zinc-200/80 shadow-xs [scrollbar-width:none]"
    >
      {grupos.map(({ pergunta, respostas }) => {
        const id = String(pergunta.id);
        const respondida = respostas.some((r) => r.type === 'evaluation');
        const atual = String(currentQuestionId) === id;
        const naTela = visivel === id;
        const estado = respondida ? t.questionNavAnswered : atual ? t.questionNavCurrent : t.questionNavPending;

        const cor = respondida
          ? 'bg-emerald-500 text-white border-emerald-500'
          : 'bg-white text-zinc-500 border-zinc-300 hover:border-emerald-400 hover:text-emerald-700';

        return (
          <div key={id} className="relative group">
            <button
              type="button"
              onClick={() => irPara(pergunta.id)}
              aria-label={`${t.questionBadge} ${pergunta.ordem} (${estado})`}
              aria-current={naTela ? 'true' : undefined}
              className={`flex items-center justify-center rounded-full border text-[10px] font-bold leading-none transition-all cursor-pointer ${cor} ${
                naTela ? 'w-6 h-6 ring-2 ring-emerald-300' : 'w-5 h-5'
              } ${atual && !respondida ? 'ring-2 ring-emerald-200 border-emerald-400' : ''}`}
            >
              {pergunta.ordem}
            </button>

            {/* só em telas com hover: no toque o tooltip ficaria preso sobre o texto */}
            <div
              role="tooltip"
              className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden w-56 rounded-lg bg-zinc-900 px-3 py-2 text-[11px] leading-snug text-white opacity-0 shadow-lg transition-opacity [@media(hover:hover)]:block group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <span className="block font-bold tracking-wide text-emerald-300">
                {t.questionBadge} #{pergunta.ordem} · {estado}
              </span>
              <span className="line-clamp-3">{pergunta.enunciado}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
};
