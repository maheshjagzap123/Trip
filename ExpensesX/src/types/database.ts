/**
 * Supabase database types.
 * 
 * TODO: Replace this with auto-generated types once schema is stable:
 * npx supabase gen types typescript --project-id kfqoleqlppvtmnzojgim > src/types/database.ts
 * 
 * For now, using a minimal type that doesn't block development.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      trips: {
        Row: TripRow;
        Insert: TripInsert;
        Update: TripUpdate;
        Relationships: [];
      };
      trip_members: {
        Row: TripMemberRow;
        Insert: TripMemberInsert;
        Update: TripMemberUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export interface ProfileRow {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  home_city: string | null;
  country: string | null;
  preferred_currency: string;
  travel_interests: string[];
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripRow {
  id: string;
  trip_name: string;
  destination: string | null;
  description: string | null;
  cover_image_url: string | null;
  start_date: string;
  end_date: string;
  budget_amount: number | null;
  budget_currency: string;
  trip_type: string | null;
  status: string;
  privacy: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TripMemberRow {
  id: string;
  trip_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string | null;
  invited_by: string | null;
  created_at: string;
}

// Insert types (fields with defaults are optional)
export type ProfileInsert = {
  id: string;
  email?: string | null;
  phone?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  home_city?: string | null;
  country?: string | null;
  preferred_currency?: string;
  travel_interests?: string[];
  profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = {
  id?: string;
  email?: string | null;
  phone?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  home_city?: string | null;
  country?: string | null;
  preferred_currency?: string;
  travel_interests?: string[];
  profile_completed?: boolean;
  updated_at?: string;
};

export type TripInsert = {
  id?: string;
  trip_name: string;
  destination?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  start_date: string;
  end_date: string;
  budget_amount?: number | null;
  budget_currency?: string;
  trip_type?: string | null;
  status?: string;
  privacy?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
};

export type TripUpdate = {
  trip_name?: string;
  destination?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  start_date?: string;
  end_date?: string;
  budget_amount?: number | null;
  budget_currency?: string;
  trip_type?: string | null;
  status?: string;
  privacy?: string;
  updated_at?: string;
};

export type TripMemberInsert = {
  id?: string;
  trip_id: string;
  user_id: string;
  role?: string;
  status?: string;
  joined_at?: string | null;
  invited_by?: string | null;
  created_at?: string;
};

export type TripMemberUpdate = {
  role?: string;
  status?: string;
  joined_at?: string | null;
};
