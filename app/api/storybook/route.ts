import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { Storybook } from '@/lib/types';

const PAGE_ACCENTS = [
  'from-amber-50 to-orange-50',
  'from-sky-50 to-blue-50',
  'from-emerald-50 to-teal-50',
  'from-purple-50 to-pink-50',
  'from-yellow-50 to-amber-50',
];

const COVER_ACCENTS: Record<string, string> = {
  Animais: 'from-amber-400 to-orange-500',
  Espaço: 'from-blue-600 to-indigo-600',
  Natureza: 'from-emerald-500 to-teal-600',
  Alfabeto: 'from-rose-500 to-amber-500',
  Aventura: 'from-sky-500 to-blue-600',
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY não configurada. Adicione sua chave no painel Settings > Secrets para criar histórias personalizadas com IA.',
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      theme?: string;
      customIdea?: string;
      childName?: string;
    };

    const theme = typeof body?.theme === 'string' && body.theme.trim() ? body.theme.trim() : 'Aventura';
    const customIdea = typeof body?.customIdea === 'string' ? body.customIdea.trim() : '';
    const childName = typeof body?.childName === 'string' ? body.childName.trim() : '';

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = [
      'Você é uma autora carinhosa de livros infantis brasileiros e pedagoga da Educação Infantil (4 a 7 anos).',
      `Crie uma história infantil lúdica, alegre e educativa em português do Brasil sobre o tema "${theme}".`,
      customIdea ? `Ideia especial pedida pela criança: "${customIdea}".` : '',
      childName ? `Se fizer sentido na narrativa, inclua com carinho o nome "${childName}" como amigo(a) ou protagonista.` : '',
      'Divida a história em exatamente 5 páginas curtas (2 a 3 frases fáceis, ricas em imaginação e positivas por página).',
      'Para cada página, inclua uma descrição visual detalhada da ilustração infantil, 1 emoji de cena, e 1 palavra-chave da página com sua letra inicial para ajudar na alfabetização.',
    ]
      .filter(Boolean)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Título curto e encantador da história em português' },
            theme: { type: Type.STRING, description: 'Tema principal (Animais, Espaço, Natureza, Alfabeto ou Aventura)' },
            summary: { type: Type.STRING, description: 'Resumo de 1 frase para a capa do livrinho' },
            moral: { type: Type.STRING, description: 'Mensagem carinhosa e educativa final' },
            coverEmoji: { type: Type.STRING, description: 'Um único emoji representativo da capa' },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING, description: 'Texto infantil da página em português do Brasil (2-3 frases)' },
                  illustrationDescription: { type: Type.STRING, description: 'Descrição visual da cena ilustrada em português' },
                  sceneEmoji: { type: Type.STRING, description: 'Um único emoji expressivo da cena' },
                  highlightWord: { type: Type.STRING, description: 'Uma palavra-chave da página para alfabetização' },
                  highlightLetter: { type: Type.STRING, description: 'Letra inicial em maiúscula da palavra-chave' },
                },
                required: [
                  'pageNumber',
                  'text',
                  'illustrationDescription',
                  'sceneEmoji',
                  'highlightWord',
                  'highlightLetter',
                ],
              },
            },
          },
          required: ['title', 'theme', 'summary', 'moral', 'coverEmoji', 'pages'],
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      return NextResponse.json(
        { error: 'O Gemini não retornou conteúdo para a história.' },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(rawText) as Omit<Storybook, 'id' | 'coverAccent' | 'isGenerated'>;

    if (!parsed.title || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
      return NextResponse.json(
        { error: 'Formato inesperado na resposta da história gerada.' },
        { status: 502 }
      );
    }

    const resolvedTheme = parsed.theme || theme;
    const book: Storybook = {
      id: `ai-book-${Date.now()}`,
      title: parsed.title,
      theme: resolvedTheme,
      summary: parsed.summary || 'Uma história mágica criada especialmente para você!',
      moral: parsed.moral || 'A imaginação nos leva para aventuras incríveis!',
      coverEmoji: parsed.coverEmoji || '📖',
      coverAccent: COVER_ACCENTS[resolvedTheme] || 'from-blue-500 to-indigo-600',
      isGenerated: true,
      pages: parsed.pages.map((p, idx) => ({
        pageNumber: p.pageNumber || idx + 1,
        text: p.text,
        illustrationDescription: p.illustrationDescription,
        sceneEmoji: p.sceneEmoji || '✨',
        highlightWord: p.highlightWord || 'História',
        highlightLetter: (p.highlightLetter || p.highlightWord?.[0] || 'H').toUpperCase(),
        accentBg: PAGE_ACCENTS[idx % PAGE_ACCENTS.length],
      })),
    };

    return NextResponse.json({ book });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Erro ao gerar história infantil via Gemini.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
