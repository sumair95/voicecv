/**
 * Database types — kept in sync manually with supabase/schema.sql + migrations.
 *
 * When the schema changes in production, regenerate with:
 *   npx supabase gen types typescript --project-id <ref> --schema public > lib/supabase/types.gen.ts
 *
 * This file replaces the `as CVRecord` casts scattered through the code.
 * Wire it into the supabase client (see `lib/supabase/client.ts` / `server.ts`).
 */

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
          full_name: string | null;
          email: string | null;
          language: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          language?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          language?: string;
          created_at?: string;
        };
      };
      cvs: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          audio_url: string | null;
          transcript: string | null;
          cv_data: Json | null;
          template: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          audio_url?: string | null;
          transcript?: string | null;
          cv_data?: Json | null;
          template?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          audio_url?: string | null;
          transcript?: string | null;
          cv_data?: Json | null;
          template?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          language: string;
          order_index: number;
          question_text: string;
          field_key: string;
        };
        Insert: {
          id?: string;
          language?: string;
          order_index?: number;
          question_text?: string;
          field_key?: string;
        };
        Update: {
          id?: string;
          language?: string;
          order_index?: number;
          question_text?: string;
          field_key?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
