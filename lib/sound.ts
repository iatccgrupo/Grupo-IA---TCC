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

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { text, slowRate } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 });
    }

    const prompt = slowRate
      ? `Leia em português do Brasil de forma pausada, clara e amigável para uma criança: "${text}"`
      : `Leia em português do Brasil de forma natural, calorosa e amigável: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Zephyr',
            },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!inlineData?.data) {
      return NextResponse.json({ error: 'Falha ao gerar áudio' }, { status: 500 });
    }

    return NextResponse.json({
      audioBase64: inlineData.data,
      mimeType: inlineData.mimeType || 'audio/pcm;rate=24000',
    });
  } catch (error) {
    console.error('Erro no Gemini TTS:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar voz' }, { status: 500 });
  }
}
