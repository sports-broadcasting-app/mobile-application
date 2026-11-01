import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, lightTheme, darkTheme } from '../constants/theme';

type ThemeMode = 'system' | 'light' | 'dark';
const STORAGE_KEY = '@theme_mode';

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightTheme,
  mode: 'system',
  isDark: false,
  toggleTheme: () => {},
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

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const nextMode =
        prev === 'system'
          ? systemScheme === 'dark'
            ? 'light'
            : 'dark'
          : prev === 'dark'
            ? 'light'
            : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {});
      return nextMode;
    });
  }, [systemScheme]);

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
      toggleTheme,
    };
  }, [mode, systemScheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
