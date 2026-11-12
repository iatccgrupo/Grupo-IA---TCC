import { getSupabaseClient, isSupabaseConfigured } from './client';
import { ChildProfile, LevelInfo, Medal } from '../types';

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  name?: string;
  error?: string;
}

// 1. Cadastrar Responsável (Auth)
export async function signUpWithSupabase(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Modo Local
    return {
      success: true,
      userId: 'local-parent-' + Date.now(),
      email,
      name,
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      userId: data.user?.id,
      email: data.user?.email,
      name,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao autenticar no Supabase';
    return { success: false, error: message };
  }
}

// 2. Fazer Login do Responsável (Auth)
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Modo Local
    return {
      success: true,
      userId: 'local-parent-' + Date.now(),
      email,
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      userId: data.user?.id,
      email: data.user?.email,
      name: data.user?.user_metadata?.full_name || 'Responsável',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao fazer login';
    return { success: false, error: message };
  }
}

// 3. Deslogar
export async function signOutWithSupabase(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
}

// 4. Salvar ou Sincronizar Perfil da Criança
export async function saveChildProfileToSupabase(
  child: ChildProfile,
  parentId?: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !parentId) {
    return false;
  }

  try {
    const { error } = await supabase.from('children').upsert(
      {
        id: child.id.startsWith('child-') ? undefined : child.id,
        parent_id: parentId,
        name: child.name,
        avatar_id: child.avatarId,
        avatar_custom_url: child.avatarCustomUrl || null,
        age_group: child.ageGroup,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: 'id' }
    );

    return !error;
  } catch {
    return false;
  }
}

// 5. Salvar Progresso de Fase no Supabase
export async function savePhaseProgressToSupabase(
  childId: string,
  phaseId: string,
  levelId: number,
  starsEarned: number,
  status: 'completed' | 'current' | 'locked'
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('game_progress').upsert(
      {
        child_id: childId,
        phase_id: phaseId,
        level_id: levelId,
        stars_earned: starsEarned,
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: 'child_id,phase_id' }
    );

    return !error;
  } catch {
    return false;
  }
}

// 6. Salvar Medalha Desbloqueada no Supabase
export async function saveMedalToSupabase(
  childId: string,
  medalId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('medals_unlocked').upsert(
      {
        child_id: childId,
        medal_id: medalId,
        unlocked_at: new Date().toISOString(),
      } as any,
      { onConflict: 'child_id,medal_id' }
    );

    return !error;
  } catch {
    return false;
  }
}

// 7. Registrar Log de Atividade Sonora / Fonema (para métricas da BNCC)
export async function logActivityToSupabase(params: {
  childId: string;
  phaseId: string;
  questionId: string;
  targetLetter: string;
  targetWord: string;
  chosenOptionLetter: string;
  isCorrect: boolean;
  timeSpentSeconds?: number;
}): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('activity_logs').insert({
      child_id: params.childId,
      phase_id: params.phaseId,
      question_id: params.questionId,
      target_letter: params.targetLetter,
      target_word: params.targetWord,
      chosen_option_letter: params.chosenOptionLetter,
      is_correct: params.isCorrect,
      time_spent_seconds: params.timeSpentSeconds || 0,
      created_at: new Date().toISOString(),
    } as any);

    return !error;
  } catch {
    return false;
  }
}
