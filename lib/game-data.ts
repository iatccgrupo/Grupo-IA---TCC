import {
  LevelInfo,
  ActivityQuestion,
  ActivityOption,
  Medal,
  BnccSkill,
  ParentTip,
} from './types';
import { isPhonemeAnswerCorrect, normalizePhonemeString } from './utils';

export const AVATAR_OPTIONS = [
  { id: 'fox', name: 'Pipoca', desc: 'A Raposinha Curiosa', emoji: '🦊', color: 'bg-orange-100 border-orange-400' },
  { id: 'bear', name: 'Teddy', desc: 'O Ursinho Amigo', emoji: '🐻', color: 'bg-amber-100 border-amber-400' },
  { id: 'owl', name: 'Sabichona', desc: 'A Corujinha Sábia', emoji: '🦉', color: 'bg-blue-100 border-blue-400' },
  { id: 'lion', name: 'Juba', desc: 'O Leãozinho Valente', emoji: '🦁', color: 'bg-yellow-100 border-yellow-400' },
  { id: 'astronaut', name: 'Astro', desc: 'O Explorador Espacial', emoji: '🚀', color: 'bg-indigo-100 border-indigo-400' },
  { id: 'dino', name: 'Dino', desc: 'O Dinossauro Brincalhão', emoji: '🦕', color: 'bg-emerald-100 border-emerald-400' },
  { id: 'cat', name: 'Mia', desc: 'A Gatinha Esperta', emoji: '🐱', color: 'bg-pink-100 border-pink-400' },
  { id: 'dolphin', name: 'Fred', desc: 'O Golfinho Saltador', emoji: '🐬', color: 'bg-cyan-100 border-cyan-400' },
];

/**
 * Estrutura oficial e ordenada das fases (BNCC - Alfabetização Lúdica):
 * Nível 1 (Vogais):
 * - Fase 1: Vogal A (Abelha)
 * - Fase 2: Vogal E (Elefante)
 * - Fase 3: Vogal I (Iguana) [Reposicionada imediatamente após a Fase 2]
 * - Fase 4: Vogal O (Ovelha)
 * - Fase 5: Vogal U (Uva)
 * Nível 2 (Floresta dos Fonemas - Consoantes Amigas): B, C, M, P
 * Nível 3 (Reino das Palavras Mágicas): Sílabas, Rimas e Desafio Final
 */
export const INITIAL_LEVELS: LevelInfo[] = [
  {
    id: 1,
    name: 'Nível 1: Ilha das Vogais',
    subtitle: 'Descobrindo os primeiros sons mágicos do alfabeto',
    badge: 'Vogais A-E-I-O-U',
    accentColor: 'from-blue-500 to-cyan-500',
    phases: [
      {
        id: 'fase-1',
        number: 1,
        levelId: 1,
        title: 'Vogal A',
        letter: 'A',
        icon: '🐝',
        starsEarned: 3,
        status: 'completed',
        description: 'A de Abelha e Avião',
        bnccTag: 'EF01LP02',
      },
      {
        id: 'fase-2',
        number: 2,
        levelId: 1,
        title: 'Vogal E',
        letter: 'E',
        icon: '🐘',
        starsEarned: 3,
        status: 'completed',
        description: 'E de Elefante e Estrela',
        bnccTag: 'EF01LP02',
      },
      {
        id: 'fase-3',
        number: 3,
        levelId: 1,
        title: 'Vogal I',
        letter: 'I',
        icon: '🦎',
        starsEarned: 0,
        status: 'current',
        description: 'I de Iguana e Ilha',
        bnccTag: 'EF01LP05',
      },
      {
        id: 'fase-4',
        number: 4,
        levelId: 1,
        title: 'Vogal O',
        letter: 'O',
        icon: '🐑',
        starsEarned: 0,
        status: 'locked',
        description: 'O de Ovelha e Óculos',
        bnccTag: 'EF01LP05',
      },
      {
        id: 'fase-5',
        number: 5,
        levelId: 1,
        title: 'Vogal U',
        letter: 'U',
        icon: '🍇',
        starsEarned: 0,
        status: 'locked',
        description: 'U de Uva e Urso',
        bnccTag: 'EF01LP07',
      },
    ],
  },
  {
    id: 2,
    name: 'Nível 2: Floresta dos Fonemas',
    subtitle: 'Conexão entre letras sonoras e animais da floresta',
    badge: 'Consoantes Amigas',
    accentColor: 'from-emerald-500 to-teal-500',
    phases: [
      {
        id: 'fase-6',
        number: 6,
        levelId: 2,
        title: 'Letra B',
        letter: 'B',
        icon: '⚽',
        starsEarned: 0,
        status: 'locked',
        description: 'B de Bola e Borboleta',
        bnccTag: 'EF01LP07',
      },
      {
        id: 'fase-7',
        number: 7,
        levelId: 2,
        title: 'Letra C',
        letter: 'C',
        icon: '🏠',
        starsEarned: 0,
        status: 'locked',
        description: 'C de Casa e Coelho',
        bnccTag: 'EF01LP07',
      },
      {
        id: 'fase-8',
        number: 8,
        levelId: 2,
        title: 'Letra M',
        letter: 'M',
        icon: '🐒',
        starsEarned: 0,
        status: 'locked',
        description: 'M de Macaco e Melancia',
        bnccTag: 'EF01LP08',
      },
      {
        id: 'fase-9',
        number: 9,
        levelId: 2,
        title: 'Letra P',
        letter: 'P',
        icon: '🦆',
        starsEarned: 0,
        status: 'locked',
        description: 'P de Pato e Pipa',
        bnccTag: 'EF01LP08',
      },
    ],
  },
  {
    id: 3,
    name: 'Nível 3: Reino das Palavras Mágicas',
    subtitle: 'Unindo sílabas e montando as primeiras palavras completas',
    badge: 'Mestres da Leitura',
    accentColor: 'from-purple-500 to-indigo-500',
    phases: [
      {
        id: 'fase-10',
        number: 10,
        levelId: 3,
        title: 'Sílabas BA-BE-BI',
        letter: 'BA',
        icon: '🍌',
        starsEarned: 0,
        status: 'locked',
        description: 'Banana, Baleia e Batata',
        bnccTag: 'EF01LP10',
      },
      {
        id: 'fase-11',
        number: 11,
        levelId: 3,
        title: 'Rimas Encantadas',
        letter: 'PÃO',
        icon: '🍞',
        starsEarned: 0,
        status: 'locked',
        description: 'Mão rima com Pão!',
        bnccTag: 'EF01LP12',
      },
      {
        id: 'fase-12',
        number: 12,
        levelId: 3,
        title: 'Grande Desafio do Saber',
        letter: 'S',
        icon: '☀️',
        starsEarned: 0,
        status: 'locked',
        description: 'S de Saber e Sol Dourado',
        bnccTag: 'EF01LP14',
      },
    ],
  },
];

/**
 * Palavras do minijogo "Caça às Palavras que começam com I" na Fase 3 (I de Iguana)
 */
export interface WordHuntItem {
  id: string;
  word: string;
  icon: string;
  startsWithI: boolean;
  initialLetter: string;
}

export const PHASE_3_IGUANA_WORDS: WordHuntItem[] = [
  { id: 'wh-iguana', word: 'Iguana', icon: '🦎', startsWithI: true, initialLetter: 'I' },
  { id: 'wh-abelha', word: 'Abelha', icon: '🐝', startsWithI: false, initialLetter: 'A' },
  { id: 'wh-ilha', word: 'Ilha', icon: '🏝️', startsWithI: true, initialLetter: 'I' },
  { id: 'wh-bola', word: 'Bola', icon: '⚽', startsWithI: false, initialLetter: 'B' },
  { id: 'wh-iglu', word: 'Iglu', icon: '🧊', startsWithI: true, initialLetter: 'I' },
  { id: 'wh-igreja', word: 'Igreja', icon: '⛪', startsWithI: true, initialLetter: 'I' },
];

/**
 * Fonte única de verdade para geração de perguntas e alternativas.
 * Garante que a letra-alvo da rodada e do áudio seja idêntica à opção correta gerada.
 */
interface OptionSeed {
  letter: string;
  word: string;
  icon: string;
  colorClass: string;
}

interface PhaseChallengeBlueprint {
  id: string;
  phaseId: string;
  target: OptionSeed;
  phonemeSound: string;
  spokenPrompt: string;
  hintText: string;
  correctSlotIndex: 0 | 1 | 2 | 3;
  distractors: [OptionSeed, OptionSeed, OptionSeed];
}

function buildActivityQuestionFromBlueprint(
  blueprint: PhaseChallengeBlueprint
): ActivityQuestion {
  const { id, phaseId, target, phonemeSound, spokenPrompt, hintText, correctSlotIndex, distractors } =
    blueprint;

  const targetNorm = normalizePhonemeString(target.letter);

  // Garante que nenhum distrator tenha a mesma letra da resposta correta
  const sanitizedDistractors = distractors.filter(
    (d) => normalizePhonemeString(d.letter) !== targetNorm
  );
  if (sanitizedDistractors.length !== 3) {
    throw new Error(
      `Blueprint inválido na fase "${phaseId}": distratores devem ser 3 letras distintas da letra-alvo "${target.letter}".`
    );
  }

  const orderedSeeds: OptionSeed[] = [];
  let distractorIdx = 0;
  for (let slot = 0; slot < 4; slot++) {
    if (slot === correctSlotIndex) {
      orderedSeeds.push(target);
    } else {
      orderedSeeds.push(sanitizedDistractors[distractorIdx]);
      distractorIdx++;
    }
  }

  const options: ActivityOption[] = orderedSeeds.map((seed, idx) => ({
    id: `opt-${phaseId}-${idx}-${normalizePhonemeString(seed.letter)}`,
    letter: seed.letter,
    word: seed.word,
    icon: seed.icon,
    colorClass: seed.colorClass,
    isCorrect: isPhonemeAnswerCorrect(seed.letter, target.letter),
  }));

  return {
    id,
    phaseId,
    targetLetter: target.letter,
    targetWord: target.word,
    phonemeSound,
    spokenPrompt,
    hintText,
    options,
  };
}

const PHASE_CHALLENGE_BLUEPRINTS: PhaseChallengeBlueprint[] = [
  // NÍVEL 1: ILHA DAS VOGAIS (Fases 1 a 5 em ordem exata)
  {
    id: 'q-vogal-a',
    phaseId: 'fase-1',
    target: { letter: 'A', word: 'Abelha', icon: '🐝', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    phonemeSound: '/a/',
    spokenPrompt: 'Atenção, aventureiro! Onde está a letra A de Abelha?',
    hintText: 'A de Amor, Abelha e Amizade!',
    correctSlotIndex: 2,
    distractors: [
      { letter: 'U', word: 'Uva', icon: '🍇', colorClass: 'bg-purple-100 border-purple-300 text-purple-900' },
      { letter: 'O', word: 'Óculos', icon: '👓', colorClass: 'bg-sky-100 border-sky-300 text-sky-900' },
      { letter: 'E', word: 'Estrela', icon: '⭐', colorClass: 'bg-rose-100 border-rose-300 text-rose-900' },
    ],
  },
  {
    id: 'q-vogal-e',
    phaseId: 'fase-2',
    target: { letter: 'E', word: 'Elefante', icon: '🐘', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
    phonemeSound: '/e/',
    spokenPrompt: 'Ouça o som: E! Qual card tem a letra E de Elefante?',
    hintText: 'A letrinha E parece uma escadinha com três degraus!',
    correctSlotIndex: 0,
    distractors: [
      { letter: 'I', word: 'Ilha', icon: '🏝️', colorClass: 'bg-teal-100 border-teal-300 text-teal-900' },
      { letter: 'U', word: 'Urso', icon: '🐻', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
      { letter: 'A', word: 'Avião', icon: '✈️', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
    ],
  },
  {
    id: 'q-vogal-i',
    phaseId: 'fase-3',
    target: { letter: 'I', word: 'Iguana', icon: '🦎', colorClass: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
    phonemeSound: '/i/',
    spokenPrompt: 'Ouça com atenção: toque na letra I de Iguana!',
    hintText: 'A letra I é compridinha e tem o som inicial de Iguana e Ilha!',
    correctSlotIndex: 1,
    distractors: [
      { letter: 'A', word: 'Abelha', icon: '🐝', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
      { letter: 'E', word: 'Elefante', icon: '🐘', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
      { letter: 'O', word: 'Ovelha', icon: '🐑', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
    ],
  },
  {
    id: 'q-vogal-o',
    phaseId: 'fase-4',
    target: { letter: 'O', word: 'Ovelha', icon: '🐑', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
    phonemeSound: '/o/',
    spokenPrompt: 'Vamos encontrar a letra O de Ovelha e Ônibus!',
    hintText: 'A letrinha O é bem redondinha como uma bolha!',
    correctSlotIndex: 1,
    distractors: [
      { letter: 'A', word: 'Árvore', icon: '🌳', colorClass: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
      { letter: 'E', word: 'Espelho', icon: '🪞', colorClass: 'bg-indigo-100 border-indigo-300 text-indigo-900' },
      { letter: 'U', word: 'Unicórnio', icon: '🦄', colorClass: 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900' },
    ],
  },
  {
    id: 'q-vogal-u',
    phaseId: 'fase-5',
    target: { letter: 'U', word: 'Uva', icon: '🍇', colorClass: 'bg-purple-100 border-purple-300 text-purple-900' },
    phonemeSound: '/u/',
    spokenPrompt: 'Ouça o som: U! Onde está a letra U de Uva?',
    hintText: 'A letra U desce por uma curva e sobe de novo como um escorregador!',
    correctSlotIndex: 3,
    distractors: [
      { letter: 'I', word: 'Iglu', icon: '🧊', colorClass: 'bg-cyan-100 border-cyan-300 text-cyan-900' },
      { letter: 'E', word: 'Escova', icon: '🪥', colorClass: 'bg-lime-100 border-lime-300 text-lime-900' },
      { letter: 'O', word: 'Olho', icon: '👀', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    ],
  },

  // NÍVEL 2: FLORESTA DOS FONEMAS (Consoantes Amigas — B, C, M, P)
  {
    id: 'q-consoante-b',
    phaseId: 'fase-6',
    target: { letter: 'B', word: 'Bola', icon: '⚽', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
    phonemeSound: '/b/',
    spokenPrompt: 'Ouça o som da floresta: toque na letra B de Bola!',
    hintText: 'O som /b/ junta os dois lábios: B de Bola e Borboleta!',
    correctSlotIndex: 0,
    distractors: [
      { letter: 'D', word: 'Dado', icon: '🎲', colorClass: 'bg-red-100 border-red-300 text-red-900' },
      { letter: 'P', word: 'Pato', icon: '🦆', colorClass: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
      { letter: 'M', word: 'Maçã', icon: '🍎', colorClass: 'bg-rose-100 border-rose-300 text-rose-900' },
    ],
  },
  {
    id: 'q-consoante-c',
    phaseId: 'fase-7',
    target: { letter: 'C', word: 'Casa', icon: '🏠', colorClass: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
    phonemeSound: '/k/',
    spokenPrompt: 'Ouça com atenção: toque na letra C de Casa e Coelho!',
    hintText: 'A letra C tem o som /k/ como em Casa e Coelho!',
    correctSlotIndex: 2,
    distractors: [
      { letter: 'B', word: 'Bola', icon: '⚽', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
      { letter: 'G', word: 'Gato', icon: '🐱', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
      { letter: 'T', word: 'Tatu', icon: '🐾', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
    ],
  },
  {
    id: 'q-consoante-m',
    phaseId: 'fase-8',
    target: { letter: 'M', word: 'Macaco', icon: '🐒', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    phonemeSound: '/m/',
    spokenPrompt: 'Ouça o som amigo: toque na letra M de Macaco!',
    hintText: 'O som /m/ faz hummm com os lábios fechados: M de Macaco!',
    correctSlotIndex: 1,
    distractors: [
      { letter: 'N', word: 'Navio', icon: '🚢', colorClass: 'bg-sky-100 border-sky-300 text-sky-900' },
      { letter: 'P', word: 'Pipa', icon: '🪁', colorClass: 'bg-purple-100 border-purple-300 text-purple-900' },
      { letter: 'B', word: 'Borboleta', icon: '🦋', colorClass: 'bg-pink-100 border-pink-300 text-pink-900' },
    ],
  },
  {
    id: 'q-consoante-p',
    phaseId: 'fase-9',
    target: { letter: 'P', word: 'Pato', icon: '🦆', colorClass: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
    phonemeSound: '/p/',
    spokenPrompt: 'Atenção na floresta: toque na letra P de Pato e Pipa!',
    hintText: 'O som /p/ estoura bem levinho nos lábios: P de Pato!',
    correctSlotIndex: 3,
    distractors: [
      { letter: 'B', word: 'Baleia', icon: '🐋', colorClass: 'bg-cyan-100 border-cyan-300 text-cyan-900' },
      { letter: 'C', word: 'Coelho', icon: '🐰', colorClass: 'bg-rose-100 border-rose-300 text-rose-900' },
      { letter: 'F', word: 'Foca', icon: '🦭', colorClass: 'bg-indigo-100 border-indigo-300 text-indigo-900' },
    ],
  },

  // NÍVEL 3: REINO DAS PALAVRAS MÁGICAS
  {
    id: 'q-silaba-ba',
    phaseId: 'fase-10',
    target: { letter: 'BA', word: 'Banana', icon: '🍌', colorClass: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
    phonemeSound: '/ba/',
    spokenPrompt: 'Junte os sons B + A! Toque na sílaba BA de Banana!',
    hintText: 'Quando o B dá a mão para o A, nasce a sílaba BA de Banana!',
    correctSlotIndex: 1,
    distractors: [
      { letter: 'CA', word: 'Caju', icon: '🥜', colorClass: 'bg-orange-100 border-orange-300 text-orange-900' },
      { letter: 'MA', word: 'Maçã', icon: '🍎', colorClass: 'bg-rose-100 border-rose-300 text-rose-900' },
      { letter: 'PA', word: 'Pato', icon: '🦆', colorClass: 'bg-sky-100 border-sky-300 text-sky-900' },
    ],
  },
  {
    id: 'q-rima-pao',
    phaseId: 'fase-11',
    target: { letter: 'PÃO', word: 'Pão', icon: '🍞', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    phonemeSound: '/ão/',
    spokenPrompt: 'Rimas encantadas! Qual palavra rima com MÃO? Toque em PÃO!',
    hintText: 'Mão e Pão terminam com o mesmo som mágico: -ÃO!',
    correctSlotIndex: 0,
    distractors: [
      { letter: 'SOL', word: 'Sol', icon: '☀️', colorClass: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
      { letter: 'BOLA', word: 'Bola', icon: '⚽', colorClass: 'bg-blue-100 border-blue-300 text-blue-900' },
      { letter: 'UVA', word: 'Uva', icon: '🍇', colorClass: 'bg-purple-100 border-purple-300 text-purple-900' },
    ],
  },
  {
    id: 'q-desafio-s',
    phaseId: 'fase-12',
    target: { letter: 'S', word: 'Sol', icon: '☀️', colorClass: 'bg-amber-100 border-amber-300 text-amber-900' },
    phonemeSound: '/s/',
    spokenPrompt: 'Grande Desafio do Saber! Toque na letra S de Sol e Saber!',
    hintText: 'A letra S tem o som da cobrinha sss... S de Sol e Saber!',
    correctSlotIndex: 2,
    distractors: [
      { letter: 'L', word: 'Lua', icon: '🌙', colorClass: 'bg-indigo-100 border-indigo-300 text-indigo-900' },
      { letter: 'R', word: 'Rei', icon: '👑', colorClass: 'bg-purple-100 border-purple-300 text-purple-900' },
      { letter: 'V', word: 'Vento', icon: '💨', colorClass: 'bg-teal-100 border-teal-300 text-teal-900' },
    ],
  },
];

export const ACTIVITY_QUESTIONS: ActivityQuestion[] = PHASE_CHALLENGE_BLUEPRINTS.map(
  buildActivityQuestionFromBlueprint
);

/**
 * Busca a pergunta correspondente a uma fase específica usando phaseId como fonte única.
 */
export function getQuestionByPhaseId(phaseId: string): ActivityQuestion {
  return (
    ACTIVITY_QUESTIONS.find((q) => q.phaseId === phaseId) || ACTIVITY_QUESTIONS[0]
  );
}

/**
 * Validação rigorosa de integridade pedagógica e de lógica de jogo:
 * - Garante que a letra-alvo esteja presente em EXATAMENTE UMA opção jogável;
 * - Garante que não haja opções duplicadas;
 * - Garante coerência entre a letra-alvo, o prompt falado e a opção correta.
 */
export function validateActivityQuestion(question: ActivityQuestion): void {
  const normalizedTarget = normalizePhonemeString(question.targetLetter);
  if (!normalizedTarget) {
    throw new Error(`Questão "${question.id}" sem targetLetter válido.`);
  }

  if (question.options.length !== 4) {
    throw new Error(
      `Questão "${question.id}" (${question.phaseId}) deve ter exatamente 4 opções, mas possui ${question.options.length}.`
    );
  }

  const normalizedLetters = question.options.map((opt) =>
    normalizePhonemeString(opt.letter)
  );
  const uniqueLetters = new Set(normalizedLetters);
  if (uniqueLetters.size !== question.options.length) {
    throw new Error(
      `Questão "${question.id}" (${question.phaseId}) possui opções duplicadas.`
    );
  }

  const matchingTargetOptions = question.options.filter((opt) =>
    isPhonemeAnswerCorrect(opt.letter, question.targetLetter)
  );
  if (matchingTargetOptions.length !== 1) {
    throw new Error(
      `Questão "${question.id}" (${question.phaseId}) deve conter a letra-alvo "${question.targetLetter}" em exatamente 1 opção, mas encontrou ${matchingTargetOptions.length}.`
    );
  }

  const flaggedCorrectOptions = question.options.filter((opt) => opt.isCorrect);
  if (
    flaggedCorrectOptions.length !== 1 ||
    flaggedCorrectOptions[0].id !== matchingTargetOptions[0].id
  ) {
    throw new Error(
      `Questão "${question.id}" (${question.phaseId}) possui divergência entre isCorrect e targetLetter "${question.targetLetter}".`
    );
  }

  const normalizedPrompt = normalizePhonemeString(question.spokenPrompt);
  if (!normalizedPrompt.includes(normalizedTarget)) {
    throw new Error(
      `Prompt da questão "${question.id}" (${question.phaseId}) não menciona a letra-alvo "${question.targetLetter}".`
    );
  }
}

export function validateAllActivityQuestions(
  levels: LevelInfo[] = INITIAL_LEVELS,
  questions: ActivityQuestion[] = ACTIVITY_QUESTIONS
): void {
  const expectedVowels = [
    { phaseId: 'fase-1', number: 1, letter: 'A', word: 'Abelha' },
    { phaseId: 'fase-2', number: 2, letter: 'E', word: 'Elefante' },
    { phaseId: 'fase-3', number: 3, letter: 'I', word: 'Iguana' },
    { phaseId: 'fase-4', number: 4, letter: 'O', word: 'Ovelha' },
    { phaseId: 'fase-5', number: 5, letter: 'U', word: 'Uva' },
  ];

  const flatPhases = levels.flatMap((lvl) => lvl.phases);

  expectedVowels.forEach((expected, index) => {
    const phase = flatPhases[index];
    if (
      !phase ||
      phase.id !== expected.phaseId ||
      phase.number !== expected.number ||
      normalizePhonemeString(phase.letter) !== normalizePhonemeString(expected.letter)
    ) {
      throw new Error(
        `Ordem inválida na Fase ${expected.number}: esperado ${expected.phaseId} (${expected.letter} de ${expected.word}).`
      );
    }
  });

  for (const phase of flatPhases) {
    const q = questions.find((item) => item.phaseId === phase.id);
    if (!q) {
      throw new Error(
        `Fase "${phase.id}" (${phase.title}) não possui questão configurada em ACTIVITY_QUESTIONS.`
      );
    }
    validateActivityQuestion(q);
  }
}

// Executa a validação estrutural automaticamente ao carregar o módulo
validateAllActivityQuestions(INITIAL_LEVELS, ACTIVITY_QUESTIONS);

export const INITIAL_MEDALS: Medal[] = [
  {
    id: 'm1',
    title: 'Primeiro Passo',
    description: 'Completou com sucesso a primeira atividade da trilha.',
    icon: '🚀',
    category: 'aventura',
    unlocked: true,
    unlockedDate: 'Hoje',
    color: 'from-amber-400 to-yellow-500',
  },
  {
    id: 'm2',
    title: 'Mestre das Vogais',
    description: 'Identificou os sons das vogais A e E sem pestanejar.',
    icon: '🅰️',
    category: 'alfabeto',
    unlocked: true,
    unlockedDate: 'Hoje',
    color: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'm3',
    title: 'Ouvidos de Ouro',
    description: 'Ouviu atentamente o som da atividade antes de responder.',
    icon: '🎧',
    category: 'dedicacao',
    unlocked: true,
    unlockedDate: 'Hoje',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'm4',
    title: 'Mira Certeira',
    description: 'Acertou de primeira sem hesitar em 3 desafios consecutivos.',
    icon: '🎯',
    category: 'conquista',
    unlocked: false,
    color: 'from-rose-400 to-pink-500',
  },
  {
    id: 'm5',
    title: 'Explorador da Floresta',
    description: 'Desbloqueie o Nível 2 completando a Ilha das Vogais.',
    icon: '🌳',
    category: 'aventura',
    unlocked: false,
    color: 'from-green-400 to-emerald-600',
  },
  {
    id: 'm6',
    title: 'Colecionador de Estrelas',
    description: 'Acumule 15 ou mais estrelas douradas na sua jornada.',
    icon: '⭐',
    category: 'conquista',
    unlocked: false,
    color: 'from-yellow-300 to-amber-500',
  },
  {
    id: 'm7',
    title: 'Super Focado',
    description: 'Brinque por 15 minutos em atividades de consciência fonológica.',
    icon: '🧘',
    category: 'dedicacao',
    unlocked: false,
    color: 'from-purple-400 to-violet-500',
  },
  {
    id: 'm8',
    title: 'Rei das Palavras Mágicas',
    description: 'Conquiste todos os desafios do Nível 3.',
    icon: '👑',
    category: 'aventura',
    unlocked: false,
    color: 'from-amber-500 to-orange-500',
  },
];

export const BNCC_SKILLS: BnccSkill[] = [
  {
    code: 'EF01LP02',
    title: 'Segmentação da fala e consciência fonológica',
    description: 'Escrever, espontaneamente ou por ditado, palavras e frases de forma alfabética.',
    progress: 88,
  },
  {
    code: 'EF01LP05',
    title: 'Reconhecimento de grafemas e sons das letras',
    description: 'Reconhecer o sistema de escrita alfabética como representação dos sons da fala.',
    progress: 92,
  },
  {
    code: 'EF01LP07',
    title: 'Associação de fonemas às suas letras',
    description: 'Identificar fonemas e sua representação por grafemas correspondentes.',
    progress: 75,
  },
  {
    code: 'EF01LP10',
    title: 'Construção do repertório silábico',
    description: 'Nomear as letras do alfabeto e recitá-lo na ordem das letras.',
    progress: 60,
  },
];

export const PARENT_TIPS: ParentTip[] = [
  {
    title: 'Brincadeira da Caça aos Sons na Cozinha',
    activity: 'Peça para a criança apontar três objetos que começam com o som /A/ (Abacaxi, Açúcar, Avental). Essa atividade fixa a consciência fonológica fora das telas!',
    targetSkill: 'Consciência Fonológica Inicial',
  },
  {
    title: 'Desenho com o Dedo na Areia ou Farinha',
    activity: 'Coloque um pouco de farinha ou fubá em um prato raso e convide a criança a desenhar a letrinha com o dedo enquanto faz o som sonoro.',
    targetSkill: 'Coordenação Fina e Memória Tátil',
  },
  {
    title: 'Jogo do Eco Encantado',
    activity: 'Diga uma palavra devagarinho ("E-le-fan-te") e peça para a criança repetir somente o primeiro som bem alto. Isso exercita o foco auditivo.',
    targetSkill: 'Discriminação Auditiva',
  },
];
