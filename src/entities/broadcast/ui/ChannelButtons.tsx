import { StyleSheet } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { getChannelUrl } from '../lib/broadcast';
import { openChannel } from '../lib/broadcast';

interface ChannelButtonsProps {
  channels: string[];
  /** `secondary` with a play icon inside a highlighted card. */
  variant?: 'primary' | 'secondary';
  /** Centers "Transmissão a definir" (match detail). */
  centered?: boolean;
}

/**
 * "Assistir no X" for each channel, opening its app or site; a channel with
 * no known link shows its name, disabled. None yet: "Transmissão a definir".
 * Returns siblings: the parent sets the gap.
 */
export function ChannelButtons({
  channels,
  variant = 'primary',
  centered = false,
}: ChannelButtonsProps) {
  if (channels.length === 0) {
    return (
      <AppText tone="secondary" style={centered && styles.centered}>
        Transmissão a definir
      </AppText>
    );
  }
  return (
    <>
      {channels.map((channel) => {
        const url = getChannelUrl(channel);
        return (
          <Button
            key={channel}
            variant={variant}
            icon={variant === 'secondary' ? 'play' : undefined}
            label={url ? `Assistir no ${channel}` : channel}
            disabled={!url}
            onPress={() => openChannel(channel)}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    textAlign: 'center',
  },
});
