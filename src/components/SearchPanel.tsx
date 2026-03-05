import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Match } from '../types/match';
import { formatHour } from '../utils/dateFormat';
import { BroadcasterPill } from './BroadcasterPill';
import { useTheme } from '../contexts/ThemeContext';

type Tab = 'recentes' | 'sugestoes';

interface SearchPanelProps {
  recentMatches: Match[];
  suggestedMatches: Match[];
  onPressMatch: (match: Match) => void;
  onClearRecents: () => void;
}

export function SearchPanel({
  recentMatches,
  suggestedMatches,
  onPressMatch,
  onClearRecents,
}: SearchPanelProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('recentes');

  const matches = activeTab === 'recentes' ? recentMatches : suggestedMatches;

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'recentes' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('recentes')}
          testID="search-tab-recentes"
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'recentes'
                    ? colors.primary
                    : colors.textTertiary,
              },
            ]}
          >
            Recentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'sugestoes' && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('sugestoes')}
          testID="search-tab-sugestoes"
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'sugestoes'
                    ? colors.primary
                    : colors.textTertiary,
              },
            ]}
          >
            Sugestoes
          </Text>
        </TouchableOpacity>

        {activeTab === 'recentes' && recentMatches.length > 0 && (
          <TouchableOpacity
            onPress={onClearRecents}
            style={styles.clearButton}
            testID="clear-recents"
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            {activeTab === 'recentes'
              ? 'Nenhum jogo recente'
              : 'Nenhuma sugestao disponivel'}
          </Text>
        </View>
      ) : (
        matches.map((match) => (
          <TouchableOpacity
            key={match.id}
            style={[styles.matchRow, { borderBottomColor: colors.borderLight }]}
            onPress={() => onPressMatch(match)}
            testID={`search-result-${match.id}`}
          >
            <View style={styles.matchInfo}>
              <Text
                style={[styles.matchName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {match.sport === 'formula1'
                  ? match.eventName
                  : `${match.homeTeam.name} vs ${match.awayTeam.name}`}
              </Text>
              <Text
                style={[styles.matchSub, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {match.sport === 'formula1'
                  ? match.sessionLabel
                  : match.broadcast.map((b) => b.name).join(', ')}
              </Text>
            </View>
            <View style={styles.matchRight}>
              {match.broadcast.slice(0, 1).map((b) => (
                <BroadcasterPill key={b.name} name={b.name} />
              ))}
              <View
                style={[
                  styles.timeBadge,
                  {
                    backgroundColor:
                      match.status === 'match-live'
                        ? '#dc2626'
                        : colors.primary,
                  },
                ]}
              >
                <Text style={styles.timeText}>{formatHour(match.hour)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  matchInfo: {
    flex: 1,
    gap: 2,
  },
  matchName: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchSub: {
    fontSize: 12,
  },
  matchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});
