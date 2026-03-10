import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MatchStatus } from '../types/match';
import { useTheme } from '../contexts/ThemeContext';

interface CountdownTimerProps {
  isoDate: string;
  status: MatchStatus;
}

function getTimeRemaining(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return '00:00';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function CountdownTimer({ isoDate, status }: CountdownTimerProps) {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(isoDate));

  useEffect(() => {
    if (status !== 'match-not-started') return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(isoDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [isoDate, status]);

  if (status === 'match-live') {
    return (
      <View style={styles.container} testID="countdown-timer">
        <View style={styles.liveDot} />
        <Text style={[styles.liveText, { color: '#dc2626' }]}>AO VIVO</Text>
      </View>
    );
  }

  if (status === 'match-ended') {
    return (
      <View style={styles.container} testID="countdown-timer">
        <Text style={[styles.endedText, { color: colors.textSecondary }]}>
          ENCERRADO
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="countdown-timer">
      <MaterialCommunityIcons
        name="television-classic"
        size={20}
        color={colors.primary}
      />
      <Text style={[styles.countdown, { color: colors.textPrimary }]}>
        {timeLeft}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  countdown: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#dc2626',
  },
  liveText: {
    fontSize: 18,
    fontWeight: '800',
  },
  endedText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
