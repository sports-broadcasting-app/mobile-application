import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../contexts/ThemeContext';
import { Match, Team } from '../types/snapshot';
import { getChannelUrl } from '../utils/broadcast';
import { getTeamName } from '../utils/teamName';
import {
  iconSize,
  radius,
  spacing,
  typography,
} from '../constants/designTokens';

interface WatchSheetProps {
  match: Match | null;
  homeTeam?: Team;
  awayTeam?: Team;
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
    Linking.openURL(url).catch(() => {});
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>

        {channels.map(({ name, url }) =>
          url ? (
            <TouchableOpacity
              key={name}
              accessibilityRole="button"
              testID={`watch-open-${name}`}
              style={[styles.primary, { backgroundColor: colors.watchBtnBg }]}
              onPress={() => open(url)}
            >
              <MaterialCommunityIcons
                name="open-in-app"
                size={iconSize.md}
                color={colors.watchBtnText}
              />
              <Text
                style={[styles.primaryText, { color: colors.watchBtnText }]}
              >
                Abrir {name}
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              key={name}
              style={[styles.primary, { backgroundColor: colors.surfaceAlt }]}
            >
              <MaterialCommunityIcons
                name="television-classic"
                size={iconSize.md}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.primaryText, { color: colors.textSecondary }]}
              >
                {name} (sem app)
              </Text>
            </View>
          ),
        )}

        <TouchableOpacity
          accessibilityRole="button"
          testID="watch-details"
          style={[styles.secondary, { borderColor: colors.border }]}
          onPress={() => {
            if (match) onDetails(match);
          }}
        >
          <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>
            Ver detalhes do jogo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          testID="watch-cancel"
          style={styles.cancel}
          onPress={onClose}
        >
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
            Cancelar
          </Text>
        </TouchableOpacity>
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
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  message: {
    fontSize: typography.size.body,
    marginBottom: spacing.sm,
  },
  primary: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  primaryText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  secondary: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
  },
  secondaryText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
  },
});
