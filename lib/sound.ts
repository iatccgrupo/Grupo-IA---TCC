// Web Audio API Synthesizer & Speech Synthesis for playful, zero-dependency audio

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playPopSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // Ignore audio context errors if muted/unsupported
  }
};

export const playSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Arpeggio C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + i * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  } catch {
    // Ignore
  }
};

export const playTryAgainSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Soft warm gentle two-tone (E4 -> C4)
    const notes = [329.63, 261.63];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + i * 0.14;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch {
    // Ignore
  }
};

export const playStarSound = (starIndex: number = 0) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseFrequencies = [587.33, 739.99, 880.0]; // D5, F#5, A5
    const freq = baseFrequencies[starIndex % baseFrequencies.length] || 880;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.22);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  } catch {
    // Ignore
  }
};

const FEMALE_PT_VOICE_KEYWORDS = [
  'francisca',
  'thalita',
  'maria',
  'luciana',
  'joana',
  'brenda',
  'elza',
  'giovanna',
  'leila',
  'leticia',
  'letícia',
  'manuela',
  'yara',
  'camila',
  'vitoria',
  'vitória',
  'raquel',
  'catarina',
  'ines',
  'inês',
  'fernanda',
  'helena',
  'google português do brasil',
  'google portugues do brasil',
  'female',
  'feminina',
  'mulher',
  'woman',
  'girl',
];

const MALE_PT_VOICE_KEYWORDS = [
  'daniel',
  'antonio',
  'antônio',
  'fabio',
  'fábio',
  'humberto',
  'julio',
  'júlio',
  'nicolau',
  'valerio',
  'valério',
  'duarte',
  'felipe',
  'rafael',
  'lucas',
  'ricardo',
  'donato',
  'male',
  'masculino',
  'masculina',
  'homem',
  'man',
];

function scorePortugueseFemaleVoice(voice: SpeechSynthesisVoice): number {
  const lang = (voice.lang || '').toLowerCase();
  const name = (voice.name || '').toLowerCase();

  let score = 0;

  if (lang === 'pt-br' || lang === 'pt_br') {
    score += 200;
  } else if (lang.startsWith('pt')) {
    score += 80;
  } else {
    return -1000;
  }

  if (FEMALE_PT_VOICE_KEYWORDS.some((kw) => name.includes(kw))) {
    score += 120;
  }

  if (MALE_PT_VOICE_KEYWORDS.some((kw) => name.includes(kw))) {
    score -= 150;
  }

  if (name.includes('natural') || name.includes('neural') || name.includes('online')) {
    score += 30;
  }

  if (voice.localService) {
    score += 5;
  }

  return score;
}

function getAvailableVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const initialVoices = window.speechSynthesis.getVoices();
    if (initialVoices.length > 0) {
      resolve(initialVoices);
      return;
    }

    let settled = false;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      clearTimeout(timer);
      resolve(voices);
    };

    const onVoicesChanged = () => {
      finish(window.speechSynthesis.getVoices());
    };

    const timer = setTimeout(() => {
      finish(window.speechSynthesis.getVoices());
    }, 250);

    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
  });
}

function selectPreferredPtBrFemaleVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -999;

  for (const voice of voices) {
    const score = scorePortugueseFemaleVoice(voice);
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestScore > 0 ? bestVoice : null;
}

const ttsAudioCache = new Map<string, string>();
let activeTtsAudio: HTMLAudioElement | null = null;
let activeTtsObjectUrl: string | null = null;

function stopActiveTtsAudio(): void {
  if (activeTtsAudio) {
    try {
      activeTtsAudio.pause();
      activeTtsAudio.currentTime = 0;
    } catch {}
    activeTtsAudio = null;
  }

  if (activeTtsObjectUrl) {
    try {
      URL.revokeObjectURL(activeTtsObjectUrl);
    } catch {}
    activeTtsObjectUrl = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

function base64ToWavBlob(base64Data: string, mimeType: string = 'audio/wav'): Blob {
  const binaryString = window.atob(base64Data);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function playBase64Audio(base64Data: string, mimeType: string = 'audio/wav'): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      stopActiveTtsAudio();

      const blob = base64ToWavBlob(base64Data, mimeType);
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);

      activeTtsAudio = audio;
      activeTtsObjectUrl = objectUrl;

      let settled = false;
      const finish = (playedOk: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(safetyTimer);
        if (activeTtsAudio === audio) {
          activeTtsAudio = null;
        }
        if (activeTtsObjectUrl === objectUrl) {
          activeTtsObjectUrl = null;
        }
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
        resolve(playedOk);
      };

      const safetyTimer = setTimeout(() => finish(true), 20000);

      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => finish(false));
      }
    } catch {
      resolve(false);
    }
  });
}

async function speakWithWebSpeechFallback(
  text: string,
  slowRate: boolean = false
): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    const voices = await getAvailableVoicesAsync();
    const preferredVoice = selectPreferredPtBrFemaleVoice(voices);

    await new Promise<void>((resolve) => {
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        clearTimeout(safetyTimer);
        resolve();
      };

      const safetyTimer = setTimeout(done, 12000);

      window.speechSynthesis.cancel(); // Stop any pending utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = preferredVoice?.lang || 'pt-BR';
      // Tom mais alegre, infantil e animado para crianças
      utterance.pitch = 1.22;
      utterance.rate = slowRate ? 0.9 : 1.05;
      utterance.volume = 1.0;

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = done;
      utterance.onerror = done;

      window.speechSynthesis.speak(utterance);
    });
  } catch {
    // Ignore speech synthesis errors
  }
}

export const speakInPortuguese = async (
  text: string,
  slowRate: boolean = false
): Promise<void> => {
  if (typeof window === 'undefined' || !text.trim()) {
    return;
  }

  stopActiveTtsAudio();

  const cacheKey = `${slowRate ? 'slow' : 'normal'}:${text.trim()}`;
  const cachedBase64 = ttsAudioCache.get(cacheKey);
  if (cachedBase64) {
    const playedFromCache = await playBase64Audio(cachedBase64, 'audio/wav');
    if (playedFromCache) {
      return;
    }
  }

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.trim(), slowRate }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (data.audioBase64) {
        if (ttsAudioCache.size >= 40) {
          const oldestKey = ttsAudioCache.keys().next().value;
          if (oldestKey) {
            ttsAudioCache.delete(oldestKey);
          }
        }
        ttsAudioCache.set(cacheKey, data.audioBase64);

        const played = await playBase64Audio(
          data.audioBase64,
          data.mimeType || 'audio/wav'
        );
        if (played) {
          return;
        }
      }
    }
  } catch {
    // Fallback automático para Web Speech API em caso de erro de rede ou ausência da chave
  }

  await speakWithWebSpeechFallback(text, slowRate);
};

