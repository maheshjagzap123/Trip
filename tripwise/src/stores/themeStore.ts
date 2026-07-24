import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolvedScheme: 'light' | 'dark';

  initialize: () => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
}

const STORAGE_KEY = 'expensex_theme';

function getResolvedScheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  resolvedScheme: 'dark',

  initialize: async () => {
    try {
      // 1. Try local storage first (fast)
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        set({ mode: stored as ThemeMode, resolvedScheme: getResolvedScheme(stored as ThemeMode) });
      }

      // 2. Try to fetch from Supabase profile (source of truth)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (data?.preferences?.theme) {
          const dbTheme = data.preferences.theme as ThemeMode;
          set({ mode: dbTheme, resolvedScheme: getResolvedScheme(dbTheme) });
          await AsyncStorage.setItem(STORAGE_KEY, dbTheme);
        }
      }
    } catch {
      // Fallback to dark
    }

    // Listen for system theme changes
    Appearance.addChangeListener(({ colorScheme }) => {
      if (get().mode === 'system') {
        set({ resolvedScheme: colorScheme === 'dark' ? 'dark' : 'light' });
      }
    });
  },

  setTheme: async (mode: ThemeMode) => {
    const resolvedScheme = getResolvedScheme(mode);
    set({ mode, resolvedScheme });

    // Save locally
    await AsyncStorage.setItem(STORAGE_KEY, mode);

    // Save to Supabase profile
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get current preferences and merge
        const { data } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        const currentPrefs = (data?.preferences as Record<string, any>) || {};
        await supabase
          .from('profiles')
          .update({ preferences: { ...currentPrefs, theme: mode } } as any)
          .eq('id', user.id);
      }
    } catch {
      // Local save is enough, DB save is best-effort
    }
  },
}));
