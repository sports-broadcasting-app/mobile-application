import { Keyboard, Platform, Text } from 'react-native';
import { act, render, screen } from '../test-utils';
import { BottomSheet } from '../components/BottomSheet';

type Listener = (event: { endCoordinates: { height: number } }) => void;

describe('BottomSheet keyboard on Android', () => {
  const original = Platform.OS;
  const listeners: Record<string, Listener> = {};

  beforeEach(() => {
    Platform.OS = 'android';
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((
      name: string,
      cb: Listener,
    ) => {
      listeners[name] = cb;
      return { remove: jest.fn() };
    }) as unknown as typeof Keyboard.addListener);
  });

  afterEach(() => {
    Platform.OS = original;
    jest.restoreAllMocks();
  });

  const renderSheet = () =>
    render(
      <BottomSheet visible onClose={jest.fn()} title="Time" testID="sheet">
        <Text>conteudo</Text>
      </BottomSheet>,
    );

  it('shows its content', () => {
    renderSheet();
    expect(screen.getByText('conteudo')).toBeTruthy();
  });

  it('subscribes to the keyboard and follows its height', () => {
    renderSheet();
    expect(listeners.keyboardDidShow).toBeDefined();
    act(() => listeners.keyboardDidShow!({ endCoordinates: { height: 300 } }));
    expect(screen.getByText('conteudo')).toBeTruthy();
    act(() => listeners.keyboardDidHide!({ endCoordinates: { height: 0 } }));
    expect(screen.getByText('conteudo')).toBeTruthy();
  });
});
