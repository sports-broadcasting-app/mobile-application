import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, lightTheme, darkTheme } from '../constants/theme';

type ThemeMode = 'system' | 'light' | 'dark';

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
      toggleTheme: () => {
        setMode((prev) => {
          if (prev === 'system')
            return systemScheme === 'dark' ? 'light' : 'dark';
          return prev === 'dark' ? 'light' : 'dark';
        });
      },
    };
  }, [mode, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
