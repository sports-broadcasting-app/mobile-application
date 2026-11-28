import { Platform, StyleSheet, View } from 'react-native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { AppText } from './AppText';
import { fireEvent, render, screen } from '@/test/utils';
import { lightTheme } from '@/shared/theme/theme';
import {
  GlassTabBar,
  TAB_BAR_HEIGHT,
  tabBarBottom,
  useTabBarSpace,
} from './GlassTabBar';
import { GlassSurface, glassMaterial } from './GlassSurface';
import { TabBarButton } from './TabBarButton';

jest.mock('expo-glass-effect', () => {
  const { View: MockView } = jest.requireActual('react-native');
  return {
    GlassView: (props: object) => <MockView {...props} testID="glass-view" />,
    isLiquidGlassAvailable: jest.fn(() => false),
  };
});

jest.mock('expo-blur', () => {
  const { View: MockView } = jest.requireActual('react-native');
  return {
    BlurView: (props: object) => <MockView testID="blur-view" {...props} />,
  };
});

const liquidGlass = jest.mocked(isLiquidGlassAvailable);
const flat = (style: unknown) => StyleSheet.flatten(style as never) ?? {};
const icon = { uri: 'icon.png' };
const selectedIcon = { uri: 'icon-fill.png' };

describe('TabBarButton', () => {
  it('shows only the icon on an inactive tab, named for screen readers', () => {
    render(
      <TabBarButton
        label="Classificação"
        icon={icon}
        selectedIcon={selectedIcon}
      />,
    );
    expect(
      screen.getByRole('tab', { name: 'Classificação', selected: false }),
    ).toBeTruthy();
    expect(screen.queryByText('Classificação')).toBeNull();
  });

  it('shows the name and the filled icon in primary on the active tab', () => {
    render(
      <TabBarButton
        label="Jogos"
        icon={icon}
        selectedIcon={selectedIcon}
        isFocused
      />,
    );
    expect(
      screen.getByRole('tab', { name: 'Jogos', selected: true }),
    ).toBeTruthy();
    expect(screen.getByText('Jogos')).toBeTruthy();
    const glyph = screen.UNSAFE_getByProps({ source: selectedIcon });
    expect(flat(glyph.props.style).tintColor).toBe(lightTheme.primary);
  });

  it('tints the outline icon with the control color when inactive', () => {
    render(
      <TabBarButton label="Jogos" icon={icon} selectedIcon={selectedIcon} />,
    );
    const glyph = screen.UNSAFE_getByProps({ source: icon });
    expect(flat(glyph.props.style).tintColor).toBe(lightTheme.controlText);
  });

  it('lets inactive tabs share the width while the active one fits its name', () => {
    render(
      <>
        <TabBarButton
          label="Jogos"
          icon={icon}
          selectedIcon={selectedIcon}
          isFocused
        />
        <TabBarButton
          label="Classificação"
          icon={icon}
          selectedIcon={selectedIcon}
        />
      </>,
    );
    const style = (name: string) =>
      flat(screen.getByRole('tab', { name }).props.style);
    expect(style('Classificação').flex).toBe(1);
    expect(style('Jogos').flex).toBeUndefined();
    expect(style('Jogos').flexShrink).toBe(0);
  });

  it('passes presses and long presses on', () => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    render(
      <TabBarButton
        label="Jogos"
        icon={icon}
        selectedIcon={selectedIcon}
        onPress={onPress}
        onLongPress={onLongPress}
      />,
    );
    fireEvent.press(screen.getByRole('tab'));
    fireEvent(screen.getByRole('tab'), 'longPress');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});

describe('GlassTabBar', () => {
  it('floats a little into the bottom inset, never closer than 12', () => {
    expect(tabBarBottom(34)).toBe(26);
    expect(tabBarBottom(0)).toBe(12);
  });

  it('sits over the screens as a wide tab list', () => {
    render(
      <GlassTabBar>
        <TabBarButton label="Jogos" icon={icon} selectedIcon={selectedIcon} />
      </GlassTabBar>,
    );
    expect(
      screen.UNSAFE_getByProps({ accessibilityRole: 'tablist' }),
    ).toBeTruthy();
    // The test safe area has a 34 pt home indicator.
    const dock = screen.UNSAFE_getByProps({ pointerEvents: 'box-none' });
    expect(flat(dock.props.style)).toMatchObject({
      position: 'absolute',
      bottom: 26,
      // As wide as the screen less 20 pt on each side.
      left: 20,
      right: 20,
    });
  });

  it('leaves room at the end of the scroll for the bar', () => {
    function Probe() {
      return <AppText>{String(useTabBarSpace())}</AppText>;
    }
    render(<Probe />);
    expect(screen.getByText(String(26 + TAB_BAR_HEIGHT + 16))).toBeTruthy();
  });
});

describe('GlassSurface', () => {
  const os = Platform.OS;
  const version = Platform.Version;

  afterEach(() => {
    Platform.OS = os;
    Object.defineProperty(Platform, 'Version', { value: version });
    liquidGlass.mockReturnValue(false);
  });

  const onAndroid = (api: number) => {
    Platform.OS = 'android';
    Object.defineProperty(Platform, 'Version', { value: api });
  };

  it('uses Liquid Glass on iOS 26', () => {
    Platform.OS = 'ios';
    liquidGlass.mockReturnValue(true);
    expect(glassMaterial()).toBe('liquid-glass');
    render(<GlassSurface />);
    expect(screen.getByTestId('glass-view').props.colorScheme).toBe('light');
  });

  it('blurs on older iOS and on Android 12+, with the theme glass fill', () => {
    Platform.OS = 'ios';
    expect(glassMaterial()).toBe('blur');
    onAndroid(33);
    expect(glassMaterial()).toBe('blur');
    const target = { current: null };
    render(<GlassSurface blurTarget={target} />);
    expect(screen.getByTestId('blur-view').props.blurTarget).toBe(target);
    const fills = screen
      .UNSAFE_getAllByType(View)
      .map((view) => flat(view.props.style).backgroundColor);
    expect(fills).toContain(lightTheme.glass);
  });

  it('falls back to the plain surface below Android 12', () => {
    onAndroid(30);
    expect(glassMaterial()).toBe('solid');
    render(<GlassSurface />);
    expect(screen.queryByTestId('blur-view')).toBeNull();
    expect(flat(screen.getByTestId('glass-surface').props.style)).toMatchObject(
      {
        backgroundColor: lightTheme.surface,
      },
    );
  });
});
