import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, lightTheme, darkTheme } from '../constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';
const STORAGE_KEY = '@theme_mode';

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightTheme,
  mode: 'system',
  isDark: false,
  setThemeMode: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedMode) => {
        if (
          storedMode === 'system' ||
          storedMode === 'light' ||
          storedMode === 'dark'
        ) {
          setMode(storedMode);
        }
      })
      .catch(() => {});
  }, []);

  // Native UI (the Liquid Glass tab bar) follows UIKit's style, not our
  // colors, so the manual choice has to override it too.
  useEffect(() => {
    Appearance.setColorScheme(mode === 'system' ? 'auto' : mode);
  }, [mode]);

  const setThemeMode = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
  }, []);

  const value = useMemo(() => {
    let isDark: boolean;
    if (mode === 'system') {
      isDark = systemScheme === 'dark';
    } else {
      isDark = mode === 'dark';
    }

    return {
      colors: isDark ? darkTheme : lightTheme,
      mode,
      isDark,
      setThemeMode,
    };
  }, [mode, systemScheme, setThemeMode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
