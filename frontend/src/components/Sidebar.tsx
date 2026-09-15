import { useState } from 'react';
import type { FC, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { Plus, Search, HelpCircle, LogOut, X, BookOpen, Pencil } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { StudySession, Language } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

const MAX_TITLE_LENGTH = 120;

interface SidebarProps {
  sessions: StudySession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewStudy: () => void;
  onRenameSession: (id: string, title: string) => void;
  lang: Language;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenHelp: () => void;
  user: User | null;
  onSignOut: () => void;
}

export const Sidebar: FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewStudy,
  onRenameSession,
  lang,
  searchQuery,
  onSearchChange,
  isOpenMobile,
  onCloseMobile,
  onOpenHelp,
  user,
  onSignOut,
}) => {
  const t = TRANSLATIONS[lang];
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // display_name é texto livre que o próprio usuário edita, então o e-mail (que
  // vem do JWT) fica visível logo abaixo — é ele que responde "qual conta é esta".
  const displayName = user?.user_metadata?.display_name?.trim() || user?.email?.split('@')[0] || '—';
  const initial = displayName.charAt(0).toUpperCase();

  const startRenaming = (session: StudySession) => {
    setRenamingId(session.id);
    setDraftTitle(session.title);
  };

  const cancelRenaming = () => {
    setRenamingId(null);
    setDraftTitle('');
  };

  const commitRename = (session: StudySession) => {
    const novoTitulo = draftTitle.trim();
    cancelRenaming();

    // nada a fazer se ficou vazio ou não mudou — evita ida ao servidor
    if (!novoTitulo || novoTitulo === session.title) return;
    onRenameSession(session.id, novoTitulo);
  };

  const handleRenameKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>, session: StudySession) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename(session);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRenaming();
    }
  };

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
            aria-label={t.closeMenu}
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

            if (renamingId === session.id) {
              return (
                <div key={session.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-800">
                  <BookOpen className="w-4 h-4 shrink-0 text-emerald-400" />
                  <input
                    type="text"
                    autoFocus
                    value={draftTitle}
                    maxLength={MAX_TITLE_LENGTH}
                    title={t.renameHint}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => handleRenameKeyDown(e, session)}
                    onBlur={() => commitRename(session)}
                    className="min-w-0 flex-1 rounded-sm bg-zinc-900 px-2 py-1 text-sm text-white border border-zinc-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              );
            }

            return (
              <div
                key={session.id}
                className={`group flex items-center rounded-lg transition-colors ${isActive
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                  }`}
              >
                <button
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }}
                  onDoubleClick={() => startRenaming(session)}
                  className="min-w-0 flex-1 flex items-center gap-2.5 px-3 py-2.5 text-sm text-left"
                >
                  <span className="shrink-0 text-zinc-400 group-hover:text-emerald-400 transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <span className="truncate flex-1">{session.title}</span>
                </button>

                <button
                  onClick={() => startRenaming(session)}
                  title={t.rename}
                  aria-label={`${t.rename}: ${session.title}`}
                  className="shrink-0 mr-1.5 p-1.5 rounded-md text-zinc-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-white hover:bg-zinc-700 focus:outline-hidden transition-opacity"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
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

          <div className="flex items-center gap-2.5 px-3 py-2 border-t border-zinc-800 mt-1 pt-3">
            <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-900/60 border border-emerald-700 flex items-center justify-center text-sm font-semibold text-emerald-300">
              {initial}
            </div>
            <div className="min-w-0 flex-1" title={`${t.loggedInAs}: ${user?.email ?? ''}`}>
              <p className="truncate text-sm font-medium text-zinc-100">{displayName}</p>
              <p className="truncate text-xs text-zinc-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => setIsConfirmingLogout(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={isConfirmingLogout}
        title={t.confirmLogout}
        description={t.confirmLogoutDescription}
        confirmLabel={t.confirm}
        cancelLabel={t.cancel}
        onConfirm={() => {
          setIsConfirmingLogout(false);
          onSignOut();
        }}
        onCancel={() => setIsConfirmingLogout(false)}
      />
    </>
  );
};
