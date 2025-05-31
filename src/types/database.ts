export type ContentType = 'sermon' | 'devotional';
export type ThemeType = 'fe' | 'amor' | 'esperanca' | 'perdao' | 'gratidao' | 'familia' | 'ansiedade' | 'cura' | 'proposito' | 'paz';
export type OccasionType = 'culto' | 'celula' | 'casamento' | 'funeral' | 'jovens' | 'evangelismo' | 'manha' | 'noite';
export type ToneType = 'motivacional' | 'confrontador' | 'amoroso' | 'reflexivo' | 'evangelistico';

export interface Profile {
  id: string; // UNIQUE, igual ao user_id do Supabase Auth
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  title: string;
  content_type: ContentType;
  theme: ThemeType | null;
  occasion: OccasionType | null;
  tone: ToneType | null;
  bible_verse: string | null;
  content: string | null;
  output: string | null;
  created_at: string;
  updated_at: string;
}
