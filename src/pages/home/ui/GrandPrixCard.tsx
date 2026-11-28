import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Icon } from '@/shared/ui/Icon';
import { useTheme } from '@/shared/theme/ThemeContext';
import { RaceSession } from '@/shared/api/snapshot';
import { formatTime } from '@/shared/lib/date';
import { describeSession } from '@/entities/session/lib/sessions';
import { BroadcasterPill } from '@/shared/ui/BroadcasterPill';
import { SportIcon } from '@/shared/ui/SportIcon';
import {
  iconSize,
  radius,
  spacing,
  touchTarget,
  typography,
} from '@/shared/theme/designTokens';

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
          <AppText variant="labelStrong" capped numberOfLines={1}>
            {grandPrix}
          </AppText>
          {circuit ? (
            <AppText variant="caption" tone="secondary" numberOfLines={1}>
              {circuit}
            </AppText>
          ) : null}
        </View>
        <Icon
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
          <AppText variant="labelStrong" capped style={styles.time}>
            {formatTime(session.startsAt)}
          </AppText>
          <AppText
            variant="bodyStrong"
            capped
            numberOfLines={1}
            style={styles.sessionName}
          >
            {session.name}
          </AppText>
          {session.status === 'live' ? (
            <View style={[styles.live, { backgroundColor: colors.live }]}>
              <AppText tone="onLive" capped style={styles.liveText}>
                AO VIVO
              </AppText>
            </View>
          ) : null}
          {session.channels[0] ? (
            <BroadcasterPill name={session.channels[0]} />
          ) : session.status === 'scheduled' ? (
            <AppText variant="caption" tone="tertiary" capped>
              a definir
            </AppText>
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
  session: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: touchTarget,
  },
  time: {
    minWidth: 44,
  },
  sessionName: {
    flex: 1,
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
});
