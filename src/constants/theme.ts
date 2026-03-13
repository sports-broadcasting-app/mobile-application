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
  broadcastBadgeBg: '#f0f4ff',
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
  background: '#111827',
  surface: '#1f2937',
  surfaceAlt: '#374151',
  surfaceCard: '#1f2937',
  headerBg: '#1f2937',
  primary: '#22c55e',
  textPrimary: '#f5f5f5',
  textSecondary: '#9ca3af',
  textTertiary: '#6b7280',
  textOnPrimary: '#fff',
  border: '#374151',
  borderLight: '#1f2937',
  error: '#ef4444',
  broadcastBadgeBg: '#1e3a5f',
  chipBorder: '#374151',
  chipActiveBg: '#22c55e',
  chipActiveText: '#111',
  chipInactiveBg: '#1f2937',
  chipInactiveText: '#9ca3af',
  shadow: '#000',
  statusBar: 'light',
  gradientStart: '#052e16',
  gradientEnd: '#14532d',
  vsBadgeBg: '#6b7280',
  ctaBackground: '#22c55e',
  ctaText: '#111',
  reminderBtnBg: '#374151',
  reminderBtnText: '#d1d5db',
  watchBtnBg: '#22c55e',
  watchBtnText: '#111',
  overlayBg: 'rgba(0, 0, 0, 0.7)',
  sectionHeaderText: '#9ca3af',
  skeletonBase: '#374151',
  skeletonHighlight: '#4b5563',
};
