import type { FC } from 'react';
import { Globe } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { Language } from '../types';

interface LanguageToggleProps {
  lang: Language;
  onToggle: () => void;
  className?: string;
}

const IDIOMAS: Language[] = ['PT', 'ES'];

// mostra os dois idiomas e destaca o ativo; "PT / ES" não dizia qual estava valendo
export const LanguageToggle: FC<LanguageToggleProps> = ({ lang, onToggle, className = '' }) => {
  const t = TRANSLATIONS[lang];

  return (
    <button
      type="button"
      onClick={onToggle}
      title={t.changeLanguage}
      aria-label={t.changeLanguage}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 hover:border-zinc-400 bg-white text-xs hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer ${className}`}
    >
      <Globe className="w-3.5 h-3.5 text-zinc-500" />
      <span className="flex items-center gap-1">
        {IDIOMAS.map((idioma, indice) => (
          <span key={idioma} className="flex items-center gap-1">
            {indice > 0 && <span className="text-zinc-300">|</span>}
            <span className={idioma === lang ? 'font-bold text-emerald-700' : 'font-medium text-zinc-400'}>
              {idioma}
            </span>
          </span>
        ))}
      </span>
    </button>
  );
};
