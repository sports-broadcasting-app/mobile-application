import { Platform, Switch, type SwitchProps } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

/**
 * The app's switch: `primary` track when on. Android also needs the thumb,
 * or it keeps the system accent (teal); it takes `controlThumb`, white in both
 * modes like iOS (the dark-mode `onPrimary` made an "on" switch look off).
 * Off keeps the system thumb; iOS is untouched.
 */
export function ThemedSwitch(props: SwitchProps) {
  const { colors } = useTheme();
  const thumbColor =
    Platform.OS === 'android' && props.value ? colors.controlThumb : undefined;
  return (
    <Switch
      trackColor={{ true: colors.primary }}
      thumbColor={thumbColor}
      {...props}
    />
  );
}
