import type { Language } from '../types';

const LANG_STORAGE_KEY = 'anatomize:lang';

/** locale usado no <html lang> e na formatação de números */
export const LOCALES: Record<Language, string> = {
  PT: 'pt-BR',
  ES: 'es',
};

/**
 * Idioma do navegador/aparelho, na ordem de preferência da pessoa: o primeiro
 * idioma que o app suporta vence, e qualquer outro cai em português.
 */
export function detectarIdiomaDoNavegador(): Language {
  if (typeof navigator === 'undefined') return 'PT';

  const preferidos = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const preferido of preferidos) {
    const base = preferido?.toLowerCase().split('-')[0];
    if (base === 'es') return 'ES';
    if (base === 'pt') return 'PT';
  }
  return 'PT';
}

// o idioma também decide em que língua a IA gera perguntas, transcreve a voz e dá
// feedback, então a escolha manual é lembrada. Sem escolha, vale o do navegador:
// um celular novo não deveria abrir em português só porque nunca apertou o botão.
export function lerIdiomaInicial(): Language {
  try {
    const salvo = localStorage.getItem(LANG_STORAGE_KEY);
    if (salvo === 'PT' || salvo === 'ES') return salvo;
  } catch {
    // navegador sem storage (aba anônima, cookies bloqueados): cai na detecção
  }
  return detectarIdiomaDoNavegador();
}

export function salvarIdioma(lang: Language): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // sem storage: o idioma vale só até recarregar a página
  }
}

/** nota de 0 a 10 com o separador decimal do idioma (7,5 em PT/ES, não 7.5) */
export function formatarNota(nota: number, lang: Language): string {
  return nota.toLocaleString(LOCALES[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
