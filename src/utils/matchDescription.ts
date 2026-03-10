import { TeamMatch } from '../types/match';
import { getChampionshipLabel } from './championshipLabel';
import { formatHour } from './dateFormat';

export function generateMatchDescription(match: TeamMatch): string {
  const championship = getChampionshipLabel(match.championship.slug);
  const time = formatHour(match.hour);
  const broadcasters = match.broadcast.map((b) => b.name).join(', ');

  const location =
    match.stadium !== ''
      ? ` no ${match.stadium}, em ${match.location.city}`
      : '';

  const broadcastInfo =
    broadcasters !== '' ? ` Transmissao ao vivo por ${broadcasters}.` : '';

  if (match.status === 'match-not-started') {
    return `Em breve, pelo confronto da ${championship}, o ${match.homeTeam.name} recebe o ${match.awayTeam.name} em casa. O jogo comeca as ${time}${location}.${broadcastInfo}`;
  }

  if (match.status === 'match-live') {
    return `Jogo em andamento pela ${championship}. ${match.homeTeam.name} enfrenta ${match.awayTeam.name}${location}.${broadcastInfo}`;
  }

  return `Jogo encerrado pela ${championship}. ${match.homeTeam.name} enfrentou ${match.awayTeam.name}${location}.`;
}
