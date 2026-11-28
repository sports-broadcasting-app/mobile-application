import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ICON_PATHS, type IconName } from './icons';

type Props = {
  name: IconName;
  size: number;
  color: string;
  style?: StyleProp<ViewStyle> | undefined;
  testID?: string | undefined;
};

/**
 * One of the app's icons, drawn with react-native-svg in a single color.
 * Decorative: what it means is said by the text or label next to it.
 */
export function Icon({ name, size, color, style, testID }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      {...(testID ? { testID } : {})}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={ICON_PATHS[name]} fill={color} />
    </Svg>
  );
}
