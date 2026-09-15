import { createClient } from 'npm:@supabase/supabase-js@2';

// Cria um client autenticado como o próprio usuário que chamou a function
// (repassa o JWT recebido), para que auth.uid() funcione nas queries e as
// políticas de RLS sejam respeitadas — sem precisar da service role key.
export function createUserClient(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Requisição sem cabeçalho Authorization.');
  }

  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
}
