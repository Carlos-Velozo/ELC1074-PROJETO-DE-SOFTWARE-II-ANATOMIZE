import { assert, assertEquals, assertFalse, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  ehIdioma,
  idiomaDaRequisicao,
  montarPrompt,
  montarPromptAvaliacao,
  montarPromptTranscricao,
  sufixoTentativaAvaliacao,
  sufixoTentativaGeracao,
} from './prompts.ts';

const pergunta = {
  enunciado: 'Quais são os tipos de osso?',
  respostaEsperada: 'Longos, curtos, planos e irregulares.',
  topicosChave: ['longos', 'curtos'],
};

Deno.test('ehIdioma só aceita PT e ES exatamente', () => {
  assert(ehIdioma('PT'));
  assert(ehIdioma('ES'));
  assertFalse(ehIdioma('es'));
  assertFalse(ehIdioma('ES-es'));
  assertFalse(ehIdioma(undefined));
  assertFalse(ehIdioma(null));
});

Deno.test('idiomaDaRequisicao devolve PT quando o valor é inválido', () => {
  assertEquals(idiomaDaRequisicao('ES', 'teste'), 'ES');
  assertEquals(idiomaDaRequisicao('es', 'teste'), 'PT');
  assertEquals(idiomaDaRequisicao(null, 'teste'), 'PT');
});

Deno.test('prompt de geração repete a instrução de idioma depois do contexto', () => {
  const prompt = montarPrompt('texto do PDF em português', 3, 'ES');
  const fimDoContexto = prompt.indexOf('</contexto>');

  assert(fimDoContexto > -1);
  assert(prompt.indexOf('Recordatorio final') > fimDoContexto);
  // a dificuldade continua em português por causa do CHECK no banco
  assertStringIncludes(prompt.slice(fimDoContexto), '"dificuldade" permanece en portugués');
});

Deno.test('prompt de avaliação repete a instrução de idioma depois da resposta do aluno', () => {
  const prompt = montarPromptAvaliacao(pergunta, 'os ossos longos...', 'ES');

  assert(prompt.indexOf('Recordatorio final') > prompt.indexOf('</resposta_do_aluno>'));
});

Deno.test('prompts em PT usam o lembrete em português', () => {
  assertStringIncludes(montarPrompt('contexto', 3, 'PT'), 'Lembrete final');
  assertStringIncludes(montarPromptAvaliacao(pergunta, 'resposta', 'PT'), 'Lembrete final');
});

Deno.test('prompt de transcrição não força português e proíbe traduzir', () => {
  const prompt = montarPromptTranscricao('ES');

  assertFalse(prompt.includes('Tudo em português'));
  assertStringIncludes(prompt, 'Nunca traduza');
  assertStringIncludes(prompt, 'espanhol');
});

Deno.test('prompt de transcrição sem idioma não informa idioma esperado', () => {
  const prompt = montarPromptTranscricao();

  assertFalse(prompt.includes('idioma esperado'));
  assertStringIncludes(prompt, 'Nunca traduza');
});

Deno.test('sufixos de nova tentativa seguem o idioma', () => {
  assertStringIncludes(sufixoTentativaGeracao(2, 5, 'ES'), 'español');
  assertStringIncludes(sufixoTentativaGeracao(2, 5, 'PT'), 'português');
  assertStringIncludes(sufixoTentativaAvaliacao(2, 'ES'), 'español');
  assertStringIncludes(sufixoTentativaAvaliacao(2, 'PT'), 'português');
});
