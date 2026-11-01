import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSync } from '../contexts/SyncContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography } from '../constants/designTokens';

/** Blocks the app only on the first run, while there is no local data yet. */
export function SyncGate({ children }: { children: ReactNode }) {
  const { phase, refreshing, refresh } = useSync();
  const { colors } = useTheme();

  if (phase === 'ready') return children;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {phase === 'loading' || refreshing ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Buscando os jogos da Superliga...
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Nao foi possivel carregar os dados. Verifique sua conexao.
          </Text>
          <Text
            accessibilityRole="button"
            style={[styles.retry, { color: colors.primary }]}
            onPress={refresh}
          >
            Tentar novamente
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  message: {
    fontSize: typography.size.md,
    textAlign: 'center',
  },
  retry: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
});
