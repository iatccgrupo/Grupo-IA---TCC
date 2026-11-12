'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Star, Sparkles, ArrowRight, RotateCcw, Volume2, Heart, Award } from 'lucide-react';
import { ActivityOption, ActivityQuestion, ChildProfile } from '@/lib/types';
import { AVATAR_OPTIONS } from '@/lib/game-data';
import { playSuccessSound, playTryAgainSound, playStarSound, playPopSound, speakInPortuguese } from '@/lib/sound';

interface FeedbackScreenProps {
  isCorrect: boolean;
  selectedOption: ActivityOption;
  question: ActivityQuestion;
  childProfile: ChildProfile;
  soundEnabled: boolean;
  onNextQuestion: () => void;
  onRetryQuestion: () => void;
  onBackToMap: () => void;
}

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
  isCorrect,
  selectedOption,
  question,
  childProfile,
  soundEnabled,
  onNextQuestion,
  onRetryQuestion,
  onBackToMap,
}) => {
  const [starsRevealed, setStarsRevealed] = useState(0);
  const avatarObj = AVATAR_OPTIONS.find((a) => a.id === childProfile.avatarId) || AVATAR_OPTIONS[0];

  useEffect(() => {
    if (isCorrect) {
      if (soundEnabled) {
        playSuccessSound();
      }

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#3b82f6', '#10b981', '#f97316', '#a855f7'],
        });

        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#fbbf24', '#3b82f6', '#10b981'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#f97316', '#a855f7', '#fbbf24'],
          });
        }, 350);
      } catch {
        // Fallback if canvas is unavailable
      }

      // Staggered star reveal with chimes
      setTimeout(() => {
        setStarsRevealed(1);
        if (soundEnabled) playStarSound(0);
      }, 400);

      setTimeout(() => {
        setStarsRevealed(2);
        if (soundEnabled) playStarSound(1);
      }, 750);

      setTimeout(() => {
        setStarsRevealed(3);
        if (soundEnabled) playStarSound(2);
      }, 1100);

      if (soundEnabled) {
        setTimeout(() => {
          speakInPortuguese(`Sensacional, ${childProfile.name}! Você acertou a letrinha ${question.targetLetter}!`, false);
        }, 1300);
      }
    } else {
      if (soundEnabled) {
        playTryAgainSound();
        setTimeout(() => {
          speakInPortuguese(`Quase lá, ${childProfile.name}! Que tal tentar de novo?`, false);
        }, 300);
      }
    }
  }, [isCorrect, soundEnabled, childProfile.name, question.targetLetter]);

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {isCorrect ? (
        /* ACERTO: Celebration State */
        <div className="rounded-3xl border-4 border-amber-300 bg-white p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Top celebratory badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black text-emerald-900 mb-4">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Resposta Perfeita!</span>
          </div>

          {/* Happy Animated Mascot */}
          <div className="relative mx-auto mb-4 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-tr from-amber-300 via-amber-400 to-yellow-300 text-5xl sm:text-6xl shadow-[0_5px_0_#d97706] ring-6 ring-amber-100 animate-bounce">
            {avatarObj.emoji}
            <span className="absolute -top-2 -right-2 text-2xl">🎉</span>
          </div>

          {/* Heading with Child's Name */}
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-display">
            Sensacional, {childProfile.name}!
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Você encontrou a letrinha{' '}
            <strong className="text-emerald-600 font-black text-lg sm:text-xl font-display">
              {question.targetLetter} de {question.targetWord}
            </strong>
            !
          </p>

          {/* Animated Stars Card */}
          <div className="my-6 rounded-2xl bg-amber-50/70 border-2 border-amber-200 p-4 max-w-md mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 block mb-2">
              Estrelas Conquistadas
            </span>
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3].map((starNum) => {
                const isRevealed = starNum <= starsRevealed;
                return (
                  <div
                    key={starNum}
                    className={`transition-all duration-300 ${
                      isRevealed ? 'scale-110 rotate-3' : 'scale-90 opacity-40'
                    }`}
                  >
                    <Star
                      className={`h-10 w-10 sm:h-12 sm:w-12 ${
                        isRevealed
                          ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_2px_4px_rgba(251,191,36,0.6)] animate-pulse'
                          : 'fill-slate-200 text-slate-300'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-700">
              <Award className="h-4 w-4" />
              <span>+50 Pontos de Sabedoria Adicionados!</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                playPopSound();
                onNextQuestion();
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-base shadow-[0_5px_0_#047857] hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_#047857] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Próximo Desafio</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            <button
              onClick={() => {
                playPopSound();
                onBackToMap();
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-full bg-slate-100 text-slate-700 font-extrabold text-sm shadow-[0_3px_0_#cbd5e1] hover:bg-slate-200 active:translate-y-0.5 active:shadow-[0_1px_0_#cbd5e1] transition-all cursor-pointer"
            >
              <span>Voltar ao Mapa da Trilha</span>
            </button>
          </div>
        </div>
      ) : (
        /* ERRO CONSTRUTIVO: Loving, gentle encouragement without punishment */
        <div className="rounded-3xl border-4 border-orange-200 bg-white p-6 sm:p-10 shadow-xl text-center relative overflow-hidden">
          {/* Top Encouragement Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-4 py-1.5 text-xs font-black text-orange-900 mb-4">
            <Heart className="h-4 w-4 text-orange-600 fill-orange-600" />
            <span>Quase lá! Toda tentativa nos ensina</span>
          </div>

          {/* Caring Mascot */}
          <div className="mx-auto mb-4 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-orange-100 text-5xl sm:text-6xl border-3 border-orange-300 shadow-inner">
            {avatarObj.emoji}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Muito bem por tentar, {childProfile.name}!
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-md mx-auto">
            Você tocou na letrinha <strong>{selectedOption.letter}</strong> ({selectedOption.word}).
            Que tal ouvir o som da letrinha{' '}
            <strong className="text-amber-600 font-extrabold font-display">{question.targetLetter}</strong> mais uma vez com carinho?
          </p>

          {/* Hint Card */}
          <div className="my-6 rounded-2xl bg-amber-50 border-2 border-amber-200 p-4 max-w-md mx-auto text-left flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900 font-bold">
              💡
            </div>
            <div>
              <span className="block text-xs font-black text-amber-900">
                Dica Amiga de {avatarObj.name}:
              </span>
              <p className="text-xs font-bold text-amber-800 mt-0.5">{question.hintText}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                playPopSound();
                onRetryQuestion();
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-base shadow-[0_5px_0_#c2410c] hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_#c2410c] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Ouvir e Tentar de Novo!</span>
            </button>

            <button
              onClick={() => {
                playPopSound();
                onBackToMap();
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-full bg-slate-100 text-slate-700 font-extrabold text-sm shadow-[0_3px_0_#cbd5e1] hover:bg-slate-200 active:translate-y-0.5 active:shadow-[0_1px_0_#cbd5e1] transition-all cursor-pointer"
            >
              <span>Escolher Outra Fase</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
