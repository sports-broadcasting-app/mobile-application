import { StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { fireEvent, render, screen } from '../test-utils';
import { AppText } from '../components/AppText';
import { BroadcasterPill } from '../components/BroadcasterPill';
import { Card } from '../components/Card';
import { ChannelButtons } from '../components/ChannelButtons';
import { Checkbox } from '../components/Checkbox';
import { CheckRow } from '../components/CheckRow';
import { IconTile } from '../components/IconTile';
import { ScheduleRow } from '../components/ScheduleRow';
import { SportToggleRow } from '../components/SportToggleRow';
import { SwitchRow } from '../components/SwitchRow';
import { openChannel, openLink } from '../utils/links';
import { lightTheme } from '../constants/theme';
import { maxFontScale, typography } from '../constants/designTokens';

jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
}));

const flat = (style: unknown) => StyleSheet.flatten(style as never);
const styles = StyleSheet.create({ score: { fontSize: 40 } });

beforeEach(() => {
  (Linking.openURL as jest.Mock).mockClear();
});

describe('AppText', () => {
  it('takes size and weight from the variant and color from the tone', () => {
    render(
      <AppText variant="label" tone="secondary">
        Superliga
      </AppText>,
    );
    expect(flat(screen.getByText('Superliga').props.style)).toMatchObject({
      fontSize: typography.size.md,
      fontWeight: typography.weight.semibold,
      color: lightTheme.textSecondary,
    });
  });

  it('caps font scaling only when asked, and lets style win', () => {
    render(
      <AppText capped style={styles.score}>
        3 x 1
      </AppText>,
    );
    const text = screen.getByText('3 x 1');
    expect(text.props.maxFontSizeMultiplier).toBe(maxFontScale);
    expect(flat(text.props.style).fontSize).toBe(40);
  });

  it('leaves the color to the outer text when inherited', () => {
    render(<AppText tone="inherit">dentro</AppText>);
    expect(flat(screen.getByText('dentro').props.style).color).toBeUndefined();
  });
});

describe('Checkbox and CheckRow', () => {
  it('fills the box when checked', () => {
    render(<Checkbox checked />);
    const box = screen.toJSON() as unknown as { props: { style: unknown } };
    expect(flat(box.props.style).backgroundColor).toBe(lightTheme.primary);
  });

  it('toggles on press and says its state', () => {
    const onToggle = jest.fn();
    render(
      <CheckRow
        label="Superliga Feminina"
        detail="Seu time: Minas"
        checked={false}
        onToggle={onToggle}
        testID="row"
      />,
    );
    expect(screen.getByText('Seu time: Minas')).toBeTruthy();
    expect(screen.getByTestId('row').props.accessibilityState).toMatchObject({
      checked: false,
    });
    fireEvent.press(screen.getByTestId('row'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('keeps a locked row checked and explains why', () => {
    const onToggle = jest.fn();
    render(
      <CheckRow
        label="Brasileirão"
        checked
        locked
        onToggle={onToggle}
        testID="row"
      />,
    );
    fireEvent.press(screen.getByTestId('row'));
    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.getByTestId('row').props.accessibilityHint).toMatch(
      /Acompanhe outra/,
    );
  });
});

describe('SwitchRow and SportToggleRow', () => {
  it('reports the new value', () => {
    const onChange = jest.fn();
    render(
      <SwitchRow
        label="Corrida"
        detail="Domingo"
        value={false}
        onValueChange={onChange}
        accessibilityLabel="Avisar antes de Corrida"
        testID="switch"
      />,
    );
    fireEvent(screen.getByTestId('switch'), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('Domingo')).toBeTruthy();
  });

  it('locks the last followed sport on', () => {
    render(
      <SportToggleRow
        sport="volei"
        name="Vôlei"
        on
        locked
        onChange={jest.fn()}
        accessibilityLabel="Acompanhar Vôlei"
      />,
    );
    expect(screen.getByTestId('follow-sport-volei').props.disabled).toBe(true);
  });
});

describe('IconTile and Card', () => {
  it('wrap their content', () => {
    render(
      <Card testID="card">
        <IconTile>
          <AppText>ícone</AppText>
        </IconTile>
      </Card>,
    );
    expect(flat(screen.getByTestId('card').props.style)).toMatchObject({
      backgroundColor: lightTheme.surface,
    });
    expect(screen.getByText('ícone')).toBeTruthy();
  });
});

describe('ScheduleRow and BroadcasterPill', () => {
  const row = (props: Partial<Parameters<typeof ScheduleRow>[0]>) =>
    render(
      <ScheduleRow
        when="sex 27 · 18:30"
        title="Sesi Bauru × São José"
        accessibilityLabel="Sesi Bauru contra São José"
        testID="row"
        {...props}
      />,
    );

  it('shows the first channel as a pill', () => {
    row({ channel: 'SporTV 2' });
    expect(screen.getByTestId('broadcaster-pill-SporTV 2')).toBeTruthy();
    expect(screen.queryByText('a definir')).toBeNull();
  });

  it('says "a definir" without a channel, unless told not to', () => {
    row({});
    expect(screen.getByText('a definir')).toBeTruthy();
    screen.unmount();
    row({ showTbd: false });
    expect(screen.queryByText('a definir')).toBeNull();
  });

  it('is a button only with an action', () => {
    const onPress = jest.fn();
    row({ onPress, accessibilityHint: 'Abre os detalhes do jogo' });
    fireEvent.press(screen.getByTestId('row'));
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByTestId('row').props.accessibilityHint).toBe(
      'Abre os detalhes do jogo',
    );
  });

  it('draws the pill in two sizes', () => {
    render(
      <>
        <BroadcasterPill name="GE TV" />
        <BroadcasterPill name="Premiere" size="md" />
      </>,
    );
    expect(
      flat(screen.getByTestId('broadcaster-pill-Premiere').props.style)
        .maxWidth,
    ).toBe(96);
    expect(
      flat(screen.getByTestId('broadcaster-pill-GE TV').props.style).maxWidth,
    ).toBeUndefined();
  });
});

describe('ChannelButtons and links', () => {
  it('says the broadcast is not known yet', () => {
    render(<ChannelButtons channels={[]} />);
    expect(screen.getByText('Transmissão a definir')).toBeTruthy();
  });

  it('opens the channel app, and disables a channel without one', () => {
    render(<ChannelButtons channels={['SporTV', 'Canal Local']} />);
    fireEvent.press(screen.getByText('Assistir no SporTV'));
    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://globoplay.globo.com/',
    );
    fireEvent.press(screen.getByText('Canal Local'));
    expect(Linking.openURL).toHaveBeenCalledTimes(1);
  });

  it('opens links and ignores a failure', async () => {
    (Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error('no app'));
    expect(() => openLink('https://example.com')).not.toThrow();
    expect(openChannel('Netflix')).toBe(true);
    expect(openChannel('Rádio')).toBe(false);
  });
});
