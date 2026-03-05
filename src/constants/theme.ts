export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnPrimary: string;
  border: string;
  borderLight: string;
  error: string;
  broadcastBadgeBg: string;
  chipBorder: string;
  shadow: string;
  statusBar: 'dark' | 'light';
  gradientStart: string;
  gradientEnd: string;
  vsBadgeBg: string;
  ctaBackground: string;
  ctaText: string;
  chipActiveBg: string;
  chipActiveText: string;
}

export const lightTheme: ThemeColors = {
  background: '#f5f5f5',
  surface: '#fff',
  surfaceAlt: '#f0fdf4',
  primary: '#16a34a',
  textPrimary: '#111',
  textSecondary: '#666',
  textTertiary: '#999',
  textOnPrimary: '#fff',
  border: '#e5e5e5',
  borderLight: '#f0f0f0',
  error: '#dc2626',
  broadcastBadgeBg: '#f0fdf4',
  chipBorder: '#e5e7eb',
  shadow: '#000',
  statusBar: 'light',
  gradientStart: '#14532d',
  gradientEnd: '#16a34a',
  vsBadgeBg: '#16a34a',
  ctaBackground: '#16a34a',
  ctaText: '#fff',
  chipActiveBg: '#16a34a',
  chipActiveText: '#fff',
};

export const darkTheme: ThemeColors = {
  background: '#111827',
  surface: '#1f2937',
  surfaceAlt: '#374151',
  primary: '#22c55e',
  textPrimary: '#f5f5f5',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',
  textOnPrimary: '#fff',
  border: '#374151',
  borderLight: '#1f2937',
  error: '#ef4444',
  broadcastBadgeBg: '#064e3b',
  chipBorder: '#374151',
  shadow: '#000',
  statusBar: 'light',
  gradientStart: '#052e16',
  gradientEnd: '#14532d',
  vsBadgeBg: '#16a34a',
  ctaBackground: '#22c55e',
  ctaText: '#111',
  chipActiveBg: '#22c55e',
  chipActiveText: '#111',
};
