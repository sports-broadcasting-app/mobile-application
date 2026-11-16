/**
 * The round as a short phrase: the CBV writes "TURNO - RODADA 5" and
 * "RETURNO - RODADA 2", ge already sends "35ª rodada". Other labels (play-offs)
 * only lose the capitals.
 */
export function formatRound(label: string): string {
  const round = label.match(/RODADA\s+(\d+)/i);
  if (round) {
    const leg = /RETURNO/i.test(label) ? ' · returno' : '';
    return `${round[1]}ª rodada${leg}`;
  }
  if (/[a-zà-ÿ]/.test(label)) return label.trim();
  const lower = label.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
