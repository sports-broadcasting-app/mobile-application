import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MatchTimeline } from '../components/MatchTimeline';
import { PeriodScoreboard } from '../components/PeriodScoreboard';
import { TeamCircle } from '../components/TeamCircle';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/Button';
import { useMatch, useTeamsById } from '../hooks/useSuperliga';
import { getChannelUrl } from '../utils/broadcast';
import { formatMatchDate } from '../utils/date';
import {
  goalsByPeriod,
  periodName,
  periodShortName,
} from '../utils/matchEvents';
import { formatRound } from '../utils/roundLabel';
import { getTeamName } from '../utils/teamName';
import { spacing, typography } from '../constants/designTokens';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const teamsById = useTeamsById();
  const { data: match, isLoading } = useMatch(id);

  const homeTeam = match ? teamsById.get(match.homeTeamId) : undefined;
  const awayTeam = match ? teamsById.get(match.awayTeamId) : undefined;

  if (!match || !homeTeam || !awayTeam) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Jogo' }} />
        {!isLoading && (
          <Text style={{ color: colors.textSecondary }}>
            Jogo não encontrado
          </Text>
        )}
      </View>
    );
  }

  const hasResult = match.homeScore !== null && match.awayScore !== null;
  const place = [match.venue, match.city].filter(Boolean).join(' - ');
  const events = match.events;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen
        options={{ title: formatRound(match.roundLabel) || 'Jogo' }}
      />

      <View style={styles.teams}>
        <View style={styles.team}>
          <TeamCircle team={homeTeam} />
          <Text style={[styles.teamName, { color: colors.textPrimary }]}>
            {getTeamName(homeTeam.name)}
          </Text>
        </View>
        <Text style={[styles.score, { color: colors.textPrimary }]}>
          {hasResult ? `${match.homeScore} x ${match.awayScore}` : 'x'}
        </Text>
        <View style={styles.team}>
          <TeamCircle team={awayTeam} />
          <Text style={[styles.teamName, { color: colors.textPrimary }]}>
            {getTeamName(awayTeam.name)}
          </Text>
        </View>
      </View>

      <Text style={[styles.info, { color: colors.textSecondary }]}>
        {formatMatchDate(match.startsAt)}
      </Text>
      {place.length > 0 && (
        <Text style={[styles.info, { color: colors.textSecondary }]}>
          {place}
        </Text>
      )}

      {match.setScores.length > 0 && hasResult && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Sets
          </Text>
          <PeriodScoreboard
            testID="set-scores"
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            periods={match.setScores.map((set, index) => ({
              label: `${index + 1}º`,
              name: `${index + 1}º set`,
              home: set.home,
              away: set.away,
            }))}
            totalLabel="Sets"
            homeTotal={match.homeScore ?? 0}
            awayTotal={match.awayScore ?? 0}
          />
        </View>
      )}

      {events && hasResult && (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Placar por tempo
            </Text>
            <PeriodScoreboard
              testID="half-scores"
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              periods={goalsByPeriod(events).map(({ period, home, away }) => ({
                label: periodShortName(period),
                name: periodName(period),
                home,
                away,
              }))}
              totalLabel="Final"
              homeTotal={match.homeScore ?? 0}
              awayTotal={match.awayScore ?? 0}
            />
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Lances
            </Text>
            {events.length > 0 ? (
              <MatchTimeline
                events={events}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            ) : (
              <Text style={[styles.info, { color: colors.textSecondary }]}>
                Sem gols nem expulsões
              </Text>
            )}
          </View>
        </>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Onde assistir
        </Text>
        {match.channels.length === 0 && (
          <Text style={[styles.info, { color: colors.textSecondary }]}>
            Transmissão a definir
          </Text>
        )}
        {match.channels.map((channel) => {
          const url = getChannelUrl(channel);
          return (
            <Button
              key={channel}
              label={url ? `Assistir no ${channel}` : channel}
              disabled={!url}
              onPress={() => {
                if (url) Linking.openURL(url).catch(() => {});
              }}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  teamName: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  score: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  info: {
    fontSize: typography.size.body,
    textAlign: 'center',
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
});
