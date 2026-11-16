import { getSupabaseClient, isSupabaseConfigured } from './client';
import { ChildProfile, LevelInfo, Medal } from '../types';
import { isPhonemeAnswerCorrect } from '../utils';

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  name?: string;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

export interface ServiceResult {
  success: boolean;
  error?: string;
}

function translateSupabaseError(rawMessage: string, code?: string): string {
  const msg = rawMessage.toLowerCase();

  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('fetch failed') ||
    msg.includes('err_name_not_resolved')
  ) {
    return 'Erro de conexão com o Supabase. Verifique sua internet e se a URL (NEXT_PUBLIC_SUPABASE_URL) está correta.';
  }

  if (msg.includes('invalid api key') || msg.includes('no api key')) {
    return 'Chave de API do Supabase inválida ou ausente (NEXT_PUBLIC_SUPABASE_ANON_KEY).';
  }

  if (
    msg.includes('user already registered') ||
    msg.includes('already been registered') ||
    msg.includes('already exists')
  ) {
    return 'Este e-mail já está cadastrado. Use a aba "Já Tenho Conta (Entrar)" para fazer login.';
  }

  if (
    msg.includes('password should be at least') ||
    msg.includes('weak_password') ||
    code === 'weak_password'
  ) {
    return 'A senha deve conter no mínimo 6 caracteres para atender à política de segurança do Supabase Auth.';
  }

  if (msg.includes('unable to validate email') || msg.includes('invalid format')) {
    return 'O formato do e-mail informado é inválido. Confira e tente novamente.';
  }

  if (msg.includes('signups not allowed')) {
    return 'Novos cadastros estão bloqueados nas configurações do Supabase Auth.';
  }

  if (msg.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou desative a confirmação de e-mail no Supabase.';
  }

  if (msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Confira seus dados e tente novamente.';
  }

  if (
    msg.includes('rate limit') ||
    msg.includes('over_email_send_rate_limit') ||
    msg.includes('for security purposes')
  ) {
    return 'Muitas tentativas em sequência. Aguarde alguns segundos antes de tentar novamente.';
  }

  if (
    code === '42501' ||
    msg.includes('row-level security') ||
    msg.includes('permission denied')
  ) {
    return 'Operação bloqueada por política de segurança (RLS) no Supabase. Verifique as políticas da tabela public.profiles em supabase/schema.sql.';
  }

  if (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  ) {
    return 'Tabela não encontrada no Supabase (public.profiles). Execute o script supabase/schema.sql no SQL Editor do seu projeto.';
  }

  return rawMessage;
}

// 1. Cadastrar Responsável (Auth + public.profiles)
export async function signUpWithSupabase(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanName = name.trim();
  const cleanEmail = email.trim();

  if (!cleanName) {
    return {
      success: false,
      error: 'Por favor, informe o nome do responsável ou educador.',
    };
  }

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      success: false,
      error: 'Por favor, informe um e-mail válido para o cadastro.',
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: 'A senha deve conter no mínimo 6 caracteres.',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      error:
        'Configuração do Supabase ausente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para cadastrar no Supabase Auth e salvar em public.profiles.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          role: 'parent',
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: translateSupabaseError(error.message, (error as { code?: string }).code),
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Não foi possível concluir o cadastro: o Supabase Auth não retornou o usuário.',
      };
    }

    // Proteção anti-enumeração do Supabase quando o e-mail já existe
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        error: 'Este e-mail já está cadastrado no Supabase. Use a aba "Já Tenho Conta (Entrar)" para acessar.',
      };
    }

    // Quando "Confirm email" está ativo, o Supabase não retorna session imediata e bloqueia RLS de escrita pelo cliente
    if (!data.session) {
      return {
        success: false,
        requiresEmailConfirmation: true,
        error:
          'Cadastro criado no Supabase Auth, aguardando confirmação de e-mail. Confirme o link enviado para o seu e-mail antes de continuar (ou desative "Confirm email" em Authentication > Providers > Email no Supabase).',
      };
    }

    // Inserir / atualizar explicitamente na tabela public.profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          full_name: cleanName,
          email: data.user.email || cleanEmail,
          role: 'parent',
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'id' }
      );

    if (profileError) {
      return {
        success: false,
        error: `Cadastro criado no Auth, mas houve erro ao salvar na tabela public.profiles: ${translateSupabaseError(
          profileError.message,
          profileError.code
        )}`,
      };
    }

    return {
      success: true,
      userId: data.user.id,
      email: data.user.email || cleanEmail,
      name: cleanName,
    };
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Falha de conexão ao cadastrar no Supabase.';
    return { success: false, error: translateSupabaseError(raw) };
  }
}

// 2. Fazer Login do Responsável (Auth + sincronização de public.profiles)
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanEmail = email.trim();

  const supabase = getSupabaseClient();
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      error:
        'Configuração do Supabase ausente. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para fazer login.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return {
        success: false,
        error: translateSupabaseError(error.message, (error as { code?: string }).code),
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'Não foi possível iniciar a sessão no Supabase.',
      };
    }

    const fullName =
      (typeof data.user.user_metadata?.full_name === 'string' &&
        data.user.user_metadata.full_name.trim()) ||
      'Responsável';

    // Garante que o registro em public.profiles exista após login (ex.: após confirmação de e-mail)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          full_name: fullName,
          email: data.user.email || cleanEmail,
          role: 'parent',
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'id' }
      );

    if (profileError) {
      return {
        success: false,
        error: `Login realizado, mas houve erro ao sincronizar public.profiles: ${translateSupabaseError(
          profileError.message,
          profileError.code
        )}`,
      };
    }

    return {
      success: true,
      userId: data.user.id,
      email: data.user.email || cleanEmail,
      name: fullName,
    };
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Falha de conexão ao fazer login.';
    return { success: false, error: translateSupabaseError(raw) };
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
export async function saveChildProfileWithResultToSupabase(
  child: ChildProfile,
  parentId?: string
): Promise<ServiceResult> {
  const supabase = getSupabaseClient();
  if (!supabase || !parentId) {
    return {
      success: false,
      error: 'Sessão do responsável não encontrada para salvar o perfil da criança.',
    };
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

    if (error) {
      return {
        success: false,
        error: translateSupabaseError(error.message, error.code),
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : 'Falha ao salvar perfil da criança.';
    return { success: false, error: translateSupabaseError(raw) };
  }
}

export async function saveChildProfileToSupabase(
  child: ChildProfile,
  parentId?: string
): Promise<boolean> {
  const result = await saveChildProfileWithResultToSupabase(child, parentId);
  return result.success;
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
    const normalizedMatch = isPhonemeAnswerCorrect(
      params.chosenOptionLetter,
      params.targetLetter
    );
    const verifiedIsCorrect = params.isCorrect || normalizedMatch;

    const { error } = await supabase.from('activity_logs').insert({
      child_id: params.childId,
      phase_id: params.phaseId,
      question_id: params.questionId,
      target_letter: params.targetLetter,
      target_word: params.targetWord,
      chosen_option_letter: params.chosenOptionLetter,
      is_correct: verifiedIsCorrect,
      time_spent_seconds: params.timeSpentSeconds || 0,
      created_at: new Date().toISOString(),
    } as any);

    return !error;
  } catch {
    return false;
  }
}
