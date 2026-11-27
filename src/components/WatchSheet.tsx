import { StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { SheetFrame } from './SheetFrame';
import { Match, Team } from '../types/snapshot';
import { openLink } from '../utils/links';
import { getChannelUrl } from '../utils/broadcast';
import { getTeamName } from '../utils/teamName';
import { spacing } from '../constants/designTokens';

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
    <SheetFrame
      visible={visible}
      onClose={onClose}
      testID="watch-sheet"
      style={styles.sheet}
    >
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
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  sheet: {
    gap: spacing.sm,
  },
  message: {
    marginBottom: spacing.sm,
  },
});
