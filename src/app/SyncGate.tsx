import { ReactNode } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { IS_STORE_BUILD } from '@/shared/config/buildInfo';
import { HAS_DATA_URL_ENV, DATA_URL } from '@/shared/config/config';
import { useSync } from '@/shared/api/sync/SyncContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import { spacing, typography } from '@/shared/theme/designTokens';
import { Button } from '@/shared/ui/Button';

/** Blocks the app only on the first run, while there is no local data yet. */
export function SyncGate({ children }: { children: ReactNode }) {
  const { phase, refreshing, lastError, refresh } = useSync();
  const { colors } = useTheme();

  if (phase === 'ready') return children;

  const showDetails = () => {
    Alert.alert(
      'Detalhes do erro',
      `${lastError ?? 'Erro desconhecido'}\n\nEXPO_PUBLIC_DATA_URL: ${HAS_DATA_URL_ENV ? 'recebida' : 'não recebida (usando URL padrão)'}\n\nURL: ${DATA_URL}\n\n${new Date().toISOString()}`,
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {phase === 'loading' || refreshing ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText tone="secondary" style={styles.message}>
            Buscando os jogos...
          </AppText>
        </>
      ) : (
        <>
          <AppText tone="secondary" style={styles.message}>
            Não foi possível carregar os dados. Verifique sua conexão.
          </AppText>
          <Button label="Tentar novamente" onPress={refresh} />
          {/* The data URL and env flags help us debug; store users get
              nothing from them. */}
          {!IS_STORE_BUILD && (
            <Button
              label="Ver detalhes"
              variant="plain"
              onPress={showDetails}
            />
          )}
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
});
