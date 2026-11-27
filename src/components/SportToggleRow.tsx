import { StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Sport } from '../types/snapshot';
import { IconTile } from './IconTile';
import { SportIcon } from './SportIcon';
import { SwitchRow } from './SwitchRow';
import { iconSize, touchTarget } from '../constants/designTokens';

interface SportToggleRowProps {
  sport: Sport;
  name: string;
  /** Under the name, such as the single competition and your team. */
  detail?: string | null;
  on: boolean;
  /** The last followed sport cannot be switched off. */
  locked: boolean;
  onChange: (next: boolean) => void;
  accessibilityLabel: string;
  /** The settings card: smaller tile, and the name greys out when off. */
  compact?: boolean;
}

/** A sport with its switch, as the sheet and the settings list them. */
export function SportToggleRow({
  sport,
  name,
  detail,
  on,
  locked,
  onChange,
  accessibilityLabel,
  compact = false,
}: SportToggleRowProps) {
  const { colors } = useTheme();
  return (
    <SwitchRow
      leading={
        <IconTile size={compact ? 34 : 36}>
          <SportIcon
            sport={sport}
            size={iconSize.md}
            color={colors.textSecondary}
          />
        </IconTile>
      }
      label={name}
      labelVariant={compact ? 'label' : 'labelStrong'}
      labelTone={compact && !on ? 'secondary' : 'primary'}
      detail={detail}
      value={on}
      disabled={on && locked}
      onValueChange={onChange}
      accessibilityLabel={accessibilityLabel}
      testID={`follow-sport-${sport}`}
      style={compact ? styles.compact : styles.row}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
  },
  compact: {
    minHeight: touchTarget + 4,
  },
});
