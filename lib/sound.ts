// ==========================================
// APRENDIZ KIDS - CONFIGURAÇÃO DE ÁUDIO E TTS (pt-BR)
// ==========================================

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  }
}

function getPreferredPortugueseVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (voices.length === 0) return null;

  const ptBrVoices = voices.filter(v => v.lang === 'pt-BR' || v.lang === 'pt_BR');
  if (ptBrVoices.length === 0) {
    const ptVoices = voices.filter(v => v.lang.startsWith('pt'));
    if (ptVoices.length === 0) return voices[0] || null;
    return ptVoices[0];
  }

  const femaleKeywords = [
    'francisca', 'thalita', 'luciana', 'maria', 'helena', 'camila', 
    'vitoria', 'fabiana', 'raquel', 'zira', 'google português do brasil', 
    'female', 'woman', 'girl'
  ];

  for (const keyword of femaleKeywords) {
    const found = ptBrVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (found) return found;
  }

  return ptBrVoices[0];
}

export function speakInPortuguese(text: string, slow: boolean = false) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis não suportado.');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.pitch = 1.22; // Tom alegre e infantil
  utterance.rate = slow ? 0.9 : 1.05; // Pausado para livros ou dinâmico para jogos

  const selectedVoice = getPreferredPortugueseVoice();
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

