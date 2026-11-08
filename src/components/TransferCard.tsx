import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Linking from 'expo-linking';
import { TeamCircle } from './TeamCircle';
import { useTheme } from '../contexts/ThemeContext';
import { Team, Transfer, TransferClub } from '../types/superliga';
import {
  formatTransferDate,
  getSourceName,
  TransferDirection,
} from '../utils/transfers';
import { getTeamName } from '../utils/teamName';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

const BADGE_SIZE = 28;

interface TransferCardProps {
  transfer: Transfer;
  teamsById: Map<string, Team>;
  favoriteDirection: TransferDirection | null;
}

function Club({
  club,
  teamsById,
}: {
  club: TransferClub;
  teamsById: Map<string, Team>;
}) {
  const { colors } = useTheme();
  const team = club.teamId ? teamsById.get(club.teamId) : undefined;

  return (
    <View style={styles.club}>
      {team ? (
        <TeamCircle team={team} size={BADGE_SIZE} />
      ) : (
        <MaterialCommunityIcons
          name="shield-outline"
          size={BADGE_SIZE}
          color={colors.textTertiary}
        />
      )}
      <Text
        numberOfLines={2}
        style={[styles.clubName, { color: colors.textPrimary }]}
      >
        {getTeamName(team?.name ?? club.name)}
      </Text>
    </View>
  );
}

export const TransferCard = React.memo(function TransferCard({
  transfer,
  teamsById,
  favoriteDirection,
}: TransferCardProps) {
  const { colors } = useTheme();
  const highlight =
    favoriteDirection === 'in'
      ? colors.primary
      : favoriteDirection === 'out'
        ? colors.error
        : null;
  const details = [
    transfer.date ? formatTransferDate(transfer.date) : null,
    transfer.loan ? 'Empréstimo' : null,
  ].filter(Boolean);

  return (
    <View
      testID={`transfer-card-${transfer.id}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: highlight ?? colors.surface,
        },
      ]}
    >
      <Text style={[styles.athlete, { color: colors.textPrimary }]}>
        {transfer.athleteName}
        {transfer.position ? (
          <Text style={{ color: colors.textSecondary }}>
            {` · ${transfer.position}`}
          </Text>
        ) : null}
      </Text>

      <View style={styles.clubs}>
        <Club club={transfer.from} teamsById={teamsById} />
        <MaterialCommunityIcons
          name="arrow-right"
          size={iconSize.md}
          color={colors.textTertiary}
        />
        <Club club={transfer.to} teamsById={teamsById} />
      </View>

      {(details.length > 0 || highlight) && (
        <View style={styles.footer}>
          <Text style={[styles.details, { color: colors.textSecondary }]}>
            {details.join(' · ')}
          </Text>
          {highlight && (
            <Text style={[styles.favorite, { color: highlight }]}>
              {favoriteDirection === 'in'
                ? 'Chegou ao seu time'
                : 'Saiu do seu time'}
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        accessibilityRole="link"
        testID={`transfer-source-${transfer.id}`}
        style={styles.source}
        onPress={() => Linking.openURL(transfer.sourceUrl).catch(() => {})}
      >
        <MaterialCommunityIcons
          name="newspaper-variant-outline"
          size={iconSize.sm}
          color={colors.primary}
        />
        <Text style={[styles.sourceText, { color: colors.primary }]}>
          {`Fonte: ${getSourceName(transfer.sourceUrl)}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  athlete: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  clubs: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  club: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  clubName: {
    flexShrink: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  details: {
    fontSize: typography.size.sm,
  },
  favorite: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  source: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sourceText: {
    fontSize: typography.size.sm,
  },
});
