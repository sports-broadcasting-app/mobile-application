import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './Button';
import { Match, Team } from '../types/snapshot';
import { openLink } from '../utils/links';
import { getChannelUrl } from '../utils/broadcast';
import { getTeamName } from '../utils/teamName';
import { radius, spacing } from '../constants/designTokens';

interface WatchSheetProps {
  match: Match | null;
  homeTeam?: Team | undefined;
  awayTeam?: Team | undefined;
  onClose: () => void;
  onDetails: (match: Match) => void;
}

/**
 * Bottom sheet shown when a match is tapped: offers to open the app of each
 * broadcaster (via its universal link) or to see the match detail.
 */
export function WatchSheet({
  match,
  homeTeam,
  awayTeam,
  onClose,
  onDetails,
}: WatchSheetProps) {
  const { colors } = useTheme();
  const visible = match !== null;

  const channels = (match?.channels ?? []).map((name) => ({
    name,
    url: getChannelUrl(name),
  }));
  const hasApp = channels.some((channel) => channel.url !== null);

  const title = !match
    ? ''
    : homeTeam && awayTeam
      ? `${getTeamName(homeTeam.name)} x ${getTeamName(awayTeam.name)}`
      : 'Jogo';

  const message =
    channels.length === 0
      ? 'A transmissão deste jogo ainda não foi definida.'
      : hasApp
        ? 'Quer abrir o app onde o jogo vai passar?'
        : `Este jogo passa em ${channels.map((c) => c.name).join(' e ')}.`;

  const open = (url: string) => {
    onClose();
    openLink(url);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlayBg }]}
        onPress={onClose}
        testID="watch-sheet-backdrop"
      />
      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <AppText variant="heading">{title}</AppText>
        <AppText variant="body" tone="secondary" style={styles.message}>
          {message}
        </AppText>

        {channels.map(({ name, url }) =>
          url ? (
            <Button
              key={name}
              label={`Abrir ${name}`}
              icon="open-in-app"
              testID={`watch-open-${name}`}
              onPress={() => open(url)}
            />
          ) : (
            <Button
              key={name}
              label={`${name} (sem app)`}
              icon="television-classic"
              disabled
            />
          ),
        )}

        <Button
          label="Ver detalhes do jogo"
          variant="secondary"
          testID="watch-details"
          onPress={() => {
            if (match) onDetails(match);
          }}
        />

        <Button
          label="Cancelar"
          variant="plain"
          testID="watch-cancel"
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.md,
    width: 40,
  },
  message: {
    marginBottom: spacing.sm,
  },
});
