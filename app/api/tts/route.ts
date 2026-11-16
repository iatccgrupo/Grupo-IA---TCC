import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

function buildWavBufferFromPcm(
  pcmData: Buffer,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM subchunk size
  header.writeUInt16LE(1, 20); // AudioFormat = 1 (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

function parseSampleRate(mimeType: string): number {
  const match = mimeType.match(/rate=(\d+)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 24000;
}

function ensureWavAudioBase64(base64Data: string, mimeType: string): string {
  const rawBuffer = Buffer.from(base64Data, 'base64');
  const isAlreadyWav =
    rawBuffer.length >= 12 &&
    rawBuffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    rawBuffer.subarray(8, 12).toString('ascii') === 'WAVE';

  if (isAlreadyWav) {
    return base64Data;
  }

  const sampleRate = parseSampleRate(mimeType);
  const wavBuffer = buildWavBufferFromPcm(rawBuffer, sampleRate, 1, 16);
  return wavBuffer.toString('base64');
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY não configurada no servidor.',
          fallback: true,
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as { text?: string; slowRate?: boolean };
    const cleanText = typeof body?.text === 'string' ? body.text.trim() : '';
    const slowRate = Boolean(body?.slowRate);

    if (!cleanText) {
      return NextResponse.json(
        { error: 'Texto vazio para síntese de voz.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const pacingHint = slowRate
      ? ' Fale de forma pausada, bem articulada e fácil para uma criança acompanhar.'
      : '';

    const prompt = `Fale em português do Brasil com muita empolgação, carinho e entusiasmo, como uma professora infantil animada lendo para crianças:${pacingHint} "${cleanText}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Aoede',
            },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find((part) => Boolean(part.inlineData?.data));

    if (!audioPart?.inlineData?.data) {
      return NextResponse.json(
        {
          error: 'O modelo Gemini não retornou dados de áudio.',
          fallback: true,
        },
        { status: 502 }
      );
    }

    const mimeType = audioPart.inlineData.mimeType || 'audio/L16;codec=pcm;rate=24000';
    const wavBase64 = ensureWavAudioBase64(audioPart.inlineData.data, mimeType);

    return NextResponse.json({
      audioBase64: wavBase64,
      mimeType: 'audio/wav',
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Erro ao gerar áudio via Gemini TTS.';
    return NextResponse.json(
      {
        error: message,
        fallback: true,
      },
      { status: 500 }
    );
  }
}
