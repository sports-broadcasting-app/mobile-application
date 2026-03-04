export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderLight: string;
  error: string;
  broadcastBadgeBg: string;
  chipBorder: string;
  shadow: string;
  statusBar: 'dark' | 'light';
}

export const lightTheme: ThemeColors = {
  background: '#f5f5f5',
  surface: '#fff',
  surfaceAlt: '#f8fafc',
  primary: '#2563eb',
  textPrimary: '#111',
  textSecondary: '#666',
  textTertiary: '#999',
  border: '#e5e5e5',
  borderLight: '#f0f0f0',
  error: '#dc2626',
  broadcastBadgeBg: '#f0f4ff',
  chipBorder: '#e5e7eb',
  shadow: '#000',
  statusBar: 'dark',
};

export const darkTheme: ThemeColors = {
  background: '#111827',
  surface: '#1f2937',
  surfaceAlt: '#374151',
  primary: '#3b82f6',
  textPrimary: '#f5f5f5',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',
  border: '#374151',
  borderLight: '#1f2937',
  error: '#ef4444',
  broadcastBadgeBg: '#1e3a5f',
  chipBorder: '#374151',
  shadow: '#000',
  statusBar: 'light',
};
