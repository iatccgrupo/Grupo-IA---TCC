export interface ChildProfile {
  id: string;
  name: string;
  avatarId: string;
  avatarCustomUrl?: string;
  ageGroup: string; // e.g. '4 a 6 anos' | '6 a 8 anos'
  createdAt: string;
}

export type PhaseStatus = 'completed' | 'current' | 'locked';

export interface Phase {
  id: string;
  number: number;
  levelId: number;
  title: string;
  letter: string;
  icon: string;
  starsEarned: number; // 0 to 3
  status: PhaseStatus;
  description: string;
  bnccTag: string;
}

export interface LevelInfo {
  id: number;
  name: string;
  subtitle: string;
  badge: string;
  accentColor: string;
  phases: Phase[];
}

export interface ActivityOption {
  id: string;
  letter: string;
  word: string;
  icon: string;
  colorClass: string;
  isCorrect: boolean;
}

export interface ActivityQuestion {
  id: string;
  phaseId: string;
  targetLetter: string;
  targetWord: string;
  phonemeSound: string;
  spokenPrompt: string;
  hintText: string;
  options: ActivityOption[];
}

export interface Medal {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'alfabeto' | 'conquista' | 'dedicacao' | 'aventura';
  unlocked: boolean;
  unlockedDate?: string;
  color: string;
}

export interface BnccSkill {
  code: string;
  title: string;
  description: string;
  progress: number; // 0 to 100
}

export interface ParentTip {
  title: string;
  activity: string;
  targetSkill: string;
}

export interface StoryPage {
  pageNumber: number;
  text: string;
  illustrationDescription: string;
  sceneEmoji: string;
  highlightWord: string;
  highlightLetter: string;
  accentBg: string;
}

export interface Storybook {
  id: string;
  title: string;
  theme: string;
  summary: string;
  moral: string;
  coverEmoji: string;
  coverAccent: string;
  isGenerated?: boolean;
  pages: StoryPage[];
}

export type ScreenState = 'auth' | 'map' | 'activity' | 'feedback' | 'progress' | 'dashboard' | 'library';
