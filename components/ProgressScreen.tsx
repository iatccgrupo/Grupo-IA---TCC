'use client';

import React, { useState } from 'react';
import { Award, Star, Compass, CheckCircle2, Lock, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { Medal, ChildProfile } from '@/lib/types';
import { AVATAR_OPTIONS } from '@/lib/game-data';
import { playPopSound } from '@/lib/sound';

interface ProgressScreenProps {
  childProfile: ChildProfile;
  totalStars: number;
  medals: Medal[];
  completedPhasesCount: number;
  totalPhasesCount: number;
  onNavigateMap: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  childProfile,
  totalStars,
  medals,
  completedPhasesCount,
  totalPhasesCount,
  onNavigateMap,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const avatarObj = AVATAR_OPTIONS.find((a) => a.id === childProfile.avatarId) || AVATAR_OPTIONS[0];

  // Calculate percentage of journey
  const progressPercent = Math.min(100, Math.round((completedPhasesCount / totalPhasesCount) * 100));

  const filteredMedals = medals.filter((m) => {
    if (filter === 'unlocked') return m.unlocked;
    if (filter === 'locked') return !m.unlocked;
    return true;
  });

  const unlockedCount = medals.filter((m) => m.unlocked).length;

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-6 sm:py-10">
      {/* Child Profile Showcase Card */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-52 w-52 rounded-full bg-white/20 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl bg-white text-4xl sm:text-5xl shadow-[0_5px_0_#c2410c] ring-4 ring-white/40">
              {childProfile.avatarCustomUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={childProfile.avatarCustomUrl}
                  alt={childProfile.name}
                  className="h-full w-full rounded-3xl object-cover"
                />
              ) : (
                <span>{avatarObj.emoji}</span>
              )}
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm ring-2 ring-white">
                <Trophy className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-950 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-yellow-200" />
                <span>Nível Atual: Ilha das Vogais (Fase 3)</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-amber-950">
                {childProfile.name}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-amber-900 mt-0.5">
                Mascote: {avatarObj.name} ({avatarObj.desc}) · {childProfile.ageGroup}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0">
            <div className="rounded-2xl bg-white/25 p-3.5 backdrop-blur-md border border-white/30 text-center">
              <span className="block text-[11px] font-black uppercase tracking-wider text-amber-950">
                Estrelas
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-950 font-display">
                {totalStars} ⭐
              </span>
            </div>

            <div className="rounded-2xl bg-white/25 p-3.5 backdrop-blur-md border border-white/30 text-center">
              <span className="block text-[11px] font-black uppercase tracking-wider text-amber-950">
                Medalhas
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-950 font-display">
                {unlockedCount} / {medals.length}
              </span>
            </div>
          </div>
        </div>

        {/* Volumetric Progress Bar with Avatar Knob */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <div className="flex items-center justify-between text-xs font-black text-amber-950 mb-2">
            <span>Progresso da Jornada BNCC</span>
            <span>{completedPhasesCount} de {totalPhasesCount} fases concluídas ({progressPercent}%)</span>
          </div>

          <div className="relative h-6 w-full rounded-full bg-amber-950/20 p-1 shadow-inner">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 shadow-[0_2px_4px_rgba(0,0,0,0.15)] transition-all duration-700 ease-out"
              style={{ width: `${Math.max(12, progressPercent)}%` }}
            >
              {/* Shimmer liquid reflection */}
              <div className="absolute inset-0 rounded-full bg-white/25 opacity-70" />

              {/* Floating avatar knob on the progress bar */}
              <div className="absolute -right-3.5 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-md ring-2 ring-emerald-500">
                {avatarObj.emoji}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medals Gallery Section */}
      <div className="rounded-3xl border-3 border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                Galeria de Medalhas Mágicas
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
              Cada vitória na trilha desbloqueia uma medalha brilhante para sua coleção!
            </p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1.5 self-start sm:self-auto">
            <button
              onClick={() => {
                setFilter('all');
                playPopSound();
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filter === 'all'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({medals.length})
            </button>
            <button
              onClick={() => {
                setFilter('unlocked');
                playPopSound();
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filter === 'unlocked'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Conquistadas ({unlockedCount})
            </button>
            <button
              onClick={() => {
                setFilter('locked');
                playPopSound();
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filter === 'locked'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A Conquistar ({medals.length - unlockedCount})
            </button>
          </div>
        </div>

        {/* Medals Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMedals.map((medal) => {
            return (
              <div
                key={medal.id}
                className={`relative rounded-3xl p-5 border-3 transition-all flex flex-col justify-between ${
                  medal.unlocked
                    ? 'border-amber-300 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 shadow-md hover:scale-[1.02]'
                    : 'border-slate-200 bg-slate-50/60 opacity-60'
                }`}
              >
                <div>
                  {/* Top Badge Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-sm ${
                        medal.unlocked
                          ? 'bg-gradient-to-br from-amber-300 to-yellow-400 ring-4 ring-amber-100 shadow-[0_3px_0_#d97706]'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {medal.icon}
                    </div>

                    {medal.unlocked ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{medal.unlockedDate || 'Ganho!'}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-600">
                        <Lock className="h-3 w-3" />
                        <span>Bloqueada</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 font-display">
                    {medal.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                    {medal.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {medal.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action to continue the journey */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              playPopSound();
              onNavigateMap();
            }}
            className="px-8 py-3.5 rounded-full bg-blue-600 text-white font-extrabold text-sm shadow-[0_4px_0_#1d4ed8] hover:bg-blue-700 active:translate-y-0.5 active:shadow-[0_1px_0_#1d4ed8] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            <span>Voltar para a Trilha de Fases</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
