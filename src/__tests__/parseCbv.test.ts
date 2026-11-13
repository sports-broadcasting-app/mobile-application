import {
  buildCompetition,
  extractFlightPayload,
  parseMatches,
  parseStandings,
} from '../../scripts/superliga/parseCbv';
import { assertValidSnapshot } from '../../scripts/validate';
import { buildSnapshot, scheduledMatch } from '../test-fixtures';

function toHtml(payload: string): string {
  const half = Math.floor(payload.length / 2);
  return [payload.slice(0, half), payload.slice(half)]
    .map(
      (chunk) =>
        `<script>self.__next_f.push([1,${JSON.stringify(chunk)}])</script>`,
    )
    .join('');
}

const finishedRaw = {
  ChampionshipMatch_ID: 10,
  MatchDateTime: '2026-10-21T02:00:00+02:00',
  HomeTeam_ID: 1,
  GuestTeam_ID: 2,
  RoundType: 'TURNO - RODADA 1',
  Round_Number: 1,
  WonSetHome: 3,
  WonSetGuest: 0,
  Set1Home: 25,
  Set1Guest: 20,
  Set2Home: 25,
  Set2Guest: 21,
  Set3Home: 25,
  Set3Guest: 19,
  Set4Home: 0,
  Set4Guest: 0,
  isFinished: true,
  isLive: false,
  postponed: false,
  custom_data: { sge_transmission_names: ['SporTV 2'] },
  hall: { Denomination: 'ARENA "A"', City: 'BH' },
  HomeTeamData: { Email: 'contato@clube.com', PlayerList: [{ id: 1 }] },
};

const standingRow = {
  teamId: '1',
  teamName: 'TIME A',
  teamCode: 'TMA',
  badge: 'https://example.com/a.png',
  position: 1,
  points: 3,
  wins: 1,
  losses: 0,
  matches: 1,
  setsWon: 3,
  setsLost: 0,
  pointsWon: 75,
  pointsLost: 60,
};

describe('parseCbv', () => {
  it('rebuilds the payload from the streamed chunks', () => {
    const payload = `x:${JSON.stringify({ text: 'Vôlei "quadra"' })}`;
    expect(extractFlightPayload(toHtml(payload))).toBe(payload);
  });

  it('keeps only the published fields of a match', () => {
    const payload = `a:${JSON.stringify([finishedRaw])}`;
    const [match] = parseMatches(payload, 'masculina');

    expect(match).toMatchObject({
      id: '10',
      homeTeamId: '1',
      status: 'finished',
      homeScore: 3,
      channels: ['SporTV 2'],
      venue: 'ARENA "A"',
    });
    expect(match.setScores).toHaveLength(3);
    expect(JSON.stringify(match)).not.toContain('contato@clube.com');
  });

  it('merges duplicates, keeping the copy with channels', () => {
    const noChannel = { ...finishedRaw, custom_data: {} };
    const payload = JSON.stringify([noChannel, finishedRaw]);
    const matches = parseMatches(payload, 'masculina');
    expect(matches).toHaveLength(1);
    expect(matches[0].channels).toEqual(['SporTV 2']);
  });

  it('hides sets and score of a match that did not start', () => {
    const raw = {
      ...finishedRaw,
      isFinished: false,
      WonSetHome: 0,
      WonSetGuest: 0,
    };
    const [match] = parseMatches(JSON.stringify([raw]), 'masculina');
    expect(match.status).toBe('scheduled');
    expect(match.homeScore).toBeNull();
    expect(match.setScores).toEqual([]);
  });

  it('flags postponed matches and tolerates a missing broadcast', () => {
    const postponed = { ...finishedRaw, custom_data: {}, postponed: true };
    const [match] = parseMatches(JSON.stringify([postponed]), 'feminina');
    expect(match.status).toBe('postponed');
    expect(match.channels).toEqual([]);
  });

  it('skips a match without teams', () => {
    const raw = { ...finishedRaw, GuestTeam_ID: null };
    expect(parseMatches(JSON.stringify([raw]), 'masculina')).toEqual([]);
  });

  it('parses teams and standings once per team', () => {
    const payload = JSON.stringify({ teams: [standingRow, standingRow] });
    const { teams, standings } = parseStandings(payload);
    expect(teams).toEqual([
      {
        id: '1',
        name: 'TIME A',
        code: 'TMA',
        badgeUrl: 'https://example.com/a.png',
      },
    ]);
    expect(standings[0]).toMatchObject({ position: 1, points: 3 });
  });

  it('builds a competition from both pages', () => {
    const competition = buildCompetition(
      'feminina',
      'Superliga Feminina',
      '2026/27',
      toHtml(JSON.stringify([finishedRaw])),
      toHtml(JSON.stringify([standingRow])),
    );
    expect(competition.matches).toHaveLength(1);
    expect(competition.teams).toHaveLength(1);
  });

  describe('assertValidSnapshot', () => {
    function validSnapshot() {
      const snapshot = buildSnapshot([]);
      const teams = Array.from({ length: 8 }, (_, index) => ({
        id: String(index),
        name: `Time ${index}`,
        code: `T${index}`,
        badgeUrl: null,
      }));
      const competition = snapshot.competitions[0];
      competition.teams = teams;
      competition.standings = teams.map((team, index) => ({
        ...competition.standings[0],
        teamId: team.id,
        position: index + 1,
      }));
      competition.matches = teams.map((_, index) => ({
        ...scheduledMatch,
        id: String(index),
        homeTeamId: '0',
        awayTeamId: '1',
      }));
      return { ...snapshot, competitions: [competition] };
    }

    it('accepts a coherent snapshot', () => {
      expect(() => assertValidSnapshot(validSnapshot())).not.toThrow();
    });

    it('rejects a page that came back almost empty', () => {
      const snapshot = validSnapshot();
      snapshot.competitions[0].matches = [];
      expect(() => assertValidSnapshot(snapshot)).toThrow(/matches/);
    });

    it('rejects a match with an unknown team', () => {
      const snapshot = validSnapshot();
      snapshot.competitions[0].matches[0].awayTeamId = '999';
      expect(() => assertValidSnapshot(snapshot)).toThrow(/unknown team/);
    });
  });
});
