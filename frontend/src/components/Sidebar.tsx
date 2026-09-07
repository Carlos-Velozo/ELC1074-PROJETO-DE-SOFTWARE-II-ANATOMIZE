import type { FC } from 'react';
import { Plus, Search, HelpCircle, LogOut, X, BookOpen } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { StudySession, Language } from '../types';

interface SidebarProps {
  sessions: StudySession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewStudy: () => void;
  lang: Language;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenHelp: () => void;
}

export const Sidebar: FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewStudy,
  lang,
  searchQuery,
  onSearchChange,
  isOpenMobile,
  onCloseMobile,
  onOpenHelp,
}) => {
  const t = TRANSLATIONS[lang];

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#212121] text-zinc-200 flex flex-col transition-transform duration-200 ease-in-out border-r border-[#2d2d2d] select-none ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-700/80 border border-zinc-600 flex items-center justify-center text-white shadow-xs">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-emerald-400"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
                <path d="m9 16 2 2 4-4" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">
              Anatomize
            </span>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 py-2">
          <button
            onClick={() => {
              onNewStudy();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 active:bg-zinc-700 border border-zinc-700/60 text-sm font-medium text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{t.newStudy}</span>
          </button>
        </div>

        <div className="px-3 py-1.5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchChat}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 focus:bg-zinc-800 text-sm text-zinc-200 placeholder-zinc-400 border border-transparent focus:border-zinc-600 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="px-4 pt-4 pb-1">
          <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
            {t.history}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-zinc-700">
          {filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors group ${isActive
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                  }`}
              >
                <span className="shrink-0 text-zinc-400 group-hover:text-emerald-400 transition-colors">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span className="truncate flex-1">{session.title}</span>
              </button>
            );
          })}

          {filteredSessions.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-zinc-400">
              {t.noConversations}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-zinc-800 space-y-1">
          <button
            onClick={onOpenHelp}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t.help}</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Deseja realmente sair?')) {
                onNewStudy();
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
