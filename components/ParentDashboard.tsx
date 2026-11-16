'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  Target,
  BookOpen,
  Sparkles,
  Lightbulb,
  Settings,
  RotateCcw,
  Volume2,
  Sliders,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Database,
  FileCode2,
} from 'lucide-react';
import { ChildProfile, BnccSkill, ParentTip } from '@/lib/types';
import { BNCC_SKILLS, PARENT_TIPS, AVATAR_OPTIONS } from '@/lib/game-data';
import { playPopSound, playSuccessSound } from '@/lib/sound';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface ParentDashboardProps {
  childProfile: ChildProfile;
  totalStars: number;
  completedPhasesCount: number;
  totalPhasesCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetProgress: () => void;
  onEditProfile: () => void;
  onBackToApp: () => void;
  onLogout?: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  childProfile,
  totalStars,
  completedPhasesCount,
  totalPhasesCount,
  soundEnabled,
  onToggleSound,
  onResetProgress,
  onEditProfile,
  onBackToApp,
  onLogout,
}) => {
  const [slowSpeech, setSlowSpeech] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const avatarObj = AVATAR_OPTIONS.find((a) => a.id === childProfile.avatarId) || AVATAR_OPTIONS[0];

  const handleReset = () => {
    onResetProgress();
    setResetConfirm(false);
    playPopSound();
  };

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-6 sm:py-10">
      {/* Top Header Card */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Ambiente Protegido
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-slate-300">Base Nacional Comum Curricular (BNCC)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Painel do Responsável & Educador
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Acompanhamento analítico e pedagógico em tempo real de <strong>{childProfile.name}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playPopSound();
              onBackToApp();
            }}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_3px_0_#1d4ed8] hover:bg-blue-500 active:translate-y-0.5 active:shadow-[0_1px_0_#1d4ed8] transition-all whitespace-nowrap self-start md:self-auto cursor-pointer"
          >
            <span>Voltar ao Jogo</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 4 Performance Metrics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* KPI 1: Time Spent */}
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Tempo de Uso Hoje</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            18 <span className="text-sm font-bold text-slate-500">minutos</span>
          </div>
          <p className="mt-1.5 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Dentro do tempo saudável diário</span>
          </p>
        </div>

        {/* KPI 2: Accuracy Rate */}
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Taxa de Precisão</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            91% <span className="text-sm font-bold text-slate-500">acertos</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 font-semibold">
            Excelente discriminação auditiva
          </p>
        </div>

        {/* KPI 3: Activities Done */}
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Fases Concluídas</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            {completedPhasesCount}{' '}
            <span className="text-sm font-bold text-slate-500">de {totalPhasesCount}</span>
          </div>
          <p className="mt-1.5 text-xs text-amber-700 font-semibold">
            {totalStars} estrelas douradas conquistadas
          </p>
        </div>

        {/* KPI 4: Profile & Stage */}
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Perfil Ativo</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 font-display truncate">
            {childProfile.name}
          </div>
          <p className="mt-1.5 text-xs text-slate-500 font-semibold truncate">
            {childProfile.ageGroup}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: BNCC Curriculum Skills Matrix */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-extrabold text-slate-900 font-display">
                  Competências e Habilidades BNCC
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500">1º Ano do Ensino Fundamental</span>
            </div>

            <div className="space-y-4">
              {BNCC_SKILLS.map((skill) => (
                <div key={skill.code} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-black text-blue-800">
                          {skill.code}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-800">{skill.title}</h4>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 font-medium">{skill.description}</p>
                    </div>
                    <span className="text-sm font-black text-slate-900 font-display tabular-nums">
                      {skill.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${skill.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Offline Home Activities */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-extrabold text-slate-900 font-display">
                Dicas Pedagógicas para Casa (Sem Telas)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PARENT_TIPS.map((tip, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white p-4 flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 uppercase tracking-wide mb-2">
                      {tip.targetSkill}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 font-display mb-1.5">
                      {tip.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {tip.activity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Controls, Profile & Settings */}
        <div className="space-y-6">
          {/* Child Profile Box */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Settings className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-extrabold text-slate-900 font-display">
                Perfil & Preferências
              </h2>
            </div>

            <div className="flex items-center gap-3.5 mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-2xl shadow-inner">
                {childProfile.avatarCustomUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={childProfile.avatarCustomUrl}
                    alt={childProfile.name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  avatarObj.emoji
                )}
              </div>
              <div>
                <span className="block text-sm font-extrabold text-slate-900">{childProfile.name}</span>
                <span className="text-xs text-slate-500 font-medium">
                  {avatarObj.name} · {childProfile.ageGroup}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={() => {
                  playPopSound();
                  onEditProfile();
                }}
                className="w-full py-2.5 px-4 rounded-xl border-2 border-blue-600 text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="h-4 w-4" />
                <span>Editar Nome ou Avatar da Criança</span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full py-2 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Sair da Conta / Novo Cadastro</span>
                </button>
              )}
            </div>

            {/* Audio Settings */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-800">Efeitos Sonoros</span>
                  <span className="text-[11px] text-slate-500">Sons táteis e arpeggios</span>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    soundEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="block text-xs font-bold text-slate-800">Fala em Ritmo Lento</span>
                  <span className="text-[11px] text-slate-500">Ideal para início de alfabetização</span>
                </div>
                <button
                  onClick={() => {
                    setSlowSpeech(!slowSpeech);
                    playPopSound();
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    slowSpeech ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>

            {/* Reset Progress Section */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              {resetConfirm ? (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-center">
                  <p className="text-xs font-bold text-red-800 mb-2">
                    Deseja reiniciar as fases e estrelas para uma nova rodada?
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs shadow-xs"
                    >
                      Sim, Reiniciar
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reiniciar Progresso da Trilha</span>
                </button>
              )}
            </div>
          </div>

          {/* Supabase Database Integration Status Card */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 font-display">
                  Integração Supabase
                </h3>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isSupabaseConfigured()
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                  }`}
                />
                <span>{isSupabaseConfigured() ? 'Conectado' : 'Estrutura Pronta'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
              As tabelas de autenticação e progresso estão modeladas e prontas para sincronização em nuvem via PostgreSQL:
            </p>

            <div className="space-y-2 text-xs">
              {[
                { name: 'profiles', desc: 'Contas de responsáveis e educadores' },
                { name: 'children', desc: 'Perfis e mascotes das crianças' },
                { name: 'game_progress', desc: 'Fases, estrelas e status da trilha' },
                { name: 'medals_unlocked', desc: 'Medalhas e conquistas desbloqueadas' },
                { name: 'activity_logs', desc: 'Histórico pedagógico de fonemas e acertos' },
              ].map((table) => (
                <div
                  key={table.name}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]"
                >
                  <span className="font-mono font-bold text-slate-800">{table.name}</span>
                  <span className="text-slate-500">{table.desc}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <FileCode2 className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Script de criação com RLS: supabase/schema.sql</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ParentalGateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(5);
  const [userAnswer, setUserAnswer] = useState('');
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const expectedAnswer = num1 + num2;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAnswer.trim(), 10) === expectedAnswer) {
      playSuccessSound();
      setUserAnswer('');
      setHasError(false);
      setNum1(Math.floor(Math.random() * 6) + 4);
      setNum2(Math.floor(Math.random() * 5) + 3);
      onSuccess();
      onClose();
    } else {
      playPopSound();
      setHasError(true);
      setUserAnswer('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-3 border-purple-200 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 font-display">
          Acesso dos Responsáveis
        </h3>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Para garantir a segurança, responda ao desafio matemático abaixo para prosseguir:
        </p>

        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div className="rounded-2xl bg-purple-50 p-4 border border-purple-200 text-lg font-black text-purple-900 font-display">
            Quanto é {num1} + {num2}?
          </div>

          <div>
            <input
              type="number"
              autoFocus
              required
              placeholder="Digite o resultado..."
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value);
                if (hasError) setHasError(false);
              }}
              className="w-full h-13 rounded-2xl border-2 border-slate-200 px-4 text-center text-lg font-bold text-slate-800 focus:border-purple-600 focus:outline-none"
            />
            {hasError && (
              <p className="mt-1.5 text-xs font-bold text-red-600">
                Resultado incorreto. Tente novamente!
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-full bg-purple-600 text-white font-extrabold text-xs shadow-[0_3px_0_#6b21a8] hover:bg-purple-700 active:translate-y-0.5 active:shadow-[0_1px_0_#6b21a8] transition-all"
            >
              Acessar Painel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
