const PALETTE = [
  '#1e40af',
  '#dc2626',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#be123c',
  '#4338ca',
  '#15803d',
  '#b45309',
  '#6d28d9',
  '#0e7490',
];

export function getTeamColor(id: string): string {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
}
