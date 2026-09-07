import { X, FileUp, Mic, GraduationCap } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { Language } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export function HelpModal({ isOpen, onClose, lang }: HelpModalProps) {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-800">
            {t.helpTitle}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-800 mb-1">{t.helpStep1Title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {t.helpStep1Desc}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-800 mb-1">{t.helpStep2Title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {t.helpStep2Desc}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-800 mb-1">{t.helpStep3Title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {t.helpStep3Desc}
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-100 bg-zinc-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors cursor-pointer w-full"
          >
            {t.closeHelp}
          </button>
        </div>

      </div>
    </div>
  );
}
