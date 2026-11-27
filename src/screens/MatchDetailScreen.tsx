import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { AppText } from '../components/AppText';
import { ChannelButtons } from '../components/ChannelButtons';
import { MatchTimeline } from '../components/MatchTimeline';
import { PeriodScoreboard } from '../components/PeriodScoreboard';
import { TeamCircle } from '../components/TeamCircle';
import { useTheme } from '../contexts/ThemeContext';
import { useMatch, useTeamsById } from '../hooks/useSuperliga';
import { Team } from '../types/snapshot';
import { formatMatchDate } from '../utils/date';
import {
  goalsByPeriod,
  periodName,
  periodShortName,
} from '../utils/matchEvents';
import { quarterColumns } from '../utils/periods';
import { formatRound } from '../utils/roundLabel';
import { getTeamName } from '../utils/teamName';
import { spacing, typography } from '../constants/designTokens';

/** A block of the detail with its centered title. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="labelStrong" style={styles.centered}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function TeamColumn({ team }: { team: Team }) {
  return (
    <View style={styles.team}>
      <TeamCircle team={team} />
      <AppText variant="bodyStrong" style={styles.centered}>
        {getTeamName(team.name)}
      </AppText>
    </View>
  );
}

/** Secondary centered text: date, venue, "nothing here" lines. */
function Info({ children }: { children: ReactNode }) {
  return (
    <AppText tone="secondary" style={styles.centered}>
      {children}
    </AppText>
  );
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const teamsById = useTeamsById();
  const { data: match, isLoading } = useMatch(id);

  const homeTeam = match ? teamsById.get(match.homeTeamId) : undefined;
  const awayTeam = match ? teamsById.get(match.awayTeamId) : undefined;

  if (!match || !homeTeam || !awayTeam) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Jogo' }} />
        {!isLoading && <AppText tone="secondary">Jogo não encontrado</AppText>}
      </View>
    );
  }

  const hasResult = match.homeScore !== null && match.awayScore !== null;
  const hasStarted = match.status === 'live' || match.status === 'finished';
  const place = [match.venue, match.city].filter(Boolean).join(' - ');
  const events = match.events;
  // A live game has no final score yet: the last column is the running total.
  const totalLabel = match.status === 'live' ? 'Total' : 'Final';
  const scoreboard = {
    homeTeam,
    awayTeam,
    homeTotal: match.homeScore ?? 0,
    awayTotal: match.awayScore ?? 0,
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen
        options={{ title: formatRound(match.roundLabel) || 'Jogo' }}
      />

      <View style={styles.teams}>
        <TeamColumn team={homeTeam} />
        <AppText style={styles.score}>
          {hasResult ? `${match.homeScore} x ${match.awayScore}` : 'x'}
        </AppText>
        <TeamColumn team={awayTeam} />
      </View>

      <Info>{formatMatchDate(match.startsAt)}</Info>
      {place.length > 0 && <Info>{place}</Info>}

      {match.setScores.length > 0 && hasResult && (
        <Section title="Sets">
          <PeriodScoreboard
            testID="set-scores"
            {...scoreboard}
            periods={match.setScores.map((set, index) => ({
              label: `${index + 1}º`,
              name: `${index + 1}º set`,
              home: set.home,
              away: set.away,
            }))}
            totalLabel="Sets"
          />
        </Section>
      )}

      {match.periodScores && hasResult && (
        <Section title="Placar por quarto">
          <PeriodScoreboard
            testID="quarter-scores"
            {...scoreboard}
            periods={quarterColumns(match.periodScores)}
            totalLabel={totalLabel}
          />
        </Section>
      )}

      {events && hasResult && (
        <>
          <Section title="Placar por tempo">
            <PeriodScoreboard
              testID="half-scores"
              {...scoreboard}
              periods={goalsByPeriod(events).map(({ period, home, away }) => ({
                label: periodShortName(period),
                name: periodName(period),
                home,
                away,
              }))}
              totalLabel={totalLabel}
            />
          </Section>
          <Section title="Lances">
            {events.length > 0 ? (
              <MatchTimeline
                events={events}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            ) : (
              <Info>Sem gols nem expulsões</Info>
            )}
          </Section>
        </>
      )}

      {/* A game that started without a known channel has nothing to show
          here: "a definir" only makes sense before kickoff. */}
      {(match.channels.length > 0 || !hasStarted) && (
        <Section title="Onde assistir">
          <ChannelButtons channels={match.channels} centered />
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  centered: {
    textAlign: 'center',
  },
  content: {
    gap: spacing.sm,
    padding: spacing.xl,
  },
  teams: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  team: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  score: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
