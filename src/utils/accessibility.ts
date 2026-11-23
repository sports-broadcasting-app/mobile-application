import type { StandingsColumn } from '../constants/competitions';
import type { Match, Standing } from '../types/snapshot';
import { getTeamName } from './teamName';

interface DescribeMatchOptions {
  match: Match;
  homeName: string;
  awayName: string;
  favorite?: boolean;
  /** What the screen shows next to the clubs: time, competition, round... */
  details?: string[];
}

/**
 * One sentence for screen readers ("Athletico-PR contra Remo, 16:00,
 * 36ª rodada, passa no Premiere"), instead of the pieces of the card read one
 * by one with "×" in the middle.
 */
export function describeMatch({
  match,
  homeName,
  awayName,
  favorite = false,
  details = [],
}: DescribeMatchOptions): string {
  const home = getTeamName(homeName);
  const away = getTeamName(awayName);
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const clubs = hasScore
    ? `${home} ${match.homeScore} a ${match.awayScore} ${away}`
    : `${home} contra ${away}`;

  const status =
    match.status === 'live'
      ? 'ao vivo'
      : match.status === 'postponed'
        ? 'adiado'
        : match.status === 'finished'
          ? 'encerrado'
          : '';
  const started = match.status === 'live' || match.status === 'finished';
  const channels =
    match.channels.length > 0
      ? `passa no ${match.channels.join(' e no ')}`
      : started
        ? ''
        : 'transmissão a definir';

  return [
    clubs,
    status,
    ...details,
    favorite ? 'jogo do seu time' : '',
    channels,
  ]
    .filter(Boolean)
    .join(', ');
}

/** Column names read after the number 1 ("1 derrota", not "1 derrotas"). */
const SINGULAR: Record<string, string> = {
  pontos: 'ponto',
  jogos: 'jogo',
  vitórias: 'vitória',
  empates: 'empate',
  derrotas: 'derrota',
  'sets vencidos': 'set vencido',
  'sets perdidos': 'set perdido',
  'pontos a favor': 'ponto a favor',
  'pontos contra': 'ponto contra',
};

function countOf(value: number, label: string): string {
  const name = label.toLowerCase();
  return `${value} ${value === 1 ? (SINGULAR[name] ?? name) : name}`;
}

/** A standings row as one sentence: "5º, Athletico-PR, 54 pontos, ...". */
export function describeStanding(
  standing: Standing,
  teamName: string,
  columns: StandingsColumn[],
  favorite = false,
): string {
  return [
    `${standing.position}º`,
    getTeamName(teamName),
    ...columns.map(({ label, value }) => countOf(value(standing), label)),
    favorite ? 'seu time' : '',
  ]
    .filter(Boolean)
    .join(', ');
}
