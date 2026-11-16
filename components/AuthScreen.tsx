'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Shield,
  User,
  Camera,
  ArrowRight,
  Check,
  Heart,
  BookOpen,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { ChildProfile } from '@/lib/types';
import { AVATAR_OPTIONS, INITIAL_LEVELS } from '@/lib/game-data';
import { playPopSound, playSuccessSound } from '@/lib/sound';
import {
  signUpWithSupabase,
  signInWithSupabase,
  saveChildProfileWithResultToSupabase,
  loadChildWorkspaceFromSupabase,
  saveInitialProgressForChildToSupabase,
  RestoredWorkspace,
} from '@/lib/supabase/service';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthScreenProps {
  onCompleteProfile: (profile: ChildProfile, restoredWorkspace?: RestoredWorkspace) => void;
  onSkipToPlay?: () => void;
  existingProfile?: ChildProfile | null;
  initialStep?: 'auth' | 'child_profile';
  activeParentId?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onCompleteProfile,
  existingProfile,
  initialStep = 'auth',
  activeParentId = '',
}) => {
  // Mode: register (Cadastro) or login (Entrar)
  const [mode, setMode] = useState<'register' | 'login'>('register');
  // Step 1: Login & Senha (MUST BE THE FIRST SCREEN)
  // Step 2: Perfil da Criança
  const [step, setStep] = useState<'auth' | 'child_profile'>(
    initialStep === 'child_profile' && existingProfile ? 'child_profile' : 'auth'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentId, setParentId] = useState<string>(activeParentId);

  // Parent credentials
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Child profile setup (Step 2)
  const [childName, setChildName] = useState(existingProfile?.name || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState(existingProfile?.avatarId || 'fox');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(
    existingProfile?.avatarCustomUrl || null
  );
  const [ageGroup, setAgeGroup] = useState(
    existingProfile?.ageGroup || '5 a 6 anos (1º Ano)'
  );
  const [nameError, setNameError] = useState('');
  const [childProfileError, setChildProfileError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomPhotoUrl(reader.result as string);
        playPopSound();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleParentAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanName = parentName.trim();
    const cleanEmail = parentEmail.trim();

    if (mode === 'register' && !cleanName) {
      setAuthError('Por favor, informe o nome do responsável ou educador.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Por favor, informe um e-mail válido para o login.');
      return;
    }

    if (parentPassword.length < 6) {
      setAuthError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (mode === 'register' && confirmPassword.length < 6) {
      setAuthError('A confirmação da senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (mode === 'register' && parentPassword !== confirmPassword) {
      setAuthError('As senhas não coincidem. Digite novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      let resolvedName = cleanName || 'Responsável';
      let resolvedParentId = '';

      if (mode === 'register') {
        const result = await signUpWithSupabase(
          cleanName,
          cleanEmail,
          parentPassword
        );

        if (!result.success) {
          setAuthError(
            result.error ||
              'Erro ao enviar cadastro para o Supabase. Verifique sua conexão e configuração.'
          );
          return;
        }

        if (result.userId) {
          resolvedParentId = result.userId;
          setParentId(result.userId);
        }
        if (result.name) {
          resolvedName = result.name;
        }
      } else {
        const result = await signInWithSupabase(cleanEmail, parentPassword);

        if (!result.success) {
          setAuthError(result.error || 'E-mail ou senha incorretos.');
          return;
        }

        if (result.userId) {
          resolvedParentId = result.userId;
          setParentId(result.userId);
        }
        if (result.name) {
          resolvedName = result.name;
        }
      }

      playSuccessSound();

      // Save parent login info to localStorage for offline persistence
      try {
        localStorage.setItem(
          'aventura_parent_account',
          JSON.stringify({
            id: resolvedParentId,
            name: resolvedName,
            email: cleanEmail,
            loggedAt: new Date().toISOString(),
          })
        );
      } catch {}

      if (mode === 'login') {
        // Buscar perfil da criança + etapas concluídas + medalhas direto do Supabase
        if (resolvedParentId) {
          const workspace = await loadChildWorkspaceFromSupabase(resolvedParentId);
          if (workspace.child) {
            onCompleteProfile(workspace.child, workspace);
            return;
          }
        }

        // Fallback local se ainda houver perfil salvo no dispositivo
        try {
          const savedChild = localStorage.getItem('aventura_child_profile');
          if (savedChild) {
            const parsed = JSON.parse(savedChild) as ChildProfile;
            onCompleteProfile(parsed);
            return;
          }
        } catch {}

        setStep('child_profile');
      } else {
        setStep('child_profile');
      }
    } catch (err: unknown) {
      const fallbackMessage =
        err instanceof Error
          ? err.message
          : 'Erro inesperado de conexão ao autenticar no Supabase.';
      setAuthError(fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateChildProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setChildProfileError('');
    if (!childName.trim()) {
      setNameError('Por favor, digite o primeiro nome da criança!');
      return;
    }
    setNameError('');
    setIsSubmitting(true);

    try {
      const isEditingExisting = Boolean(existingProfile);
      const newProfile: ChildProfile = {
        id: existingProfile?.id || 'child-' + Date.now(),
        name: childName.trim(),
        avatarId: selectedAvatarId,
        avatarCustomUrl: customPhotoUrl || undefined,
        ageGroup,
        createdAt: existingProfile?.createdAt || new Date().toLocaleDateString('pt-BR'),
      };

      let resolvedParentId = parentId;
      if (!resolvedParentId) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user?.id) {
            resolvedParentId = session.user.id;
            setParentId(session.user.id);
          }
        }
      }

      let finalProfile = newProfile;

      // Sincronizar com tabela children do Supabase se o parentId estiver ativo
      if (resolvedParentId) {
        const saveResult = await saveChildProfileWithResultToSupabase(
          newProfile,
          resolvedParentId
        );
        if (!saveResult.success) {
          setChildProfileError(
            saveResult.error ||
              'Não foi possível salvar o perfil da criança no banco Supabase.'
          );
          return;
        }
        if (saveResult.child) {
          finalProfile = saveResult.child;
        }

        // Ao criar novo perfil, sincroniza as fases iniciais na tabela game_progress
        if (!isEditingExisting) {
          await saveInitialProgressForChildToSupabase(finalProfile.id, INITIAL_LEVELS);
        }
      }

      playSuccessSound();
      onCompleteProfile(finalProfile);
    } catch (err: unknown) {
      setChildProfileError(
        err instanceof Error
          ? err.message
          : 'Erro inesperado ao salvar o perfil da criança.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-sky-100/60 via-amber-50/40 to-orange-100/50">
      {/* Playful Floating Vibrant Background Shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full bg-gradient-to-br from-amber-300/40 via-yellow-200/50 to-orange-300/30 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-16 w-96 h-96 rounded-full bg-gradient-to-bl from-blue-300/40 via-sky-200/40 to-cyan-300/30 blur-3xl" />
        <div className="absolute -bottom-10 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-300/40 via-teal-200/30 to-lime-300/30 blur-3xl" />
      </div>

      <div className="w-full max-w-xl">
        {/* Floating Brand Logo Header */}
        <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
          <div className="relative h-28 w-56 sm:h-36 sm:w-72 transition-transform hover:scale-105 duration-300 drop-shadow-md">
            <Image
              src="/assets/aistudio/logo_aprendiz_kids_088c8185.jpg"
              alt="Aprendiz Kids Logo"
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
              priority
            />
          </div>
        </div>

        {step === 'auth' ? (
          /* ================================================================ */
          /* TELA 1: CADASTRO DE LOGIN E SENHA COM CORES VIVAS E VIBRANTES    */
          /* ================================================================ */
          <div className="rounded-3xl border-4 border-amber-300 bg-white/95 backdrop-blur-md p-6 sm:p-9 shadow-[0_20px_50px_rgba(245,158,11,0.22),0_10px_25px_rgba(37,99,235,0.1)] relative overflow-hidden">
            {/* Top Step Pill */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-amber-100">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-black text-white shadow-[0_2px_0_#c2410c]">
                  1
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-950 font-display">
                  {mode === 'register' ? 'Cadastro do Responsável' : 'Login do Responsável'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-700 font-extrabold">
                <span>Etapa 1 de 2</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Title & Welcoming Pitch */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                {mode === 'register' ? (
                  <>
                    Comece a <span className="text-blue-600">Aventura</span> da{' '}
                    <span className="text-amber-500">Alfabetização</span>! ✨
                  </>
                ) : (
                  <>
                    Bem-vindo de volta ao <span className="text-blue-600">Aprendiz</span>{' '}
                    <span className="text-amber-500">Kids</span>! 🌟
                  </>
                )}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                {mode === 'register'
                  ? 'Crie seu login seguro para desbloquear as fases de fonemas, trilhas interativas e relatórios pedagógicos da BNCC.'
                  : 'Entre com seu e-mail e senha para retomar a trilha de aventuras da criança.'}
              </p>
            </div>

            {/* Supabase Status Pill */}
            <div className="mb-5 flex items-center justify-center">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black ${
                  isSupabaseConfigured()
                    ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-300 shadow-xs'
                    : 'bg-amber-100/80 text-amber-900 border-2 border-amber-300 shadow-xs'
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isSupabaseConfigured() ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                  }`}
                />
                <span>
                  {isSupabaseConfigured()
                    ? 'Nuvem Supabase Ativa & Conectada'
                    : 'Estrutura Supabase Integrada (Modo Local/Offline)'}
                </span>
              </div>
            </div>

            {/* Toggle Mode: Cadastro vs Login com cores vibrantes */}
            <div className="mb-6 flex rounded-2xl bg-amber-100/60 p-1.5 border-2 border-amber-200">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setAuthError('');
                  playPopSound();
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_3px_0_#1d4ed8] scale-[1.01]'
                    : 'text-slate-700 hover:text-blue-700'
                }`}
              >
                Novo Cadastro 🚀
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setAuthError('');
                  playPopSound();
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_3px_0_#c2410c] scale-[1.01]'
                    : 'text-slate-700 hover:text-amber-800'
                }`}
              >
                Já Tenho Conta (Entrar) 🔑
              </button>
            </div>

            {/* Auth Form with vibrant border fields */}
            <form onSubmit={handleParentAuthSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-emerald-600" />
                    <span>Nome do Responsável / Educador</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mariana Silva"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full h-14 rounded-2xl border-3 border-emerald-300 bg-emerald-50/30 px-4 text-sm sm:text-base font-bold text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all shadow-inner"
                  />
                </div>
              )}

              {/* Login Email */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>E-mail do Responsável (Login)</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@familia.com"
                  value={parentEmail}
                  onChange={(e) => {
                    setParentEmail(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  className="w-full h-14 rounded-2xl border-3 border-blue-300 bg-blue-50/30 px-4 text-sm sm:text-base font-bold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span>Senha de Acesso</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-blue-600 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={parentPassword}
                  onChange={(e) => {
                    setParentPassword(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  className="w-full h-14 rounded-2xl border-3 border-amber-300 bg-amber-50/30 px-4 text-sm sm:text-base font-bold text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none transition-all shadow-inner"
                />
                <p className="mt-1.5 px-1 text-[11px] font-bold text-slate-600 flex items-center justify-between">
                  <span>Mínimo 6 caracteres</span>
                  <span
                    className={
                      parentPassword.length >= 6 ? 'text-emerald-600 font-black' : 'text-slate-400'
                    }
                  >
                    {parentPassword.length}/6+
                  </span>
                </p>
              </div>

              {/* Confirm Password in Register mode */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-orange-600" />
                    <span>Confirmação da Senha</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    className="w-full h-14 rounded-2xl border-3 border-orange-300 bg-orange-50/30 px-4 text-sm sm:text-base font-bold text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none transition-all shadow-inner"
                  />
                  <p className="mt-1.5 px-1 text-[11px] font-bold text-slate-600 flex items-center justify-between">
                    <span>Mínimo 6 caracteres — repita a mesma senha</span>
                    {confirmPassword.length > 0 && (
                      <span
                        className={
                          confirmPassword.length >= 6 && confirmPassword === parentPassword
                            ? 'text-emerald-600 font-black'
                            : 'text-rose-600 font-black'
                        }
                      >
                        {confirmPassword.length < 6
                          ? 'Mínimo 6 caracteres'
                          : confirmPassword === parentPassword
                          ? 'Senhas conferem'
                          : 'Senhas diferentes'}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {authError && (
                <div
                  role="alert"
                  className="rounded-2xl bg-red-50 p-4 border-2 border-red-400 text-xs sm:text-sm font-bold text-red-900 shadow-sm flex items-start gap-2.5"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
              )}

              {/* Submit Button with High-Energy Colors */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-white font-black text-lg sm:text-xl shadow-[0_6px_0_#c2410c] hover:brightness-105 active:translate-y-1.5 active:shadow-[0_1px_0_#c2410c] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
                >
                  <Sparkles className="h-6 w-6 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>
                    {isSubmitting
                      ? 'Conectando...'
                      : mode === 'register'
                      ? 'Cadastrar e Criar Perfil da Criança'
                      : 'Entrar na Aventura'}
                  </span>
                  <ArrowRight className="h-6 w-6" />
                </button>
              </div>

              {/* Security info */}
              <p className="text-center text-[11px] text-slate-500 font-bold pt-1">
                🔒 Ambiente 100% seguro infantil e preparado para sincronização com Supabase.
              </p>
            </form>
          </div>
        ) : (
          /* ================================================================ */
          /* ETAPA 2: CRIAÇÃO DO PERFIL DA CRIANÇA E MASCOTE                  */
          /* ================================================================ */
          <div className="rounded-3xl border-4 border-amber-400 bg-white/95 backdrop-blur-md p-6 sm:p-9 shadow-[0_20px_50px_rgba(245,158,11,0.22),0_10px_25px_rgba(37,99,235,0.1)]">
            {/* Step progress pills */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-amber-100">
              <button
                type="button"
                onClick={() => setStep('auth')}
                className="flex items-center gap-1.5 text-xs text-blue-600 font-extrabold hover:underline cursor-pointer"
              >
                <span>← Voltar ao Login</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-black text-white shadow-[0_2px_0_#c2410c]">
                  2
                </span>
                <span className="text-xs font-black text-amber-950 font-display">
                  Etapa 2: Perfil da Criança
                </span>
              </div>
            </div>

            {/* Playful Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold mb-3">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Pronto para a Aventura!</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Quem vai explorar hoje?
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Digite o nome da criança e escolha um companheiro de aventura favorito!
              </p>
            </div>

            <form onSubmit={handleCreateChildProfile} className="space-y-6">
              {/* Child Name Input */}
              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-500" />
                  <span>Nome da Criança:</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Sofia, Lucas, Theo, Valentina..."
                    value={childName}
                    onChange={(e) => {
                      setChildName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    className={`w-full h-15 rounded-2xl border-3 px-5 text-lg font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none transition-all shadow-inner ${
                      nameError
                        ? 'border-red-400 bg-red-50'
                        : 'border-amber-300 bg-amber-50/40 focus:border-amber-500 focus:bg-white'
                    }`}
                  />
                  {childName.trim() && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
                {nameError && <p className="mt-1.5 text-xs font-bold text-red-600">{nameError}</p>}
              </div>

              {/* Age / School Level Selection */}
              <div>
                <label className="block text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span>Fase de Aprendizado:</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Educação Infantil (4 a 5 anos)', value: 'Educação Infantil (4 a 5 anos)' },
                    { label: '1º Ano Fundamental (6 a 7 anos)', value: '1º Ano Fundamental (6 a 7 anos)' },
                  ].map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => {
                        setAgeGroup(lvl.value);
                        playPopSound();
                      }}
                      className={`p-3 rounded-2xl text-left border-2 text-xs font-bold transition-all cursor-pointer ${
                        ageGroup === lvl.value
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span>Escolha um Mascote ou Foto:</span>
                  </label>
                  {customPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomPhotoUrl(null)}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Remover foto
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
                  {AVATAR_OPTIONS.map((avatar) => {
                    const isSelected = selectedAvatarId === avatar.id && !customPhotoUrl;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatarId(avatar.id);
                          setCustomPhotoUrl(null);
                          playPopSound();
                        }}
                        className={`group relative flex flex-col items-center justify-center p-2.5 rounded-2xl border-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 scale-105 shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-3xl sm:text-4xl filter transition-transform group-hover:scale-110">
                          {avatar.emoji}
                        </span>
                        <span className="mt-1 text-[11px] font-bold text-slate-700 truncate max-w-full">
                          {avatar.name}
                        </span>
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Upload Photo Alternative */}
                <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                  <label className="cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Camera className="h-4 w-4" />
                    </div>
                    <span>Ou faça upload da foto da criança</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {customPhotoUrl && (
                    <div className="ml-auto flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                      <span>Foto adicionada!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Child Profile Error Message */}
              {childProfileError && (
                <div
                  role="alert"
                  className="rounded-2xl bg-red-50 p-4 border-2 border-red-400 text-xs sm:text-sm font-bold text-red-900 shadow-sm flex items-start gap-2.5"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{childProfileError}</span>
                </div>
              )}

              {/* Big Bubbly CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-extrabold text-lg shadow-[0_5px_0_#c2410c] hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_#c2410c] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
                >
                  <Sparkles className="h-6 w-6 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>
                    {isSubmitting
                      ? 'Salvando perfil...'
                      : existingProfile
                      ? 'Salvar Alterações e Continuar'
                      : 'Entrar no Mapa de Aventuras!'}
                  </span>
                  <ArrowRight className="h-6 w-6" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
