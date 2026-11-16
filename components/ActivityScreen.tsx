'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, HelpCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { ActivityQuestion, ActivityOption, Phase, ChildProfile } from '@/lib/types';
import { AVATAR_OPTIONS, validateActivityQuestion } from '@/lib/game-data';
import { speakInPortuguese, playPopSound } from '@/lib/sound';
import { isPhonemeAnswerCorrect, normalizePhonemeString } from '@/lib/utils';
import { Phase3IguanaActivity } from '@/components/Phase3IguanaActivity';

interface ActivityScreenProps {
  question: ActivityQuestion;
  currentPhase: Phase;
  childProfile: ChildProfile;
  soundEnabled: boolean;
  onAnswerSelected: (option: ActivityOption) => void;
  onBackToMap: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  question,
  currentPhase,
  childProfile,
  soundEnabled,
  onAnswerSelected,
  onBackToMap,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const avatarObj = AVATAR_OPTIONS.find((a) => a.id === childProfile.avatarId) || AVATAR_OPTIONS[0];
  const isPhase3Iguana = currentPhase.id === 'fase-3' || question.phaseId === 'fase-3';

  // Validação em tempo de execução para garantir que a letra-alvo exista nas opções
  useEffect(() => {
    validateActivityQuestion(question);
  }, [question]);

  const handlePlayPromptAudio = React.useCallback(async () => {
    setIsPlayingAudio(true);
    playPopSound();
    await speakInPortuguese(question.spokenPrompt, false);
    setIsPlayingAudio(false);
  }, [question.spokenPrompt]);

  // Play audio on question load (apenas para fases fora da Fase 3, que já gerencia sua própria narração)
  useEffect(() => {
    if (isPhase3Iguana) return;
    let active = true;
    if (soundEnabled) {
      const timer = setTimeout(() => {
        if (active) {
          handlePlayPromptAudio();
        }
      }, 150);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [question.id, soundEnabled, isPhase3Iguana, handlePlayPromptAudio]);

  const handleSelect = React.useCallback(
    (option: ActivityOption) => {
      if (selectedOptionId) return;
      playPopSound();
      setSelectedOptionId(option.id);

      const validatedIsCorrect =
        isPhonemeAnswerCorrect(option.letter, question.targetLetter) || option.isCorrect;

      // Give tactile feedback delay
      setTimeout(() => {
        onAnswerSelected({
          ...option,
          isCorrect: validatedIsCorrect,
        });
      }, 280);
    },
    [selectedOptionId, question.targetLetter, onAnswerSelected]
  );

  // Support keyboard input (accepting 'a', 'á', 'A', 'Á', etc.)
  useEffect(() => {
    if (isPhase3Iguana) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedOptionId || event.metaKey || event.ctrlKey || event.altKey) return;
      const normalizedKey = normalizePhonemeString(event.key);
      if (!normalizedKey || normalizedKey.length !== 1) return;

      const matchedOption = question.options.find(
        (opt) => normalizePhonemeString(opt.letter) === normalizedKey
      );
      if (matchedOption) {
        handleSelect({
          ...matchedOption,
          isCorrect:
            isPhonemeAnswerCorrect(event.key, question.targetLetter) ||
            isPhonemeAnswerCorrect(matchedOption.letter, question.targetLetter) ||
            matchedOption.isCorrect,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPhase3Iguana, question.options, question.targetLetter, selectedOptionId, handleSelect]);

  // Fase 3 dedicada exclusivamente à Vogal "I" — I de Iguana
  if (isPhase3Iguana) {
    return (
      <Phase3IguanaActivity
        question={question}
        currentPhase={currentPhase}
        childProfile={childProfile}
        soundEnabled={soundEnabled}
        onAnswerSelected={onAnswerSelected}
        onBackToMap={onBackToMap}
      />
    );
  }

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-6 sm:py-8">
      {/* Top Bar with Back button and Phase Indicator */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => {
            playPopSound();
            onBackToMap();
          }}
          className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-700 shadow-[0_3px_0_#cbd5e1] hover:bg-slate-50 active:translate-y-0.5 active:shadow-[0_1px_0_#cbd5e1] transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Mapa</span>
        </button>

        <div className="flex items-center gap-2 rounded-2xl bg-blue-100/80 px-4 py-2 border border-blue-200">
          <span className="text-xs font-black text-blue-900 uppercase">
            Fase {currentPhase.number}
          </span>
          <span className="text-blue-400">·</span>
          <span className="text-xs font-bold text-blue-800">{currentPhase.title}</span>
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
          title="Ver dica do mascote"
        >
          <HelpCircle className="h-4 w-4 text-amber-600" />
          <span className="hidden sm:inline">Dica</span>
        </button>
      </div>

      {/* Main Playful Card */}
      <div className="rounded-3xl border-3 border-blue-200 bg-white p-6 sm:p-10 shadow-xl relative overflow-hidden">
        {/* Soft background glow */}
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-blue-100/50 blur-2xl" />

        {/* Title and Instruction */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-900 mb-3">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Desafio: Ouça e encontre a letra certa!</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-display">
            {question.spokenPrompt}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-md mx-auto">
            Toque no botão de áudio e escolha o card correspondente à letra{' '}
            <strong className="text-blue-700">{question.targetLetter}</strong> ({question.targetWord}).
          </p>
        </div>

        {/* Giant Centered Glowing Audio Button */}
        <div className="flex flex-col items-center justify-center my-8">
          <div className="relative">
            {/* Animated Sound Wave Rings */}
            {isPlayingAudio && (
              <>
                <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
                <div className="absolute -inset-4 rounded-full bg-amber-300/20 animate-pulse" />
              </>
            )}

            <button
              onClick={handlePlayPromptAudio}
              className={`group relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full transition-all cursor-pointer shadow-xl ${
                isPlayingAudio
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 scale-105 shadow-[0_6px_0_#c2410c] ring-6 ring-amber-300'
                  : 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-[0_6px_0_#c2410c] hover:brightness-105 active:translate-y-1.5 active:shadow-[0_2px_0_#c2410c]'
              }`}
              title="Clique para ouvir a pergunta falada"
            >
              <Volume2
                className={`h-14 w-14 sm:h-16 sm:w-16 text-white transition-transform ${
                  isPlayingAudio ? 'scale-110 animate-bounce' : 'group-hover:scale-105'
                }`}
              />
            </button>
          </div>

          {/* Sound wave visualizer bars */}
          <div className="mt-4 flex items-center gap-1.5 h-6">
            {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7].map((height, idx) => (
              <span
                key={idx}
                className={`w-1.5 rounded-full bg-amber-500 transition-all ${
                  isPlayingAudio ? 'animate-pulse' : 'opacity-40'
                }`}
                style={{
                  height: isPlayingAudio ? `${height * 24}px` : '8px',
                  animationDelay: `${idx * 120}ms`,
                }}
              />
            ))}
          </div>

          <button
            onClick={handlePlayPromptAudio}
            className="mt-2 text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Toque para repetir o som</span>
          </button>
        </div>

        {/* Mascot Hint Bubble if toggled */}
        {showHint && (
          <div className="mb-6 rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 text-center max-w-lg mx-auto flex items-center justify-center gap-3">
            <span className="text-3xl">{avatarObj.emoji}</span>
            <p className="text-xs sm:text-sm font-bold text-amber-950">{question.hintText}</p>
          </div>
        )}

        {/* 4 Tactile Bubbly Answer Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4">
          {question.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                className={`group relative flex flex-col items-center justify-between p-4 sm:p-6 rounded-3xl border-3 transition-all cursor-pointer ${
                  option.colorClass
                } ${
                  isSelected
                    ? 'scale-95 shadow-[0_2px_0_#94a3b8] translate-y-1'
                    : 'shadow-[0_6px_0_#94a3b8] hover:brightness-105 active:translate-y-1 active:shadow-[0_2px_0_#94a3b8]'
                }`}
              >
                {/* Big Letter Display */}
                <span className="text-5xl sm:text-6xl font-black font-display tracking-tight transition-transform group-hover:scale-105 drop-shadow-xs">
                  {option.letter}
                </span>

                {/* Illustrated Badge / Word */}
                <div className="mt-3 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 shadow-xs">
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-xs font-extrabold">{option.word}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
