import assert from 'node:assert/strict';
import {
  INITIAL_LEVELS,
  ACTIVITY_QUESTIONS,
  PHASE_3_IGUANA_WORDS,
  getQuestionByPhaseId,
  validateActivityQuestion,
  validateAllActivityQuestions,
} from '../game-data.ts';
import { isPhonemeAnswerCorrect, normalizePhonemeString } from '../utils.ts';

// 1. Verifica ordem geral das fases 1 a 5 (A, E, I de Iguana, O, U)
const level1Phases = INITIAL_LEVELS[0].phases;
assert.equal(level1Phases.length, 5, 'Nível 1 deve ter exatamente 5 vogais.');
assert.deepEqual(
  level1Phases.map((p) => ({ number: p.number, letter: p.letter })),
  [
    { number: 1, letter: 'A' },
    { number: 2, letter: 'E' },
    { number: 3, letter: 'I' },
    { number: 4, letter: 'O' },
    { number: 5, letter: 'U' },
  ]
);

// 2. Verifica conteúdo dedicado da Fase 3 (I de Iguana)
const phase3 = level1Phases[2];
assert.equal(phase3.id, 'fase-3');
assert.equal(phase3.letter, 'I');
assert.match(phase3.description, /Iguana/i);
assert.ok(
  PHASE_3_IGUANA_WORDS.filter((w) => w.startsWithI).length >= 3,
  'Fase 3 deve conter palavras começando com I para o minijogo.'
);

// 3. Verifica todas as fases e especialmente o Nível 2 ("Floresta dos Fonemas" - Consoantes Amigas)
validateAllActivityQuestions(INITIAL_LEVELS, ACTIVITY_QUESTIONS);

const level2Phases = INITIAL_LEVELS[1].phases;
assert.equal(level2Phases.length, 4, 'Nível 2 deve conter 4 consoantes (B, C, M, P).');

for (const phase of level2Phases) {
  const question = getQuestionByPhaseId(phase.id);
  assert.equal(question.phaseId, phase.id, `Pergunta deve pertencer à ${phase.id}`);
  assert.equal(
    normalizePhonemeString(question.targetLetter),
    normalizePhonemeString(phase.letter),
    `Letra-alvo da ${phase.id} deve coincidir com a fase.`
  );
  validateActivityQuestion(question);

  const matchingOptions = question.options.filter((opt) =>
    isPhonemeAnswerCorrect(opt.letter, question.targetLetter)
  );
  assert.equal(
    matchingOptions.length,
    1,
    `A letra correta "${question.targetLetter}" da ${phase.id} deve estar presente em exatamente 1 opção jogável.`
  );
}

console.log('✅ Todos os testes de integridade das Fases 1-5, Fase 3 (Iguana) e Nível 2 passaram!');
