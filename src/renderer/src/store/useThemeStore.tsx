// store/useThemeStore.ts
import { create } from 'zustand'


type ThemeMode = 'light' | 'dark' | "compact";

interface ThemeState {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    themeMode: 'light',
    setThemeMode: (mode) => set({ themeMode: mode }),
}));
