import { ReactNode } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import {
  HAS_SUPERLIGA_DATA_URL_ENV,
  SUPERLIGA_DATA_URL,
} from '../constants/config';
import { useSync } from '../contexts/SyncContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography } from '../constants/designTokens';

/** Blocks the app only on the first run, while there is no local data yet. */
export function SyncGate({ children }: { children: ReactNode }) {
  const { phase, refreshing, lastError, refresh } = useSync();
  const { colors } = useTheme();

  if (phase === 'ready') return children;

  const showDetails = () => {
    Alert.alert(
      'Detalhes do erro',
      `${lastError ?? 'Erro desconhecido'}\n\nEXPO_PUBLIC_SUPERLIGA_DATA_URL: ${HAS_SUPERLIGA_DATA_URL_ENV ? 'recebida' : 'nao recebida (usando URL padrao)'}\n\nURL: ${SUPERLIGA_DATA_URL}\n\n${new Date().toISOString()}`,
    );
  };

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
          <Text
            accessibilityRole="button"
            style={[styles.details, { color: colors.textTertiary }]}
            onPress={showDetails}
          >
            Ver detalhes
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
  details: {
    fontSize: typography.size.sm,
  },
  retry: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
  },
});
