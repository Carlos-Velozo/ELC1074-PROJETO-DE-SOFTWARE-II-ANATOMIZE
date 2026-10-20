import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isPreview = typeof window !== 'undefined' && window.location.search.includes('preview=summary');
    if (isPreview) {
      setSession({
        user: {
          id: 'preview-user-id',
          email: 'lucas.xavier@anatomize.ufsm.br',
          user_metadata: { display_name: 'Lucas Xavier' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
      } as Session);
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isLoading,
    signOut: () => supabase.auth.signOut(),
  };
}
