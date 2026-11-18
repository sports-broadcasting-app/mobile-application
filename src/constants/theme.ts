/**
 * Colors by role, never by component: a new screen picks from these instead
 * of adding `somethingBtnBg`. Contrast pairs: `onPrimary` over `primary`,
 * `onLive` over `live`.
 */
export interface ThemeColors {
  /** Screen behind everything. */
  background: string;
  /** Cards, sheets, grouped lists. */
  surface: string;
  /** Wells inside a surface: icon tiles, disabled buttons, search field. */
  surfaceAlt: string;
  primary: string;
  /** Text and icons drawn over `primary`. */
  onPrimary: string;
  /** Tinted fill for the favorite highlight and broadcaster pills. */
  primarySoft: string;
  /** The AO VIVO badge: red in both themes. */
  live: string;
  onLive: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  /** Uppercase section labels. */
  sectionHeaderText: string;
  /** The "×" between the two clubs. */
  versusText: string;
  border: string;
  borderLight: string;
  /** Unselected chips, checkboxes and radios. */
  controlBg: string;
  controlText: string;
  controlBorder: string;
  error: string;
  overlayBg: string;
  skeletonBase: string;
  statusBar: 'dark' | 'light';
}

export const lightTheme: ThemeColors = {
  background: '#f8f9fa',
  surface: '#fff',
  surfaceAlt: '#f1f5f9',
  primary: '#16a34a',
  onPrimary: '#fff',
  primarySoft: '#dcfce7',
  live: '#dc2626',
  onLive: '#fff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  sectionHeaderText: '#6b7280',
  versusText: '#6b7280',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  controlBg: '#fff',
  controlText: '#374151',
  controlBorder: '#d1d5db',
  error: '#dc2626',
  overlayBg: 'rgba(0, 0, 0, 0.5)',
  skeletonBase: '#e5e7eb',
  statusBar: 'dark',
};

export const darkTheme: ThemeColors = {
  // Two tones plus a faint white border: cards float without shadows.
  background: '#0b1120',
  surface: '#141d2e',
  surfaceAlt: '#1b2740',
  primary: '#22c55e',
  // White over this lighter green fails contrast; near-black passes.
  onPrimary: '#07140c',
  primarySoft: 'rgba(34, 197, 94, 0.14)',
  live: '#ef4444',
  onLive: '#fff',
  textPrimary: '#f1f5f9',
  textSecondary: '#8b94a6',
  textTertiary: '#64748b',
  sectionHeaderText: '#94a3b8',
  versusText: '#475569',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  controlBg: '#172033',
  controlText: '#c3cad6',
  controlBorder: 'rgba(255, 255, 255, 0.08)',
  error: '#ef4444',
  overlayBg: 'rgba(0, 0, 0, 0.7)',
  skeletonBase: '#1b2740',
  statusBar: 'light',
};
