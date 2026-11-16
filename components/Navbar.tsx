'use client';

import React from 'react';
import Image from 'next/image';
import { Compass, Sparkles, User, Award, ShieldCheck, Volume2, VolumeX, BookOpen } from 'lucide-react';
import { ChildProfile, ScreenState } from '@/lib/types';
import { AVATAR_OPTIONS } from '@/lib/game-data';

interface NavbarProps {
  currentScreen: ScreenState;
  onNavigate: (screen: ScreenState) => void;
  childProfile: ChildProfile | null;
  totalStars: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenParentGate: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  childProfile,
  totalStars,
  soundEnabled,
  onToggleSound,
  onOpenParentGate,
  onLogout,
}) => {
  const avatarObj = AVATAR_OPTIONS.find((a) => a.id === childProfile?.avatarId) || AVATAR_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Zone 1: Single Brand element with Logo */}
        <button
          onClick={() => onNavigate(childProfile ? 'map' : 'auth')}
          className="group flex items-center gap-3 text-left transition-transform active:scale-95 cursor-pointer"
        >
          <div className="relative h-12 w-14 sm:h-13 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-amber-50 p-0.5 border border-amber-200 shadow-xs">
            <Image
              src="/assets/aistudio/logo_aprendiz_kids_088c8185.jpg"
              alt="Aprendiz Kids Logo"
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
              priority
            />
          </div>
          <div className="leading-tight">
            <span className="block text-xl font-black tracking-tight text-blue-900 sm:text-2xl font-display">
              Aprendiz <span className="text-amber-500">Kids</span>
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          <button
            onClick={() => onNavigate(childProfile ? 'map' : 'auth')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              currentScreen === 'map'
                ? 'bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-200'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
            }`}
          >
            <Compass className="h-4 w-4 text-blue-500" />
            <span className="whitespace-nowrap">Trilha de Fases</span>
          </button>

          <button
            onClick={() => onNavigate('activity')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              currentScreen === 'activity' || currentScreen === 'feedback'
                ? 'bg-amber-50 text-amber-800 shadow-xs ring-1 ring-amber-200'
                : 'text-slate-600 hover:text-amber-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="whitespace-nowrap">Atividade Sonora</span>
          </button>

          <button
            onClick={() => onNavigate('library')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              currentScreen === 'library'
                ? 'bg-sky-50 text-sky-800 shadow-xs ring-1 ring-sky-200'
                : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="h-4 w-4 text-sky-500" />
            <span className="hidden lg:inline">Biblioteca de Histórias</span>
            <span className="lg:hidden">Livros</span>
          </button>

          <button
            onClick={() => onNavigate('progress')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              currentScreen === 'progress'
                ? 'bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-200'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
            }`}
          >
            <Award className="h-4 w-4 text-emerald-500" />
            <span className="whitespace-nowrap">Meu Progresso</span>
          </button>

          <button
            onClick={onOpenParentGate}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              currentScreen === 'dashboard'
                ? 'bg-purple-50 text-purple-800 shadow-xs ring-1 ring-purple-200'
                : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-purple-500" />
            <span className="whitespace-nowrap">Área dos Pais</span>
          </button>
        </nav>

        {/* Zone 3: Audio Control & Child Profile / Auth Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Silenciar áudio' : 'Ativar áudio'}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shadow-xs active:scale-95"
            title={soundEnabled ? 'Sons ativados' : 'Sons silenciados'}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5 text-blue-600" /> : <VolumeX className="h-5 w-5 text-slate-400" />}
          </button>

          {childProfile ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('progress')}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 shadow-xs hover:border-amber-400 transition-all active:scale-95 cursor-pointer"
                title="Ver perfil da criança"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-lg shadow-inner">
                  {childProfile.avatarCustomUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={childProfile.avatarCustomUrl}
                      alt={childProfile.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{avatarObj.emoji}</span>
                  )}
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-800 leading-none truncate max-w-[80px] sm:max-w-[120px]">
                    {childProfile.name}
                  </span>
                  <span className="text-[11px] font-extrabold text-amber-700 flex items-center gap-0.5">
                    ★ {totalStars}
                  </span>
                </div>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Sair / Trocar de Conta"
                >
                  <span>Sair</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white shadow-[0_3px_0_#1d4ed8] hover:bg-blue-700 active:translate-y-0.5 active:shadow-[0_1px_0_#1d4ed8] transition-all whitespace-nowrap cursor-pointer"
            >
              <User className="h-4 w-4" />
              <span>Cadastrar / Entrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-100 bg-white/90 px-2 py-2">
        <button
          onClick={() => onNavigate(childProfile ? 'map' : 'auth')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${
            currentScreen === 'map' ? 'text-blue-600' : 'text-slate-500'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Trilha</span>
        </button>
        <button
          onClick={() => onNavigate('activity')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${
            currentScreen === 'activity' || currentScreen === 'feedback' ? 'text-amber-600' : 'text-slate-500'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Atividade</span>
        </button>
        <button
          onClick={() => onNavigate('library')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${
            currentScreen === 'library' ? 'text-sky-600' : 'text-slate-500'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Livros</span>
        </button>
        <button
          onClick={() => onNavigate('progress')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${
            currentScreen === 'progress' ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Progresso</span>
        </button>
        <button
          onClick={onOpenParentGate}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${
            currentScreen === 'dashboard' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Responsável</span>
        </button>
      </div>
    </header>
  );
};
