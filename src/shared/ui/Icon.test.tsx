import { Path } from 'react-native-svg';
import { render, screen } from '@/test/utils';
import { Icon } from './Icon';
import { ICON_PATHS } from './icons';

describe('Icon', () => {
  it('draws the named glyph at the size and color asked', () => {
    render(<Icon name="star" size={20} color="#16a34a" testID="icon" />);
    const svg = screen.getByTestId('icon', { includeHiddenElements: true });
    expect(svg.props.width).toBe(20);
    expect(svg.props.height).toBe(20);
    const path = screen.UNSAFE_getByType(Path);
    expect(path.props.d).toBe(ICON_PATHS.star);
    expect(path.props.fill).toBe('#16a34a');
  });

  it('keeps every glyph on the 24 pt grid', () => {
    for (const d of Object.values(ICON_PATHS)) {
      const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...numbers)).toBeLessThanOrEqual(24);
    }
  });
});
