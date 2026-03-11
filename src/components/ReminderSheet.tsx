import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TeamMatch } from '../types/match';
import { useTheme } from '../contexts/ThemeContext';
import { ReminderTiming, TIMING_LABELS } from '../hooks/useReminderPreferences';
import {
  spacing,
  radius,
  typography,
  iconSize,
} from '../constants/designTokens';

interface ReminderSheetProps {
  visible: boolean;
  match: TeamMatch | null;
  selectedTiming: ReminderTiming | null;
  onSelect: (timing: ReminderTiming) => void;
  onCancel: () => void;
}

export function ReminderSheet({
  visible,
  match,
  selectedTiming,
  onSelect,
  onCancel,
}: ReminderSheetProps) {
  const { colors } = useTheme();

  if (!match) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      testID="reminder-sheet-modal"
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.overlayBg }]}
        onPress={onCancel}
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={iconSize.lg}
              color={colors.primary}
            />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {match.homeTeam.name} x {match.awayTeam.name}
            </Text>
          </View>

          {TIMING_LABELS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.option, { borderBottomColor: colors.borderLight }]}
              onPress={() => onSelect(key)}
              testID={`reminder-option-${key}`}
            >
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                {label}
              </Text>
              {selectedTiming === key && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={iconSize.md}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            testID="reminder-cancel"
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: typography.size.md,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  cancelText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});
