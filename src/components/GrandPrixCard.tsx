import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { RaceSession } from '../types/snapshot';
import { formatTime } from '../utils/date';
import { describeSession } from '../utils/sessions';
import { BroadcasterPill } from './BroadcasterPill';
import { SportIcon } from './SportIcon';
import {
  iconSize,
  maxFontScale,
  radius,
  spacing,
  touchTarget,
  typography,
} from '../constants/designTokens';

interface GrandPrixCardProps {
  grandPrix: string;
  circuit: string | null;
  /** The sessions of the day being shown, in order. */
  sessions: RaceSession[];
  onPress: () => void;
}

/**
 * A race weekend in the day's list: no clubs and no "×", the Grand Prix
 * and one line per session with its time and channels. Opens the weekend.
 */
export const GrandPrixCard = React.memo(function GrandPrixCard({
  grandPrix,
  circuit,
  sessions,
  onPress,
}: GrandPrixCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={sessions.map((s) => describeSession(s)).join('. ')}
      accessibilityHint="Abre o fim de semana do GP"
      testID={`grand-prix-card-${sessions[0]?.grandPrixId}`}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
          <SportIcon
            sport="automobilismo"
            size={iconSize.md}
            color={colors.textSecondary}
          />
        </View>
        <View style={styles.title}>
          <Text
            maxFontSizeMultiplier={maxFontScale}
            numberOfLines={1}
            style={[styles.name, { color: colors.textPrimary }]}
          >
            {grandPrix}
          </Text>
          {circuit ? (
            <Text
              numberOfLines={1}
              style={[styles.circuit, { color: colors.textSecondary }]}
            >
              {circuit}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.md}
          color={colors.textTertiary}
        />
      </View>

      {sessions.map((session) => (
        <View
          key={session.id}
          style={[styles.session, { borderTopColor: colors.borderLight }]}
        >
          <Text
            maxFontSizeMultiplier={maxFontScale}
            style={[styles.time, { color: colors.textPrimary }]}
          >
            {formatTime(session.startsAt)}
          </Text>
          <Text
            maxFontSizeMultiplier={maxFontScale}
            numberOfLines={1}
            style={[styles.sessionName, { color: colors.textPrimary }]}
          >
            {session.name}
          </Text>
          {session.status === 'live' ? (
            <View style={[styles.live, { backgroundColor: colors.live }]}>
              <Text
                maxFontSizeMultiplier={maxFontScale}
                style={[styles.liveText, { color: colors.onLive }]}
              >
                AO VIVO
              </Text>
            </View>
          ) : null}
          {session.channels.length > 0 ? (
            <BroadcasterPill name={session.channels[0]} />
          ) : session.status === 'scheduled' ? (
            <Text
              maxFontSizeMultiplier={maxFontScale}
              style={[styles.tbd, { color: colors.textTertiary }]}
            >
              a definir
            </Text>
          ) : null}
        </View>
      ))}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  title: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  circuit: {
    fontSize: typography.size.sm,
  },
  session: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: touchTarget,
  },
  time: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    minWidth: 44,
  },
  sessionName: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
  live: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  liveText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  tbd: {
    fontSize: typography.size.sm,
  },
});
