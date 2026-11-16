'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  Sparkles,
  Pencil,
  RotateCcw,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  ActivityQuestion,
  ActivityOption,
  Phase,
  ChildProfile,
} from '@/lib/types';
import { AVATAR_OPTIONS, PHASE_3_IGUANA_WORDS, WordHuntItem } from '@/lib/game-data';
import {
  speakInPortuguese,
  playPopSound,
  playSuccessSound,
  playStarSound,
  playTryAgainSound,
} from '@/lib/sound';
import { isPhonemeAnswerCorrect } from '@/lib/utils';

type Phase3Station = 'explore' | 'trace' | 'word_hunt' | 'challenge';

interface Phase3IguanaActivityProps {
  question: ActivityQuestion;
  currentPhase: Phase;
  childProfile: ChildProfile;
  soundEnabled: boolean;
  onAnswerSelected: (option: ActivityOption) => void;
  onBackToMap: () => void;
}

const TOTAL_I_WORDS = PHASE_3_IGUANA_WORDS.filter((w) => w.startsWithI).length;

export const Phase3IguanaActivity: React.FC<Phase3IguanaActivityProps> = ({
  question,
  currentPhase,
  childProfile,
  soundEnabled,
  onAnswerSelected,
  onBackToMap,
}) => {
  const [station, setStation] = useState<Phase3Station>('explore');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Estação 1: Iguana interativa + som fonético /i/
  const [iguanaJumpCount, setIguanaJumpCount] = useState(0);
  const [iguanaGreeting, setIguanaGreeting] = useState(
    'Oi! Eu sou a Iguana Iara! Toque em mim para ouvir o som da letra I!'
  );
  const [heardPhoneme, setHeardPhoneme] = useState(false);

  // Estação 2: Traçado guiado da letra I
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const visitedZonesRef = useRef<Set<string>>(new Set());
  const [traceProgress, setTraceProgress] = useState(0);
  const [traceCompleted, setTraceCompleted] = useState(false);

  // Estação 3: Caça às palavras com I
  const [foundWordIds, setFoundWordIds] = useState<string[]>([]);
  const [wordHuntFeedback, setWordHuntFeedback] = useState<string>(
    'Toque em todas as figuras cujos nomes começam com a letra I!'
  );

  // Estação 4: Desafio final de confirmação
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const avatarObj =
    AVATAR_OPTIONS.find((a) => a.id === childProfile.avatarId) || AVATAR_OPTIONS[0];

  const speakSafely = useCallback(
    async (text: string, slow: boolean = false) => {
      if (!soundEnabled) return;
      setIsPlayingAudio(true);
      await speakInPortuguese(text, slow);
      setIsPlayingAudio(false);
    },
    [soundEnabled]
  );

  // Fala boas-vindas da Fase 3 ao abrir
  useEffect(() => {
    if (!soundEnabled) return;
    const timer = setTimeout(() => {
      void speakSafely(
        'Bem-vindo à Fase 3: Vogal I de Iguana! Toque na iguana para ouvir o som do I.',
        false
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [soundEnabled, speakSafely]);

  const handleTapIguana = async () => {
    playPopSound();
    setIguanaJumpCount((prev) => prev + 1);
    setHeardPhoneme(true);
    setIguanaGreeting('Iii-iii-iii! I de Iguana, Ilha e Iglu!');
    await speakSafely('Iii! O som da letra I é iiii, como em Iguana e Ilha!', false);
  };

  const handlePlayPhonemeOnly = async () => {
    playPopSound();
    setHeardPhoneme(true);
    await speakSafely('Letra I! Repita comigo: Iiii de Iguana!', true);
  };

  // =========================================================================
  // Lógica do Traçado Guiado no Canvas (ponteiro/toque)
  // =========================================================================
  const drawTracingGuide = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Fundo suave estilo caderno lúdico
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(0, 0, width, height);

    // Linha pautada central
    ctx.save();
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(24, height * 0.5);
    ctx.lineTo(width - 24, height * 0.5);
    ctx.stroke();
    ctx.restore();

    // Guia tracejada da letra "I" maiúscula
    const centerX = width / 2;
    const topY = 38;
    const bottomY = height - 38;
    const capHalfWidth = 52;

    ctx.save();
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.setLineDash([10, 12]);

    // Traço 1: barra superior
    ctx.beginPath();
    ctx.moveTo(centerX - capHalfWidth, topY);
    ctx.lineTo(centerX + capHalfWidth, topY);
    ctx.stroke();

    // Traço 2: haste vertical central
    ctx.beginPath();
    ctx.moveTo(centerX, topY);
    ctx.lineTo(centerX, bottomY);
    ctx.stroke();

    // Traço 3: barra inferior
    ctx.beginPath();
    ctx.moveTo(centerX - capHalfWidth, bottomY);
    ctx.lineTo(centerX + capHalfWidth, bottomY);
    ctx.stroke();
    ctx.restore();

    // Marcadores numéricos de direção (1, 2, 3)
    const drawBadge = (x: number, y: number, label: string) => {
      ctx.save();
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
      ctx.restore();
    };

    drawBadge(centerX, topY - 20, '1');
    drawBadge(centerX - capHalfWidth - 18, topY, '2');
    drawBadge(centerX - capHalfWidth - 18, bottomY, '3');
  }, []);

  useEffect(() => {
    if (station !== 'trace') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawTracingGuide(ctx, canvas.width, canvas.height);
  }, [station, drawTracingGuide]);

  const resetTracingCanvas = () => {
    playPopSound();
    visitedZonesRef.current.clear();
    setTraceProgress(0);
    setTraceCompleted(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      drawTracingGuide(ctx, canvas.width, canvas.height);
    }
  };

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const registerTraceCheckpoint = (x: number, y: number, width: number, height: number) => {
    const centerX = width / 2;
    const topY = 38;
    const bottomY = height - 38;
    const capHalfWidth = 52;

    // Checa pontos ao longo do traço vertical e barras superior/inferior
    const onVerticalSpine = Math.abs(x - centerX) <= 32 && y >= topY - 20 && y <= bottomY + 20;
    if (onVerticalSpine) {
      if (y < topY + (bottomY - topY) * 0.35) visitedZonesRef.current.add('v-top');
      else if (y < topY + (bottomY - topY) * 0.7) visitedZonesRef.current.add('v-mid');
      else visitedZonesRef.current.add('v-bot');
    }
    if (Math.abs(y - topY) <= 26 && Math.abs(x - centerX) <= capHalfWidth + 16) {
      visitedZonesRef.current.add('bar-top');
    }
    if (Math.abs(y - bottomY) <= 26 && Math.abs(x - centerX) <= capHalfWidth + 16) {
      visitedZonesRef.current.add('bar-bot');
    }

    const totalRequired = 4;
    const progress = Math.min(
      100,
      Math.round((visitedZonesRef.current.size / totalRequired) * 100)
    );
    setTraceProgress(progress);

    if (!traceCompleted && visitedZonesRef.current.size >= totalRequired) {
      setTraceCompleted(true);
      playSuccessSound();
      void speakSafely('Parabéns! Você desenhou a letra I perfeitamente!', false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getCanvasPoint(e);

    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    registerTraceCheckpoint(x, y, canvas.width, canvas.height);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    registerTraceCheckpoint(x, y, canvas.width, canvas.height);
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  // =========================================================================
  // Minijogo Caça às Palavras que começam com I
  // =========================================================================
  const handleSelectWordHuntItem = (item: WordHuntItem) => {
    if (foundWordIds.includes(item.id)) return;

    if (item.startsWithI) {
      const updated = [...foundWordIds, item.id];
      setFoundWordIds(updated);
      playStarSound(updated.length - 1);

      if (updated.length >= TOTAL_I_WORDS) {
        setWordHuntFeedback('Incrível! Você encontrou todas as 4 palavras que começam com I!');
        playSuccessSound();
        void speakSafely(
          `Isso mesmo! ${item.word} começa com I! Você encontrou todas as palavras com a letra I!`,
          false
        );
      } else {
        setWordHuntFeedback(`Muito bem! "${item.word}" começa com I de Iguana!`);
        void speakSafely(`Muito bem! ${item.word} começa com I!`, false);
      }
    } else {
      playTryAgainSound();
      setWordHuntFeedback(
        `Quase! "${item.word}" começa com a letra ${item.initialLetter}. Procure as que começam com I!`
      );
      void speakSafely(
        `Quase! ${item.word} começa com ${item.initialLetter}. Procure as palavras que começam com I!`,
        false
      );
    }
  };

  // =========================================================================
  // Estação 4: Desafio Final (registra atividade e avança para FeedbackScreen)
  // =========================================================================
  const handleSelectFinalOption = (option: ActivityOption) => {
    if (selectedOptionId) return;
    playPopSound();
    setSelectedOptionId(option.id);

    const validatedIsCorrect =
      isPhonemeAnswerCorrect(option.letter, question.targetLetter) || option.isCorrect;

    setTimeout(() => {
      onAnswerSelected({
        ...option,
        isCorrect: validatedIsCorrect,
      });
    }, 260);
  };

  const stations: Array<{ id: Phase3Station; label: string; stepNum: number; done: boolean }> = [
    { id: 'explore', label: '1. Iguana & Som', stepNum: 1, done: heardPhoneme },
    { id: 'trace', label: '2. Traçar Letra I', stepNum: 2, done: traceCompleted },
    { id: 'word_hunt', label: '3. Caça-Palavras I', stepNum: 3, done: foundWordIds.length >= TOTAL_I_WORDS },
    { id: 'challenge', label: '4. Desafio Final', stepNum: 4, done: false },
  ];

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-6 sm:py-8">
      {/* Top Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => {
            playPopSound();
            onBackToMap();
          }}
          className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-700 shadow-[0_3px_0_#cbd5e1] hover:bg-slate-50 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Mapa</span>
        </button>

        <div className="flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2 border border-emerald-300">
          <span className="text-xs font-black text-emerald-900 uppercase">
            Fase {currentPhase.number}
          </span>
          <span className="text-emerald-500">·</span>
          <span className="text-xs font-extrabold text-emerald-900">
            Vogal I — I de Iguana 🦎
          </span>
        </div>

        <button
          onClick={() => {
            playPopSound();
            setShowHint(!showHint);
          }}
          className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
            showHint
              ? 'bg-amber-400 text-amber-950 shadow-sm'
              : 'bg-white text-slate-600 shadow-[0_2px_0_#cbd5e1] hover:bg-amber-50'
          }`}
        >
          <HelpCircle className="h-4 w-4 text-amber-600" />
          <span>Dica</span>
        </button>
      </div>

      {/* Station Switcher Tabs */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2 rounded-3xl border-2 border-emerald-200 shadow-sm">
        {stations.map((item) => {
          const isActive = station === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playPopSound();
                setStation(item.id);
                if (item.id === 'challenge') {
                  void speakSafely(question.spokenPrompt, false);
                }
              }}
              className={`flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_3px_0_#047857]'
                  : item.done
                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.done && !isActive && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              )}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dica do Mascote */}
      {showHint && (
        <div className="mb-5 rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 text-center flex items-center justify-center gap-3 shadow-sm">
          <span className="text-3xl">{avatarObj.emoji}</span>
          <p className="text-xs sm:text-sm font-bold text-amber-950">{question.hintText}</p>
        </div>
      )}

      {/* Main Card Container */}
      <div className="rounded-3xl border-3 border-emerald-200 bg-white p-5 sm:p-8 shadow-xl relative overflow-hidden">
        {/* ESTAÇÃO 1: ANIMAÇÃO INTERATIVA DA IGUANA + SOM FONÉTICO DO "I" */}
        {station === 'explore' && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                Conheça a <span className="text-emerald-600">Iguana Iara</span> e a Letra{' '}
                <span className="text-amber-500">I</span>!
              </h2>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                Toque na iguana animada para ela pular e ensinar o som fonético{' '}
                <strong className="text-emerald-700">/i/</strong>.
              </p>
            </div>

            <div className="mx-auto max-w-lg rounded-3xl bg-gradient-to-b from-emerald-50 to-teal-50 border-2 border-emerald-200 p-6 flex flex-col items-center gap-4">
              {/* Animated Interactive Iguana */}
              <motion.button
                type="button"
                onClick={handleTapIguana}
                animate={
                  iguanaJumpCount > 0
                    ? {
                        y: [0, -24, 0, -12, 0],
                        rotate: [0, -8, 8, -4, 0],
                        scale: [1, 1.12, 1.04, 1.08, 1],
                      }
                    : { y: [0, -6, 0] }
                }
                transition={
                  iguanaJumpCount > 0
                    ? { duration: 0.7, ease: 'easeOut' }
                    : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
                }
                key={iguanaJumpCount}
                className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_8px_0_#047857] ring-6 ring-emerald-200 cursor-pointer hover:brightness-105 active:translate-y-1"
                title="Toque na Iguana!"
              >
                <span className="text-7xl select-none" role="img" aria-label="Iguana">
                  🦎
                </span>
                <span className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-2xl font-black text-amber-950 shadow-[0_3px_0_#b45309] font-display">
                  I
                </span>
              </motion.button>

              <div className="rounded-2xl bg-white px-4 py-3 border border-emerald-200 text-sm font-bold text-emerald-950 shadow-xs max-w-md">
                {iguanaGreeting}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePlayPhonemeOnly}
                  className="flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-amber-950 shadow-[0_4px_0_#b45309] hover:bg-amber-300 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Volume2 className={`h-5 w-5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                  <span>Ouvir Som Fonético /i/</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setStation('trace');
                  }}
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-[0_4px_0_#1d4ed8] hover:bg-blue-500 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Ir para o Traçado</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ESTAÇÃO 2: TRAÇADO GUIADO DA LETRA "I" */}
        {station === 'trace' && (
          <div className="text-center space-y-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                Traçado Guiado da Letra <span className="text-emerald-600">I</span>
              </h2>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                Siga os números <strong className="text-emerald-700">1, 2 e 3</strong> com o dedo
                ou mouse para desenhar a letra <strong>I</strong>!
              </p>
            </div>

            <div className="mx-auto max-w-md flex flex-col items-center gap-4">
              <div className="w-full flex items-center justify-between text-xs font-extrabold text-slate-700 px-1">
                <span>Progresso do traçado:</span>
                <span className="text-emerald-700 tabular-nums">{traceProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-200"
                  style={{ width: `${traceProgress}%` }}
                />
              </div>

              <div className="relative rounded-3xl border-4 border-emerald-300 overflow-hidden shadow-inner bg-emerald-50">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={280}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="touch-none cursor-crosshair block w-full max-w-[320px] h-auto"
                />
              </div>

              {traceCompleted && (
                <div className="rounded-2xl bg-emerald-100 border-2 border-emerald-300 px-4 py-2.5 text-sm font-black text-emerald-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <span>Traçado perfeito da letra I!</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetTracingCanvas}
                  className="flex items-center gap-2 rounded-full bg-slate-100 px-5 py-3 text-xs font-extrabold text-slate-700 shadow-[0_3px_0_#cbd5e1] hover:bg-slate-200 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Limpar Traçado</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setStation('word_hunt');
                  }}
                  className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-black text-white shadow-[0_4px_0_#047857] hover:bg-emerald-400 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                  <span>Jogar Caça-Palavras</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ESTAÇÃO 3: MINIJOGO DE CAÇA ÀS PALAVRAS QUE COMEÇAM COM "I" */}
        {station === 'word_hunt' && (
          <div className="text-center space-y-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                Caça às Palavras com a Letra <span className="text-emerald-600">I</span>!
              </h2>
              <p className="mt-1 text-sm text-slate-600 font-medium">
                Encontradas:{' '}
                <strong className="text-emerald-700 tabular-nums">
                  {foundWordIds.length} de {TOTAL_I_WORDS}
                </strong>{' '}
                palavras mágicas
              </p>
            </div>

            <div className="mx-auto max-w-xl rounded-2xl bg-blue-50 border-2 border-blue-200 px-4 py-3 text-xs sm:text-sm font-bold text-blue-900">
              {wordHuntFeedback}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
              {PHASE_3_IGUANA_WORDS.map((item) => {
                const isFound = foundWordIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectWordHuntItem(item)}
                    className={`relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-3 transition-all cursor-pointer ${
                      isFound
                        ? 'border-emerald-500 bg-emerald-100 text-emerald-950 shadow-[0_3px_0_#059669] scale-[0.98]'
                        : 'border-amber-200 bg-amber-50/50 text-slate-800 shadow-[0_5px_0_#cbd5e1] hover:bg-amber-50 active:translate-y-1'
                    }`}
                  >
                    {isFound && (
                      <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    )}
                    <span className="text-4xl sm:text-5xl mb-2">{item.icon}</span>
                    <span className="text-base sm:text-lg font-black font-display">
                      <span className={isFound ? 'text-emerald-700 underline' : ''}>
                        {item.word.charAt(0)}
                      </span>
                      {item.word.slice(1)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setStation('challenge');
                  void speakSafely(question.spokenPrompt, false);
                }}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3.5 text-sm sm:text-base font-black text-white shadow-[0_5px_0_#c2410c] hover:brightness-105 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Sparkles className="h-5 w-5" />
                <span>Ir para o Desafio Final da Fase 3!</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* ESTAÇÃO 4: DESAFIO FINAL (SINCRONIZADO COM SUPABASE E FEEDBACK) */}
        {station === 'challenge' && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Desafio Final: Encontre a letra{' '}
                <span className="text-emerald-600">{question.targetLetter}</span> de{' '}
                {question.targetWord}!
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Toque no botão de som e escolha o card correto abaixo para concluir a Fase 3.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative">
                {isPlayingAudio && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
                    <div className="absolute -inset-4 rounded-full bg-amber-300/20 animate-pulse" />
                  </>
                )}

                <button
                  type="button"
                  onClick={() => void speakSafely(question.spokenPrompt, false)}
                  className="group relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-[0_6px_0_#c2410c] hover:brightness-105 active:translate-y-1 transition-all cursor-pointer"
                  title="Ouvir instrução da fase"
                >
                  <Volume2
                    className={`h-12 w-12 text-white ${
                      isPlayingAudio ? 'scale-110 animate-bounce' : ''
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={() => void speakSafely(question.spokenPrompt, false)}
                className="mt-3 text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Ouvir novamente</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
              {question.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectFinalOption(option)}
                    className={`group relative flex flex-col items-center justify-between p-4 sm:p-6 rounded-3xl border-3 transition-all cursor-pointer ${
                      option.colorClass
                    } ${
                      isSelected
                        ? 'scale-95 shadow-[0_2px_0_#94a3b8] translate-y-1'
                        : 'shadow-[0_6px_0_#94a3b8] hover:brightness-105 active:translate-y-1'
                    }`}
                  >
                    <span className="text-5xl sm:text-6xl font-black font-display tracking-tight transition-transform group-hover:scale-105">
                      {option.letter}
                    </span>
                    <div className="mt-3 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 shadow-xs">
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-xs font-extrabold">{option.word}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
