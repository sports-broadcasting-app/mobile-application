import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTodayMatches } from '../hooks/useTodayMatches';
import { GradientHeader } from '../components/GradientHeader';
import { CountdownTimer } from '../components/CountdownTimer';
import { CtaButton } from '../components/CtaButton';
import { TeamCircle } from '../components/TeamCircle';
import { VsBadge } from '../components/VsBadge';
import { BroadcasterCircle } from '../components/BroadcasterCircle';
import { MatchCard } from '../components/MatchCard';
import { formatMatchDateTime } from '../utils/dateFormat';
import { generateMatchDescription } from '../utils/matchDescription';
import { getChampionshipLabel } from '../utils/championshipLabel';
import { Sport } from '../types/match';
import { useTheme } from '../contexts/ThemeContext';

interface MatchDetailScreenProps {
  id: string;
  sport: Sport;
}

export function MatchDetailScreen({ id, sport }: MatchDetailScreenProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { matches, loading, error } = useTodayMatches(sport);

  const match = useMemo(() => matches.find((m) => m.id === id), [matches, id]);

  const relatedMatches = useMemo(() => {
    if (!match) return [];
    return matches.filter(
      (m) =>
        m.id !== match.id && m.championship.slug === match.championship.slug,
    );
  }, [matches, match]);

  const hasScore = match ? match.status !== 'match-not-started' : false;

  const handleAssistir = () => {
    if (!match) return;
    const streamBroadcast = match.broadcast.find((b) => b.url !== '');
    if (streamBroadcast) {
      Linking.openURL(streamBroadcast.url);
    } else {
      Alert.alert(
        'Assistir na TV',
        `Assista ao vivo por ${match.broadcast.map((b) => b.name).join(', ')}`,
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GradientHeader showBackButton onBack={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            testID="activity-indicator"
          />
        </View>
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GradientHeader showBackButton onBack={() => router.back()} />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error ?? 'Jogo nao encontrado'}
          </Text>
        </View>
      </View>
    );
  }

  const dateTime = formatMatchDateTime(match.date, match.hour);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader showBackButton onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <CountdownTimer isoDate={match.isoDate} status={match.status} />

        {match.sport === 'formula1' ? (
          <View style={styles.f1Section}>
            <Text style={[styles.f1EventName, { color: colors.textPrimary }]}>
              {match.eventName}
            </Text>
            <Text
              style={[styles.f1SessionLabel, { color: colors.textSecondary }]}
            >
              {match.sessionLabel}
            </Text>
            {match.stadium !== '' && (
              <Text style={[styles.f1Circuit, { color: colors.textTertiary }]}>
                {match.stadium} - {match.location.city},{' '}
                {match.location.country}
              </Text>
            )}
          </View>
        ) : (
          <>
            <View style={styles.teamsSection}>
              <View style={styles.teamColumn}>
                <TeamCircle team={match.homeTeam} size={80} />
              </View>
              <View style={styles.vsColumn}>
                {hasScore ? (
                  <Text
                    style={[styles.detailScore, { color: colors.textPrimary }]}
                  >
                    {match.score.type === 'football'
                      ? `${match.score.goals.home ?? '-'} x ${match.score.goals.away ?? '-'}`
                      : `${match.score.sets.home ?? '-'} x ${match.score.sets.away ?? '-'}`}
                  </Text>
                ) : (
                  <VsBadge size={48} />
                )}
              </View>
              <View style={styles.teamColumn}>
                <TeamCircle team={match.awayTeam} size={80} />
              </View>
            </View>

            <Text style={[styles.matchTitle, { color: colors.textPrimary }]}>
              {match.homeTeam.name} vs {match.awayTeam.name}
            </Text>
          </>
        )}

        <Text style={[styles.championship, { color: colors.primary }]}>
          {getChampionshipLabel(match.championship.slug)}
        </Text>

        <Text style={[styles.dateTime, { color: colors.textSecondary }]}>
          {dateTime}
        </Text>

        {match.broadcast.length > 0 && (
          <CtaButton label="ASSISTIR AGORA" onPress={handleAssistir} />
        )}

        {match.broadcast.length > 0 && (
          <View style={styles.broadcastRow}>
            {match.broadcast.map((b) => (
              <BroadcasterCircle key={b.name} name={b.name} size={36} />
            ))}
          </View>
        )}

        {match.sport !== 'formula1' && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {generateMatchDescription(match)}
          </Text>
        )}

        {match.stadium !== '' && match.sport !== 'formula1' && (
          <Text style={[styles.stadium, { color: colors.textTertiary }]}>
            {match.stadium} - {match.location.city}
          </Text>
        )}

        {relatedMatches.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {match.sport === 'formula1'
                ? 'Proximas Sessoes'
                : 'Proximos Jogos'}
            </Text>
            {relatedMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  teamsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  vsColumn: {
    paddingHorizontal: 16,
  },
  detailScore: {
    fontSize: 28,
    fontWeight: '800',
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  championship: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  dateTime: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  broadcastRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 20,
    paddingTop: 16,
    textAlign: 'center',
  },
  stadium: {
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  bottomSpacer: {
    height: 32,
  },
  f1Section: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  f1EventName: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  f1SessionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  f1Circuit: {
    fontSize: 14,
    marginTop: 12,
  },
});
