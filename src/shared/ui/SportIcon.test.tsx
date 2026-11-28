import { render, screen } from '@testing-library/react-native';
import { SportIcon } from './SportIcon';
import { Sport } from '@/shared/api/snapshot';

const SPORTS: Sport[] = ['basquete', 'futebol', 'futebol-americano', 'volei'];

describe('SportIcon', () => {
  it.each(SPORTS)('draws %s in both states at the asked size', (sport) => {
    render(
      <>
        <SportIcon sport={sport} size={24} color="#111" testID="outline" />
        <SportIcon
          sport={sport}
          size={40}
          color="#fff"
          filled
          knockoutColor="#16a34a"
          testID="filled"
        />
      </>,
    );
    const hidden = { includeHiddenElements: true };
    expect(screen.getByTestId('outline', hidden)).toBeTruthy();
    expect(screen.getByTestId('filled', hidden)).toBeTruthy();
    // Decorative: the competition name next to it is what gets read.
    expect(screen.queryByTestId('outline')).toBeNull();
  });

  it('gives each soccer ball its own clip id', () => {
    const { toJSON } = render(
      <>
        <SportIcon sport="futebol" size={24} color="#111" />
        <SportIcon sport="futebol" size={24} color="#111" />
      </>,
    );
    const ids = JSON.stringify(toJSON()).match(
      /"clipPath":"(ball[A-Za-z0-9]+)"/g,
    );
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
