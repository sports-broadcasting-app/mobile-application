import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('runs the action when pressed', () => {
    const onPress = jest.fn();
    render(<Button label="Começar" onPress={onPress} testID="go" />);

    fireEvent.press(screen.getByRole('button', { name: 'Começar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses and says so when disabled', () => {
    const onPress = jest.fn();
    render(
      <Button label="Escolha pelo menos uma" onPress={onPress} disabled />,
    );

    const button = screen.getByRole('button');
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it.each(['secondary', 'plain'] as const)(
    'draws the %s variant',
    (variant) => {
      render(<Button label="Cancelar" variant={variant} icon="close" />);

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    },
  );
});
