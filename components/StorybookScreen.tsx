'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Sparkles,
  Volume2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Star,
  Award,
  Wand2,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { ChildProfile, Storybook } from '@/lib/types';
import { CURATED_STORYBOOKS, STORYBOOK_COVERS } from '@/lib/storybook-data';
import { playPopSound, playSuccessSound, speakInPortuguese } from '@/lib/sound';

interface StorybookScreenProps {
  childProfile: ChildProfile | null;
  soundEnabled: boolean;
  completedBookIds: string[];
  customBooks: Storybook[];
  onAddCustomBook: (book: Storybook) => void;
  onCompleteBook: (book: Storybook) => void;
  onNavigateProgress: () => void;
  onNavigateMap: () => void;
}

const THEME_FILTERS = ['Todos', 'Animais', 'Espaço', 'Natureza', 'Alfabeto', 'Criadas com IA'];

const GENERATOR_THEMES = [
  { id: 'Animais', label: 'Animais Amigos' },
  { id: 'Espaço', label: 'Viagem Espacial' },
  { id: 'Natureza', label: 'Floresta Encantada' },
  { id: 'Alfabeto', label: 'Letrinhas Mágicas' },
];

export const StorybookScreen: React.FC<StorybookScreenProps> = ({
  childProfile,
  soundEnabled,
  completedBookIds,
  customBooks,
  onAddCustomBook,
  onCompleteBook,
  onNavigateProgress,
  onNavigateMap,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [selectedBook, setSelectedBook] = useState<Storybook | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isCompletedView, setIsCompletedView] = useState<boolean>(false);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [slowMode, setSlowMode] = useState<boolean>(false);

  // Dynamic Gemini story generator state
  const [genTheme, setGenTheme] = useState<string>('Animais');
  const [customIdea, setCustomIdea] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string>('');

  const allBooks = [...customBooks, ...CURATED_STORYBOOKS];

  const filteredBooks = allBooks.filter((book) => {
    if (activeFilter === 'Todos') return true;
    if (activeFilter === 'Criadas com IA') return Boolean(book.isGenerated);
    return book.theme.toLowerCase() === activeFilter.toLowerCase();
  });

  const activePage =
    selectedBook && selectedBook.pages[currentPageIndex]
      ? selectedBook.pages[currentPageIndex]
      : null;

  const narrateCurrentPage = useCallback(
    async (text: string, useSlow: boolean) => {
      setIsNarrating(true);
      await speakInPortuguese(text, useSlow);
      setIsNarrating(false);
    },
    []
  );

  // Narrar automaticamente ao abrir um livro ou virar de página
  useEffect(() => {
    if (!selectedBook || isCompletedView || !activePage || !soundEnabled) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        void narrateCurrentPage(activePage.text, slowMode);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedBook, currentPageIndex, isCompletedView, activePage, soundEnabled, slowMode, narrateCurrentPage]);

  const handleOpenBook = (book: Storybook) => {
    playPopSound();
    setSelectedBook(book);
    setCurrentPageIndex(0);
    setIsCompletedView(false);
  };

  const handleCloseReader = () => {
    playPopSound();
    setSelectedBook(null);
    setCurrentPageIndex(0);
    setIsCompletedView(false);
    setIsNarrating(false);
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      playPopSound();
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleNextOrFinish = () => {
    if (!selectedBook) return;

    if (currentPageIndex + 1 < selectedBook.pages.length) {
      playPopSound();
      setCurrentPageIndex((prev) => prev + 1);
      return;
    }

    // Última página: concluir leitura e recompensar
    setIsCompletedView(true);
    if (soundEnabled) {
      playSuccessSound();
    }

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#3b82f6', '#10b981', '#f97316', '#a855f7'],
      });
    } catch {}

    onCompleteBook(selectedBook);

    if (soundEnabled) {
      const readerName = childProfile?.name ? `, ${childProfile.name}` : '';
      setTimeout(() => {
        void speakInPortuguese(
          `Parabéns${readerName}! Você terminou a história ${selectedBook.title} e ganhou três estrelas douradas!`,
          false
        );
      }, 650);
    }
  };

  const handleGenerateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerationError('');
    setIsGenerating(true);
    playPopSound();

    try {
      const res = await fetch('/api/storybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: genTheme,
          customIdea: customIdea.trim(),
          childName: childProfile?.name || '',
        }),
      });

      const data = (await res.json()) as { book?: Storybook; error?: string };

      if (!res.ok || !data.book) {
        setGenerationError(
          data.error || 'Não foi possível criar a história agora. Tente novamente.'
        );
        return;
      }

      onAddCustomBook(data.book);
      setCustomIdea('');
      playSuccessSound();
      setSelectedBook(data.book);
      setCurrentPageIndex(0);
      setIsCompletedView(false);
    } catch (err: unknown) {
      setGenerationError(
        err instanceof Error
          ? err.message
          : 'Erro de conexão ao gerar sua história mágica.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================================
  // MODO LEITOR IMERSIVO PÁGINA POR PÁGINA
  // ============================================================================
  if (selectedBook) {
    const coverImage = STORYBOOK_COVERS[selectedBook.id];
    const totalPages = selectedBook.pages.length;
    const isAlreadyRead = completedBookIds.includes(selectedBook.id);

    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        {/* Top Reader Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCloseReader}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-700 shadow-[0_3px_0_#cbd5e1] hover:bg-slate-50 active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar à Biblioteca</span>
          </button>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600">
            <span className="font-extrabold text-slate-900">{selectedBook.title}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {isCompletedView
                ? 'Leitura concluída'
                : `Página ${currentPageIndex + 1} de ${totalPages}`}
            </span>
          </div>

          {!isCompletedView && activePage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setSlowMode((prev) => !prev);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
                  slowMode
                    ? 'bg-sky-600 text-white border-sky-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {slowMode ? 'Leitura Pausada: Ativa' : 'Leitura Pausada'}
              </button>

              <button
                type="button"
                onClick={() => {
                  void narrateCurrentPage(activePage.text, slowMode);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-white shadow-[0_3px_0_#c2410c] hover:brightness-105 active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Volume2 className={`h-4 w-4 ${isNarrating ? 'animate-bounce' : ''}`} />
                <span>{isNarrating ? 'Ouvindo...' : 'Ouvir Página'}</span>
              </button>
            </div>
          )}
        </div>

        {isCompletedView ? (
          /* TELA DE CONQUISTA AO FINAL DO LIVRO */
          <div className="rounded-3xl border-3 border-amber-300 bg-white p-8 sm:p-12 shadow-xl text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 to-yellow-400 text-5xl shadow-[0_5px_0_#d97706]">
              {selectedBook.coverEmoji}
            </div>

            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 mb-2">
              História Concluída · +3 Estrelas Douradas
            </p>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-display text-balance">
              Parabéns{childProfile?.name ? `, ${childProfile.name}` : ''}! Você leu &ldquo;{selectedBook.title}&rdquo;
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
              {selectedBook.moral}
            </p>

            <div className="my-8 flex flex-wrap items-center justify-center gap-6 py-5 border-y border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-extrabold text-lg">
                <Star className="h-6 w-6 fill-amber-400 text-amber-500" />
                <span className="tabular-nums">
                  {isAlreadyRead ? 'Livro registrado no seu diário' : '+3 estrelas ganhas'}
                </span>
              </div>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <div className="flex items-center gap-2 text-blue-700 font-extrabold text-lg">
                <Award className="h-6 w-6 text-blue-600" />
                <span>Progresso salvo na sua jornada</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setCurrentPageIndex(0);
                  setIsCompletedView(false);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-6 py-3.5 text-sm font-extrabold text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Ler Novamente</span>
              </button>

              <button
                type="button"
                onClick={handleCloseReader}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_4px_0_#1d4ed8] hover:bg-blue-700 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <BookOpen className="h-4 w-4" />
                <span>Escolher Outro Livro</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  onNavigateProgress();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_4px_0_#047857] hover:bg-emerald-600 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Award className="h-4 w-4" />
                <span>Ver Minhas Medalhas</span>
              </button>
            </div>
          </div>
        ) : (
          /* LIVRO ABERTO: ILUSTRAÇÃO + TEXTO DA PÁGINA */
          activePage && (
            <div className="rounded-3xl border-3 border-blue-200 bg-white p-5 sm:p-8 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                {/* Zona da Ilustração */}
                <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                  {coverImage ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-amber-50">
                      <Image
                        src={coverImage}
                        alt={activePage.illustrationDescription}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        priority
                      />
                    </div>
                  ) : (
                    <div
                      className={`relative aspect-[4/3] w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br ${activePage.accentBg}`}
                    >
                      <span className="text-7xl sm:text-8xl mb-3 drop-shadow-sm">
                        {activePage.sceneEmoji}
                      </span>
                      <span className="text-sm font-extrabold text-slate-700">
                        Cena {activePage.pageNumber} de {totalPages}
                      </span>
                    </div>
                  )}

                  <div className="p-4 bg-white border-t border-slate-100 flex items-start gap-3">
                    <span className="text-2xl shrink-0" aria-hidden="true">
                      {activePage.sceneEmoji}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
                      {activePage.illustrationDescription}
                    </p>
                  </div>
                </div>

                {/* Zona do Texto e Controles de Página */}
                <div className="lg:col-span-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-4 border-b border-slate-100">
                      <span>{selectedBook.theme}</span>
                      <span className="tabular-nums">
                        Página {currentPageIndex + 1} / {totalPages}
                      </span>
                    </div>

                    <p className="mt-6 text-xl sm:text-2xl font-bold text-slate-900 leading-relaxed font-display">
                      {activePage.text}
                    </p>

                    {/* Destaque de Alfabetização da Página */}
                    <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-slate-500">
                          Palavra em destaque na leitura
                        </span>
                        <span className="text-lg font-extrabold text-blue-700">
                          {activePage.highlightWord}
                        </span>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl font-black text-amber-900 font-display border-2 border-amber-300">
                        {activePage.highlightLetter}
                      </div>
                    </div>
                  </div>

                  {/* Navegação de Páginas */}
                  <div className="mt-8 pt-5 border-t border-slate-100">
                    {/* Indicador visual de progresso das páginas */}
                    <div className="flex items-center justify-center gap-2 mb-5">
                      {selectedBook.pages.map((p, idx) => (
                        <button
                          key={p.pageNumber}
                          type="button"
                          onClick={() => {
                            playPopSound();
                            setCurrentPageIndex(idx);
                          }}
                          aria-label={`Ir para página ${idx + 1}`}
                          className={`h-2.5 rounded-full transition-all cursor-pointer ${
                            idx === currentPageIndex
                              ? 'w-8 bg-blue-600'
                              : idx < currentPageIndex
                              ? 'w-2.5 bg-emerald-500'
                              : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handlePrevPage}
                        disabled={currentPageIndex === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-5 py-3.5 text-sm font-extrabold text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Anterior</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextOrFinish}
                        className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm sm:text-base font-extrabold text-white transition-all cursor-pointer ${
                          currentPageIndex + 1 === totalPages
                            ? 'bg-emerald-500 shadow-[0_4px_0_#047857] hover:bg-emerald-600 active:translate-y-0.5'
                            : 'bg-blue-600 shadow-[0_4px_0_#1d4ed8] hover:bg-blue-700 active:translate-y-0.5'
                        }`}
                      >
                        <span>
                          {currentPageIndex + 1 === totalPages
                            ? 'Concluir Leitura (+3 ⭐)'
                            : 'Próxima Página'}
                        </span>
                        {currentPageIndex + 1 === totalPages ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <ArrowRight className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  // ============================================================================
  // GALERIA DA BIBLIOTECA DE HISTÓRIAS + GERADOR GEMINI
  // ============================================================================
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      {/* Cabeçalho da Biblioteca */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 p-6 sm:p-8 text-white shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-sky-100 mb-1.5">
              Hora da Leitura Interativa · Narração em Voz Infantil
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-balance">
              Biblioteca de Histórias
            </h1>
            <p className="mt-2 text-sm sm:text-base text-sky-100 max-w-2xl">
              Escolha um livrinho encantado para ouvir página por página ou crie uma aventura inédita
              {childProfile?.name ? ` para ${childProfile.name}` : ''} usando inteligência artificial.
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/25">
            <div>
              <span className="block text-xs font-bold text-sky-100">Livros lidos</span>
              <span className="text-2xl font-extrabold tabular-nums font-display">
                {completedBookIds.length}
              </span>
            </div>
            <div className="h-8 w-px bg-white/25" />
            <div>
              <span className="block text-xs font-bold text-sky-100">Recompensa</span>
              <span className="text-2xl font-extrabold tabular-nums font-display">
                +3 ⭐
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Criador Dinâmico de Histórias com Gemini */}
      <section className="mb-10 rounded-3xl border-3 border-amber-300 bg-white p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-amber-950 shadow-[0_3px_0_#d97706]">
              <Wand2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                Criar uma História Nova com o Gemini
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Escolha um tema ou escreva sua própria ideia para gerar um livro de 5 páginas ilustrado e narrado.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerateBook} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {GENERATOR_THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playPopSound();
                  setGenTheme(item.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  genTheme === item.id
                    ? 'bg-blue-600 text-white shadow-[0_3px_0_#1d4ed8]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customIdea}
              onChange={(e) => {
                setCustomIdea(e.target.value);
                if (generationError) setGenerationError('');
              }}
              placeholder="Ideia opcional: Ex: Um dinossauro que adorava descobrir vogais na floresta..."
              className="flex-1 h-14 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 text-sm sm:text-base font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isGenerating}
              className="h-14 px-7 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold text-sm sm:text-base shadow-[0_4px_0_#c2410c] hover:brightness-105 active:translate-y-0.5 transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-75"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Escrevendo história...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Criar História Mágica</span>
                </>
              )}
            </button>
          </div>

          {generationError && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50 p-4 border-2 border-red-300 text-xs sm:text-sm font-bold text-red-900 flex items-start gap-2.5"
            >
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <span>{generationError}</span>
            </div>
          )}
        </form>
      </section>

      {/* Filtros de Tema da Galeria */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5">
          {THEME_FILTERS.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => {
                playPopSound();
                setActiveFilter(theme);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeFilter === theme
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            playPopSound();
            onNavigateMap();
          }}
          className="text-xs sm:text-sm font-extrabold text-blue-600 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          Voltar para a Trilha de Fases
        </button>
      </div>

      {/* Grade de Livrinhos */}
      {filteredBooks.length === 0 ? (
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-10 text-center">
          <p className="text-base font-bold text-slate-700">
            Nenhuma história encontrada nesta categoria ainda.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Use o criador acima para gerar uma nova história mágica com o Gemini!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredBooks.map((book) => {
            const coverImg = STORYBOOK_COVERS[book.id];
            const isRead = completedBookIds.includes(book.id);

            return (
              <article
                key={book.id}
                className="group rounded-3xl border-2 border-slate-200 bg-white overflow-hidden shadow-md hover:shadow-xl hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Capa Ilustrada */}
                  {coverImg ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-amber-50">
                      <Image
                        src={coverImg}
                        alt={`Ilustração de capa do livro ${book.title}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div
                      className={`aspect-[4/3] w-full bg-gradient-to-br ${book.coverAccent} flex flex-col items-center justify-center p-6 text-white`}
                    >
                      <span className="text-7xl mb-2 drop-shadow-md">{book.coverEmoji}</span>
                      <span className="text-xs font-extrabold uppercase tracking-wider opacity-90">
                        História Criada com Gemini
                      </span>
                    </div>
                  )}

                  {/* Informações do Livro */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                      <span>{book.theme}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{book.pages.length} páginas</span>
                      {book.isGenerated && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-blue-600">Personalizada IA</span>
                        </>
                      )}
                      {isRead && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Lido</span>
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-900 font-display">
                      {book.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {book.summary}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-4">
                  <span className="text-xs font-extrabold text-amber-700 inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    <span>{isRead ? 'Concluído (3 ⭐)' : 'Vale +3 ⭐'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenBook(book)}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_3px_0_#1d4ed8] hover:bg-blue-700 active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>{isRead ? 'Ler Novamente' : 'Ler História'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
