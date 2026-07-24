import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  home_city: string | null;
  travel_interests: string[];
  profile_completed: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  isSigningOut: boolean;

  // Actions
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  isSigningOut: false,

  initialize: async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null });

      // Fetch profile if logged in
      if (session?.user) {
        await get().fetchProfile();
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        // Don't do anything if we're in the middle of signing out
        if (get().isSigningOut) return;

        set({ session, user: session?.user ?? null });
        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({ profile: null });
        }
      });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, avatar_url, home_city, travel_interests, profile_completed')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        set({ profile: data });
      } else {
        // Profile row might not exist yet (trigger delay), set a default
        set({
          profile: {
            id: user.id,
            display_name: null,
            first_name: null,
            last_name: null,
            avatar_url: null,
            home_city: null,
            travel_interests: [],
            profile_completed: false,
          },
        });
      }
    } catch {
      // Network error or other issue — set default profile
      set({
        profile: {
          id: user.id,
          display_name: null,
          first_name: null,
          last_name: null,
          avatar_url: null,
          home_city: null,
          travel_interests: [],
          profile_completed: false,
        },
      });
    }
  },

  signOut: async () => {
    set({ isSigningOut: true });
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign out errors
    } finally {
      set({
        session: null,
        user: null,
        profile: null,
        isSigningOut: false,
      });
    }
  },
}));
