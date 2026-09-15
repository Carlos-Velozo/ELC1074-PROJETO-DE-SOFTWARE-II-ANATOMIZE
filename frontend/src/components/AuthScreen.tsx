import { useState } from 'react';
import { AlertTriangle, Globe } from 'lucide-react';
import { TRANSLATIONS } from '../types';
import type { Language } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthScreenProps {
  lang: Language;
  onToggleLanguage: () => void;
}

export function AuthScreen({ lang, onToggleLanguage }: AuthScreenProps) {
  const t = TRANSLATIONS[lang];
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (signUpError) throw signUpError;
        setSuccessMessage(t.authSignupSuccess);
        setMode('login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-white text-zinc-900 font-sans px-4">
      {/* o idioma escolhido aqui já vale para as perguntas e o feedback da IA */}
      <button
        type="button"
        onClick={onToggleLanguage}
        title={t.changeLanguage}
        className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 hover:border-zinc-400 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
      >
        <Globe className="w-3.5 h-3.5 text-zinc-500" />
        <span>{lang === 'PT' ? 'PT / ES' : 'ES / PT'}</span>
      </button>

      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-zinc-800 mb-6 text-center">
          {mode === 'login' ? t.authLoginTitle : t.authSignupTitle}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">{t.authDisplayName}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">{t.authEmail}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">{t.authPassword}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 transition-colors"
          >
            {mode === 'login' ? t.authLoginButton : t.authSignupButton}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === 'login' ? 'signup' : 'login'));
            setError(null);
            setSuccessMessage(null);
          }}
          className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-zinc-700"
        >
          {mode === 'login' ? t.authToggleToSignup : t.authToggleToLogin}
        </button>
      </div>
    </div>
  );
}
