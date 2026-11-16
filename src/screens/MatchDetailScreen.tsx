import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TeamCircle } from '../components/TeamCircle';
import { useTheme } from '../contexts/ThemeContext';
import { useMatch, useTeamsById } from '../hooks/useSuperliga';
import { getChannelUrl } from '../utils/broadcast';
import { formatMatchDate } from '../utils/date';
import { formatRound } from '../utils/roundLabel';
import { getTeamName } from '../utils/teamName';
import { radius, spacing, typography } from '../constants/designTokens';

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

      {match.setScores.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Sets
          </Text>
          {match.setScores.map((set, index) => (
            <Text
              key={index}
              style={[styles.info, { color: colors.textSecondary }]}
            >
              {`${index + 1}º set: ${set.home} x ${set.away}`}
            </Text>
          ))}
        </View>
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
            <TouchableOpacity
              key={channel}
              accessibilityRole="button"
              disabled={!url}
              style={[
                styles.channel,
                { backgroundColor: colors.ctaBackground },
              ]}
              onPress={() => {
                if (url) Linking.openURL(url).catch(() => {});
              }}
            >
              <Text style={[styles.channelText, { color: colors.ctaText }]}>
                {url ? `Assistir no ${channel}` : channel}
              </Text>
            </TouchableOpacity>
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
  channel: {
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  channelText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
  },
});
