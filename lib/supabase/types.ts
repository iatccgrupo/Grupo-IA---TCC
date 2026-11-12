export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: string;
          updated_at?: string;
        };
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          avatar_id: string;
          avatar_custom_url: string | null;
          age_group: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          avatar_id?: string;
          avatar_custom_url?: string | null;
          age_group?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          name?: string;
          avatar_id?: string;
          avatar_custom_url?: string | null;
          age_group?: string;
          updated_at?: string;
        };
      };
      game_progress: {
        Row: {
          id: string;
          child_id: string;
          phase_id: string;
          level_id: number;
          stars_earned: number;
          status: 'completed' | 'current' | 'locked';
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          phase_id: string;
          level_id?: number;
          stars_earned?: number;
          status?: 'completed' | 'current' | 'locked';
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          phase_id?: string;
          level_id?: number;
          stars_earned?: number;
          status?: 'completed' | 'current' | 'locked';
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      medals_unlocked: {
        Row: {
          id: string;
          child_id: string;
          medal_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          medal_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          medal_id?: string;
          unlocked_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          child_id: string;
          phase_id: string;
          question_id: string;
          target_letter: string;
          target_word: string;
          chosen_option_letter: string;
          is_correct: boolean;
          time_spent_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          phase_id: string;
          question_id: string;
          target_letter: string;
          target_word: string;
          chosen_option_letter: string;
          is_correct: boolean;
          time_spent_seconds?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          phase_id?: string;
          question_id?: string;
          target_letter?: string;
          target_word?: string;
          chosen_option_letter?: string;
          is_correct?: boolean;
          time_spent_seconds?: number;
        };
      };
    };
  };
}
