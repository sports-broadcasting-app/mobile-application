export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceCard: string;
  headerBg: string;
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
  chipActiveBg: string;
  chipActiveText: string;
  chipInactiveBg: string;
  chipInactiveText: string;
  shadow: string;
  statusBar: 'dark' | 'light';
  gradientStart: string;
  gradientEnd: string;
  vsBadgeBg: string;
  ctaBackground: string;
  ctaText: string;
  reminderBtnBg: string;
  reminderBtnText: string;
  watchBtnBg: string;
  watchBtnText: string;
  overlayBg: string;
  sectionHeaderText: string;
  skeletonBase: string;
  skeletonHighlight: string;
}

export const lightTheme: ThemeColors = {
  background: '#f8f9fa',
  surface: '#fff',
  surfaceAlt: '#f1f5f9',
  surfaceCard: '#fff',
  headerBg: '#fff',
  primary: '#16a34a',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textOnPrimary: '#fff',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  error: '#dc2626',
  broadcastBadgeBg: '#dcfce7',
  chipBorder: '#d1d5db',
  chipActiveBg: '#16a34a',
  chipActiveText: '#fff',
  chipInactiveBg: '#fff',
  chipInactiveText: '#374151',
  shadow: '#000',
  statusBar: 'dark',
  gradientStart: '#14532d',
  gradientEnd: '#16a34a',
  vsBadgeBg: '#6b7280',
  ctaBackground: '#16a34a',
  ctaText: '#fff',
  reminderBtnBg: '#f3f4f6',
  reminderBtnText: '#374151',
  watchBtnBg: '#16a34a',
  watchBtnText: '#fff',
  overlayBg: 'rgba(0, 0, 0, 0.5)',
  sectionHeaderText: '#6b7280',
  skeletonBase: '#e5e7eb',
  skeletonHighlight: '#f3f4f6',
};

export const darkTheme: ThemeColors = {
  // Two tones plus a faint white border: cards float without shadows.
  background: '#0b1120',
  surface: '#141d2e',
  surfaceAlt: '#1b2740',
  surfaceCard: '#141d2e',
  headerBg: '#141d2e',
  primary: '#22c55e',
  textPrimary: '#f1f5f9',
  textSecondary: '#8b94a6',
  textTertiary: '#64748b',
  textOnPrimary: '#fff',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  error: '#ef4444',
  broadcastBadgeBg: 'rgba(34, 197, 94, 0.14)',
  chipBorder: 'rgba(255, 255, 255, 0.08)',
  chipActiveBg: '#22c55e',
  chipActiveText: '#07140c',
  chipInactiveBg: '#172033',
  chipInactiveText: '#c3cad6',
  shadow: '#000',
  statusBar: 'light',
  gradientStart: '#052e16',
  gradientEnd: '#14532d',
  vsBadgeBg: '#475569',
  ctaBackground: '#22c55e',
  ctaText: '#07140c',
  reminderBtnBg: '#1b2740',
  reminderBtnText: '#e2e8f0',
  watchBtnBg: '#22c55e',
  watchBtnText: '#07140c',
  overlayBg: 'rgba(0, 0, 0, 0.7)',
  sectionHeaderText: '#94a3b8',
  skeletonBase: '#1b2740',
  skeletonHighlight: '#243049',
};
