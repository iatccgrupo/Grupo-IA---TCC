'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { AuthScreen } from '@/components/AuthScreen';
import { TrailMapScreen } from '@/components/TrailMapScreen';
import { ActivityScreen } from '@/components/ActivityScreen';
import { FeedbackScreen } from '@/components/FeedbackScreen';
import { ProgressScreen } from '@/components/ProgressScreen';
import { ParentDashboard, ParentalGateModal } from '@/components/ParentDashboard';
import {
  ScreenState,
  ChildProfile,
  LevelInfo,
  Phase,
  ActivityQuestion,
  ActivityOption,
  Medal,
} from '@/lib/types';
import { INITIAL_LEVELS, ACTIVITY_QUESTIONS, INITIAL_MEDALS } from '@/lib/game-data';
import { playPopSound, playSuccessSound } from '@/lib/sound';
import {
  savePhaseProgressToSupabase,
  saveMedalToSupabase,
  logActivityToSupabase,
} from '@/lib/supabase/service';

export default function HomePage() {
  // Child Profile State with lazy initialization
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('aventura_child_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation Screen State: The first screen is ALWAYS the Cadastro de Login e Senha ('auth')
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('auth');

  const [isParentGateOpen, setIsParentGateOpen] = useState(false);

  // Game Levels & Phases
  const [levels, setLevels] = useState<LevelInfo[]>(() => {
    if (typeof window === 'undefined') return INITIAL_LEVELS;
    try {
      const saved = localStorage.getItem('aventura_levels');
      return saved ? JSON.parse(saved) : INITIAL_LEVELS;
    } catch {
      return INITIAL_LEVELS;
    }
  });

  const [currentPhase, setCurrentPhase] = useState<Phase>(INITIAL_LEVELS[0].phases[2]); // Phase 3 (Vogal I) default current

  // Activity & Feedback State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lastSelectedOption, setLastSelectedOption] = useState<ActivityOption | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  // Medals & Gamification
  const [medals, setMedals] = useState<Medal[]>(() => {
    if (typeof window === 'undefined') return INITIAL_MEDALS;
    try {
      const saved = localStorage.getItem('aventura_medals');
      return saved ? JSON.parse(saved) : INITIAL_MEDALS;
    } catch {
      return INITIAL_MEDALS;
    }
  });

  // Sound Control
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Calculate total stars
  const totalStars = levels.reduce((acc, lvl) => {
    return acc + lvl.phases.reduce((pAcc, p) => pAcc + p.starsEarned, 0);
  }, 0);

  // Calculate completed phases
  const completedPhasesCount = levels.reduce((acc, lvl) => {
    return acc + lvl.phases.filter((p) => p.status === 'completed').length;
  }, 0);

  const totalPhasesCount = levels.reduce((acc, lvl) => acc + lvl.phases.length, 0);

  // Complete child profile from AuthScreen
  const handleCompleteProfile = (profile: ChildProfile) => {
    setChildProfile(profile);
    try {
      localStorage.setItem('aventura_child_profile', JSON.stringify(profile));
    } catch {}
    setCurrentScreen('map');
  };

  // Start a specific phase
  const handleSelectPhase = (phase: Phase) => {
    setCurrentPhase(phase);
    // Find matching question for this phase or fallback to question 0
    const qIndex = ACTIVITY_QUESTIONS.findIndex((q) => q.phaseId === phase.id);
    setCurrentQuestionIndex(qIndex >= 0 ? qIndex : 0);
    setCurrentScreen('activity');
  };

  // Handle Answer Selection in Activity Screen
  const handleAnswerSelected = (option: ActivityOption) => {
    setLastSelectedOption(option);
    // Sincronizar log de atividade com Supabase
    if (childProfile) {
      logActivityToSupabase({
        childId: childProfile.id,
        phaseId: currentPhase.id,
        questionId: currentQuestion.id,
        targetLetter: currentQuestion.targetLetter,
        targetWord: currentQuestion.targetWord,
        chosenOptionLetter: option.letter,
        isCorrect: option.isCorrect,
      });
    }

    if (option.isCorrect) {
      // Sincronizar fase concluída no Supabase
      if (childProfile) {
        savePhaseProgressToSupabase(
          childProfile.id,
          currentPhase.id,
          currentPhase.levelId,
          3,
          'completed'
        );
      }

      // Mark current phase as completed with 3 stars!
      const updatedLevels = levels.map((lvl) => ({
        ...lvl,
        phases: lvl.phases.map((p) => {
          if (p.id === currentPhase.id) {
            return { ...p, status: 'completed' as const, starsEarned: 3 };
          }
          return p;
        }),
      }));

      // Unlock next phase if available
      let unlockedNext = false;
      const allPhases = updatedLevels.flatMap((lvl) => lvl.phases);
      const currentIndex = allPhases.findIndex((p) => p.id === currentPhase.id);

      if (currentIndex >= 0 && currentIndex + 1 < allPhases.length) {
        const nextPhaseId = allPhases[currentIndex + 1].id;
        updatedLevels.forEach((lvl) => {
          lvl.phases.forEach((p) => {
            if (p.id === nextPhaseId && p.status === 'locked') {
              p.status = 'current';
              unlockedNext = true;
            }
          });
        });
      }

      setLevels(updatedLevels);
      try {
        localStorage.setItem('aventura_levels', JSON.stringify(updatedLevels));
      } catch {}

      // Sincronizar medalhas desbloqueadas com Supabase
      if (childProfile) {
        saveMedalToSupabase(childProfile.id, 'm4');
        if (totalStars + 3 >= 15) {
          saveMedalToSupabase(childProfile.id, 'm6');
        }
      }

      // Unlock medals if criteria met
      setMedals((prevMedals) =>
        prevMedals.map((m) => {
          if (m.id === 'm4' && !m.unlocked) {
            // Mira Certeira
            return { ...m, unlocked: true, unlockedDate: 'Hoje' };
          }
          if (m.id === 'm6' && totalStars + 3 >= 15 && !m.unlocked) {
            // Colecionador de estrelas
            return { ...m, unlocked: true, unlockedDate: 'Hoje' };
          }
          return m;
        })
      );
    }

    setCurrentScreen('feedback');
  };

  // Progress to next question or phase
  const handleNextQuestion = () => {
    const nextIdx = (currentQuestionIndex + 1) % ACTIVITY_QUESTIONS.length;
    setCurrentQuestionIndex(nextIdx);
    const nextQ = ACTIVITY_QUESTIONS[nextIdx];

    // Find phase for nextQ if exists
    const matchingPhase = levels.flatMap((lvl) => lvl.phases).find((p) => p.id === nextQ.phaseId);
    if (matchingPhase) {
      setCurrentPhase(matchingPhase);
    }

    setCurrentScreen('activity');
  };

  // Retry the same question
  const handleRetryQuestion = () => {
    setCurrentScreen('activity');
  };

  // Reset entire game progress
  const handleResetProgress = () => {
    setLevels(INITIAL_LEVELS);
    setMedals(INITIAL_MEDALS);
    try {
      localStorage.removeItem('aventura_levels');
      localStorage.removeItem('aventura_medals');
    } catch {}
    playSuccessSound();
  };

  // Logout / Switch account handler
  const handleLogout = () => {
    setChildProfile(null);
    try {
      localStorage.removeItem('aventura_child_profile');
      localStorage.removeItem('aventura_parent_account');
    } catch {}
    setCurrentScreen('auth');
    playPopSound();
  };

  const currentQuestion = ACTIVITY_QUESTIONS[currentQuestionIndex] || ACTIVITY_QUESTIONS[0];

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9ff]">
      {/* Top Navigation Bar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          playPopSound();
          setCurrentScreen(screen);
        }}
        childProfile={childProfile}
        totalStars={totalStars}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          playPopSound();
          setSoundEnabled(!soundEnabled);
        }}
        onOpenParentGate={() => setIsParentGateOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Screen Renderer */}
      <main className="flex-1">
        {currentScreen === 'auth' && (
          <AuthScreen
            onCompleteProfile={handleCompleteProfile}
            onSkipToPlay={() => {
              if (!childProfile) {
                const defaultProfile: ChildProfile = {
                  id: 'child-default',
                  name: 'Sofia',
                  avatarId: 'fox',
                  ageGroup: '1º Ano (6 anos)',
                  createdAt: new Date().toLocaleDateString('pt-BR'),
                };
                setChildProfile(defaultProfile);
              }
              setCurrentScreen('map');
            }}
          />
        )}

        {currentScreen === 'map' && childProfile && (
          <TrailMapScreen
            levels={levels}
            childProfile={childProfile}
            totalStars={totalStars}
            onSelectPhase={handleSelectPhase}
            onNavigateProgress={() => setCurrentScreen('progress')}
          />
        )}

        {currentScreen === 'activity' && childProfile && (
          <ActivityScreen
            question={currentQuestion}
            currentPhase={currentPhase}
            childProfile={childProfile}
            soundEnabled={soundEnabled}
            onAnswerSelected={handleAnswerSelected}
            onBackToMap={() => setCurrentScreen('map')}
          />
        )}

        {currentScreen === 'feedback' && childProfile && lastSelectedOption && (
          <FeedbackScreen
            isCorrect={isAnswerCorrect}
            selectedOption={lastSelectedOption}
            question={currentQuestion}
            childProfile={childProfile}
            soundEnabled={soundEnabled}
            onNextQuestion={handleNextQuestion}
            onRetryQuestion={handleRetryQuestion}
            onBackToMap={() => setCurrentScreen('map')}
          />
        )}

        {currentScreen === 'progress' && childProfile && (
          <ProgressScreen
            childProfile={childProfile}
            totalStars={totalStars}
            medals={medals}
            completedPhasesCount={completedPhasesCount}
            totalPhasesCount={totalPhasesCount}
            onNavigateMap={() => setCurrentScreen('map')}
          />
        )}

        {currentScreen === 'dashboard' && childProfile && (
          <ParentDashboard
            childProfile={childProfile}
            totalStars={totalStars}
            completedPhasesCount={completedPhasesCount}
            totalPhasesCount={totalPhasesCount}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onResetProgress={handleResetProgress}
            onEditProfile={() => setCurrentScreen('auth')}
            onBackToApp={() => setCurrentScreen('map')}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Parental Gate Modal for secure area protection */}
      <ParentalGateModal
        isOpen={isParentGateOpen}
        onClose={() => setIsParentGateOpen(false)}
        onSuccess={() => {
          if (!childProfile) {
            const defaultProfile: ChildProfile = {
              id: 'child-default',
              name: 'Sofia',
              avatarId: 'fox',
              ageGroup: '1º Ano Fundamental',
              createdAt: new Date().toLocaleDateString('pt-BR'),
            };
            setChildProfile(defaultProfile);
          }
          setCurrentScreen('dashboard');
        }}
      />

      {/* Playful Child-Safe Footer */}
      <footer className="mt-auto border-t border-blue-100 bg-white/80 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-bold text-slate-600">
            Aventura do Saber · Educação Infantil e Alfabetização Lúdica
          </p>
          <div className="flex items-center gap-4 text-slate-400 font-semibold">
            <span>Alinhado às diretrizes da BNCC</span>
            <span>·</span>
            <span>Ambiente 100% Livre de Anúncios</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
