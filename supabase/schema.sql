-- ==============================================================================
-- APRENDIZ KIDS / AVENTURA DO SABER - SUPABASE DATABASE SCHEMA
-- Copie e cole todo este código no SQL Editor do Supabase e clique em "Run"
-- ==============================================================================

-- 1. TABELA: profiles (Responsáveis / Educadores vinculados ao auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'parent', -- 'parent' ou 'educator'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA: children (Perfis das Crianças criados pelo responsável)
CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_id TEXT NOT NULL DEFAULT 'fox',
  avatar_custom_url TEXT,
  age_group TEXT NOT NULL DEFAULT '5 a 6 anos (1º Ano)',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);

-- 3. TABELA: game_progress (Progresso nas Fases da Trilha)
CREATE TABLE IF NOT EXISTS public.game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  phase_id TEXT NOT NULL, -- Ex: 'fase-1', 'fase-2'
  level_id INT NOT NULL DEFAULT 1,
  stars_earned INT NOT NULL DEFAULT 0 CHECK (stars_earned >= 0 AND stars_earned <= 3),
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('completed', 'current', 'locked')),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, phase_id)
);

CREATE INDEX IF NOT EXISTS idx_game_progress_child_id ON public.game_progress(child_id);

-- 4. TABELA: medals_unlocked (Medalhas Conquistadas pela Criança)
CREATE TABLE IF NOT EXISTS public.medals_unlocked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  medal_id TEXT NOT NULL, -- Ex: 'm1', 'm2'
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(child_id, medal_id)
);

CREATE INDEX IF NOT EXISTS idx_medals_unlocked_child_id ON public.medals_unlocked(child_id);

-- 5. TABELA: activity_logs (Registros Pedagógicos das Atividades de Fonemas/Letras)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  phase_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  target_letter TEXT NOT NULL,
  target_word TEXT NOT NULL,
  chosen_option_letter TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_child_id ON public.activity_logs(child_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - Segurança e Privacidade dos Dados da Criança
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medals_unlocked ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
DROP POLICY IF EXISTS "Responsáveis podem visualizar o próprio perfil" ON public.profiles;
CREATE POLICY "Responsáveis podem visualizar o próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Responsáveis podem inserir o próprio perfil" ON public.profiles;
CREATE POLICY "Responsáveis podem inserir o próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Responsáveis podem atualizar o próprio perfil" ON public.profiles;
CREATE POLICY "Responsáveis podem atualizar o próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas para children
DROP POLICY IF EXISTS "Responsáveis podem visualizar seus próprios filhos" ON public.children;
CREATE POLICY "Responsáveis podem visualizar seus próprios filhos"
  ON public.children FOR SELECT
  USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Responsáveis podem cadastrar filhos" ON public.children;
CREATE POLICY "Responsáveis podem cadastrar filhos"
  ON public.children FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Responsáveis podem editar perfis de seus filhos" ON public.children;
CREATE POLICY "Responsáveis podem editar perfis de seus filhos"
  ON public.children FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Responsáveis podem remover filhos" ON public.children;
CREATE POLICY "Responsáveis podem remover filhos"
  ON public.children FOR DELETE
  USING (auth.uid() = parent_id);

-- Políticas para game_progress
DROP POLICY IF EXISTS "Acesso ao progresso dos filhos" ON public.game_progress;
CREATE POLICY "Acesso ao progresso dos filhos"
  ON public.game_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE public.children.id = public.game_progress.child_id
      AND public.children.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE public.children.id = public.game_progress.child_id
      AND public.children.parent_id = auth.uid()
    )
  );

-- Políticas para medals_unlocked
DROP POLICY IF EXISTS "Acesso às medalhas dos filhos" ON public.medals_unlocked;
CREATE POLICY "Acesso às medalhas dos filhos"
  ON public.medals_unlocked FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE public.children.id = public.medals_unlocked.child_id
      AND public.children.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE public.children.id = public.medals_unlocked.child_id
      AND public.children.parent_id = auth.uid()
    )
  );

-- Políticas para activity_logs
DROP POLICY IF EXISTS "Acesso aos logs de atividades dos filhos" ON public.activity_logs;
CREATE POLICY "Acesso aos logs de atividades dos filhos"
  ON public.activity_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE public.children.id = public.activity_logs.child_id
      AND public.children.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children
      WHERE public.children.id = public.activity_logs.child_id
      AND public.children.parent_id = auth.uid()
    )
  );

-- ==============================================================================
-- 7. TRIGGER: Criação Automática do Perfil ao Cadastrar Usuário no Supabase Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Responsável'),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
