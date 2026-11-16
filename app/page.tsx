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
  ActivityOption,
  Medal,
} from '@/lib/types';
import {
  INITIAL_LEVELS,
  INITIAL_MEDALS,
  getQuestionByPhaseId,
} from '@/lib/game-data';
import { playPopSound, playSuccessSound } from '@/lib/sound';
import {
  savePhaseProgressToSupabase,
  saveMedalToSupabase,
  logActivityToSupabase,
  getActiveSessionWorkspace,
  signOutWithSupabase,
  RestoredWorkspace,
} from '@/lib/supabase/service';
import { isPhonemeAnswerCorrect } from '@/lib/utils';

export default function HomePage() {
  // Deterministic initial state so SSR and first client render always match
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);

  // Navigation Screen State: The first screen is ALWAYS the Cadastro de Login e Senha ('auth')
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('auth');

  const [isParentGateOpen, setIsParentGateOpen] = useState(false);
  const [editingChildProfile, setEditingChildProfile] = useState(false);
  const [activeParentId, setActiveParentId] = useState('');

  // Game Levels & Phases
  const [levels, setLevels] = useState<LevelInfo[]>(INITIAL_LEVELS);

  const [currentPhase, setCurrentPhase] = useState<Phase>(INITIAL_LEVELS[0].phases[2]); // Phase 3 (Vogal I) default current

  // Activity & Feedback State
  const [lastSelectedOption, setLastSelectedOption] = useState<ActivityOption | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  // Medals & Gamification
  const [medals, setMedals] = useState<Medal[]>(INITIAL_MEDALS);

  // Sound Control
  const [soundEnabled, setSoundEnabled] = useState(true);

  const mergeLevelsWithTemplate = (savedLevels: LevelInfo[]): LevelInfo[] => {
    const savedPhaseMap = new Map<string, Phase>();
    savedLevels.forEach((lvl) => {
      lvl.phases.forEach((p) => savedPhaseMap.set(p.id, p));
    });

    return INITIAL_LEVELS.map((lvl) => ({
      ...lvl,
      phases: lvl.phases.map((templatePhase) => {
        const saved = savedPhaseMap.get(templatePhase.id);
        if (!saved) return { ...templatePhase };
        return {
          ...templatePhase,
          starsEarned: saved.starsEarned,
          status: saved.status,
        };
      }),
    }));
  };

  // Restaurar cache local e sessão ativa do Supabase após hidratação
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      await Promise.resolve();
      if (!active) return;

      try {
        const savedParent = localStorage.getItem('aventura_parent_account');
        const savedChild = localStorage.getItem('aventura_child_profile');
        const savedLevels = localStorage.getItem('aventura_levels');
        const savedMedals = localStorage.getItem('aventura_medals');

        if (savedParent) {
          const parsedParent = JSON.parse(savedParent) as { id?: string };
          if (parsedParent.id) {
            setActiveParentId(parsedParent.id);
          }
        }

        if (savedParent && savedChild) {
          const parsedChild = JSON.parse(savedChild) as ChildProfile;
          setChildProfile(parsedChild);

          if (savedLevels) {
            const parsedLevels = JSON.parse(savedLevels) as LevelInfo[];
            const mergedLevels = mergeLevelsWithTemplate(parsedLevels);
            setLevels(mergedLevels);
            const flat = mergedLevels.flatMap((lvl) => lvl.phases);
            const nextActive =
              flat.find((p) => p.status === 'current') ||
              flat.find((p) => p.status !== 'completed') ||
              flat[0];
            if (nextActive) {
              setCurrentPhase(nextActive);
            }
          }

          if (savedMedals) {
            setMedals(JSON.parse(savedMedals) as Medal[]);
          }
        }
      } catch {}

      const sessionData = await getActiveSessionWorkspace();
      if (!active || !sessionData) return;

      setActiveParentId(sessionData.userId);

      try {
        localStorage.setItem(
          'aventura_parent_account',
          JSON.stringify({
            id: sessionData.userId,
            name: sessionData.name,
            email: sessionData.email,
            loggedAt: new Date().toISOString(),
          })
        );
      } catch {}

      if (sessionData.workspace.child) {
        setChildProfile(sessionData.workspace.child);
        setLevels(sessionData.workspace.levels);
        setMedals(sessionData.workspace.medals);

        const flatPhases = sessionData.workspace.levels.flatMap((lvl) => lvl.phases);
        const activePhase =
          flatPhases.find((p) => p.status === 'current') ||
          flatPhases.find((p) => p.status !== 'completed') ||
          flatPhases[0];
        if (activePhase) {
          setCurrentPhase(activePhase);
        }

        try {
          localStorage.setItem(
            'aventura_child_profile',
            JSON.stringify(sessionData.workspace.child)
          );
          localStorage.setItem(
            'aventura_levels',
            JSON.stringify(sessionData.workspace.levels)
          );
          localStorage.setItem(
            'aventura_medals',
            JSON.stringify(sessionData.workspace.medals)
          );
        } catch {}

        setCurrentScreen((prev) => (prev === 'auth' ? 'map' : prev));
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // Calculate total stars
  const totalStars = levels.reduce((acc, lvl) => {
    return acc + lvl.phases.reduce((pAcc, p) => pAcc + p.starsEarned, 0);
  }, 0);

  // Calculate completed phases
  const completedPhasesCount = levels.reduce((acc, lvl) => {
    return acc + lvl.phases.filter((p) => p.status === 'completed').length;
  }, 0);

  const totalPhasesCount = levels.reduce((acc, lvl) => acc + lvl.phases.length, 0);

  // Complete child profile from AuthScreen (with optional restored progress on login)
  const handleCompleteProfile = (
    profile: ChildProfile,
    restoredWorkspace?: RestoredWorkspace
  ) => {
    setChildProfile(profile);
    setEditingChildProfile(false);

    try {
      localStorage.setItem('aventura_child_profile', JSON.stringify(profile));
    } catch {}

    if (restoredWorkspace) {
      setLevels(restoredWorkspace.levels);
      setMedals(restoredWorkspace.medals);

      const flatPhases = restoredWorkspace.levels.flatMap((lvl) => lvl.phases);
      const activePhase =
        flatPhases.find((p) => p.status === 'current') ||
        flatPhases.find((p) => p.status !== 'completed') ||
        flatPhases[0];
      if (activePhase) {
        setCurrentPhase(activePhase);
      }

      try {
        localStorage.setItem(
          'aventura_levels',
          JSON.stringify(restoredWorkspace.levels)
        );
        localStorage.setItem(
          'aventura_medals',
          JSON.stringify(restoredWorkspace.medals)
        );
      } catch {}
    }

    setCurrentScreen('map');
  };

  // Start a specific phase (fonte única: phase.id)
  const handleSelectPhase = (phase: Phase) => {
    setCurrentPhase(phase);
    setCurrentScreen('activity');
  };

  // Handle Answer Selection in Activity Screen
  const handleAnswerSelected = (option: ActivityOption) => {
    const isCorrect = isPhonemeAnswerCorrect(option.letter, currentQuestion.targetLetter);

    setLastSelectedOption({ ...option, isCorrect });
    setIsAnswerCorrect(isCorrect);

    // Sincronizar log de atividade com Supabase
    if (childProfile) {
      logActivityToSupabase({
        childId: childProfile.id,
        phaseId: currentPhase.id,
        questionId: currentQuestion.id,
        targetLetter: currentQuestion.targetLetter,
        targetWord: currentQuestion.targetWord,
        chosenOptionLetter: option.letter,
        isCorrect,
      });
    }

    if (isCorrect) {
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
      let unlockedNextPhase: Phase | null = null;
      const allPhases = updatedLevels.flatMap((lvl) => lvl.phases);
      const currentIndex = allPhases.findIndex((p) => p.id === currentPhase.id);

      if (currentIndex >= 0 && currentIndex + 1 < allPhases.length) {
        const nextPhaseId = allPhases[currentIndex + 1].id;
        updatedLevels.forEach((lvl) => {
          lvl.phases.forEach((p) => {
            if (p.id === nextPhaseId && p.status === 'locked') {
              p.status = 'current';
              unlockedNextPhase = { ...p };
            }
          });
        });
      }

      if (childProfile && unlockedNextPhase) {
        const phaseToSync: Phase = unlockedNextPhase;
        savePhaseProgressToSupabase(
          childProfile.id,
          phaseToSync.id,
          phaseToSync.levelId,
          phaseToSync.starsEarned,
          'current'
        );
      }

      setLevels(updatedLevels);
      try {
        localStorage.setItem('aventura_levels', JSON.stringify(updatedLevels));
      } catch {}

      const unlockedLevel2 =
        currentPhase.id === 'fase-5' ||
        (unlockedNextPhase !== null && (unlockedNextPhase as Phase).levelId === 2);
      const completedFinalChallenge = currentPhase.id === 'fase-12';

      // Sincronizar medalhas desbloqueadas com Supabase
      if (childProfile) {
        saveMedalToSupabase(childProfile.id, 'm4');
        if (unlockedLevel2) {
          saveMedalToSupabase(childProfile.id, 'm5');
        }
        if (totalStars + 3 >= 15) {
          saveMedalToSupabase(childProfile.id, 'm6');
        }
        if (completedFinalChallenge) {
          saveMedalToSupabase(childProfile.id, 'm8');
        }
      }

      // Unlock medals if criteria met
      setMedals((prevMedals) => {
        const nextMedals = prevMedals.map((m) => {
          if (m.id === 'm4' && !m.unlocked) {
            return { ...m, unlocked: true, unlockedDate: 'Hoje' };
          }
          if (m.id === 'm5' && unlockedLevel2 && !m.unlocked) {
            return { ...m, unlocked: true, unlockedDate: 'Hoje' };
          }
          if (m.id === 'm6' && totalStars + 3 >= 15 && !m.unlocked) {
            return { ...m, unlocked: true, unlockedDate: 'Hoje' };
          }
          if (m.id === 'm8' && completedFinalChallenge && !m.unlocked) {
            return { ...m, unlocked: true, unlockedDate: 'Hoje' };
          }
          return m;
        });

        try {
          localStorage.setItem('aventura_medals', JSON.stringify(nextMedals));
        } catch {}

        return nextMedals;
      });
    }

    setCurrentScreen('feedback');
  };

  // Progress sequentially to next phase in trail order (Fase 1 -> 2 -> 3 -> 4 -> 5 -> ...)
  const handleNextQuestion = () => {
    const allPhases = levels.flatMap((lvl) => lvl.phases);
    const currentIndex = allPhases.findIndex((p) => p.id === currentPhase.id);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % allPhases.length : 0;
    const nextPhase = allPhases[nextIndex];
    if (nextPhase) {
      setCurrentPhase(nextPhase);
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

  // Logout / Switch account handler (mantém os dados salvos no Supabase)
  const handleLogout = () => {
    void signOutWithSupabase();
    setChildProfile(null);
    setEditingChildProfile(false);
    setActiveParentId('');
    setLevels(INITIAL_LEVELS);
    setMedals(INITIAL_MEDALS);
    setCurrentPhase(INITIAL_LEVELS[0].phases[2]);
    try {
      localStorage.removeItem('aventura_child_profile');
      localStorage.removeItem('aventura_parent_account');
      localStorage.removeItem('aventura_levels');
      localStorage.removeItem('aventura_medals');
    } catch {}
    setCurrentScreen('auth');
    playPopSound();
  };

  const currentQuestion = getQuestionByPhaseId(currentPhase.id);

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
            existingProfile={editingChildProfile ? childProfile : null}
            initialStep={editingChildProfile ? 'child_profile' : 'auth'}
            activeParentId={activeParentId}
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
            key={currentQuestion.id}
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
            onEditProfile={() => {
              setEditingChildProfile(true);
              setCurrentScreen('auth');
            }}
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
