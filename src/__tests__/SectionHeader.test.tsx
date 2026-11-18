import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SectionHeader } from '../components/SectionHeader';

describe('SectionHeader', () => {
  it('announces the title as a header', () => {
    render(<SectionHeader title="Aparência" />);

    expect(screen.getByRole('header', { name: 'Aparência' })).toBeTruthy();
  });

  it('shows the icon and the detail after the title', () => {
    render(
      <SectionHeader
        title="Superliga Feminina"
        detail="2 jogos"
        icon={<Text>★</Text>}
        testID="section"
      />,
    );

    expect(screen.getByTestId('section')).toHaveTextContent(
      /★Superliga Feminina· 2 jogos/,
    );
  });
});
