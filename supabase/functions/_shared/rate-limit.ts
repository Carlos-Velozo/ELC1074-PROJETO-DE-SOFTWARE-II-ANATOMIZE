import type { createUserClient } from './supabaseClient.ts';

export type TipoUsoIA = 'upload_pdf' | 'gerar_perguntas' | 'avaliar' | 'transcribe_audio';

/**
 * Registra uma chamada de IA e diz se ela cabe na cota do usuário. Os limites
 * ficam na função SQL consumir_cota_ia, não aqui e nem no cliente.
 *
 * Falha fechada de propósito: se a RPC não existir (migration não aplicada) ou
 * der erro, o throw sobe e a requisição é rejeitada em vez de passar sem freio.
 * Por isso o `db push` precisa vir antes do deploy das functions.
 */
export async function consumirCotaIA(supabase: ReturnType<typeof createUserClient>, kind: TipoUsoIA): Promise<boolean> {
  const { data, error } = await supabase.rpc('consumir_cota_ia', { p_kind: kind });
  if (error) throw error;

  return data === true;
}
