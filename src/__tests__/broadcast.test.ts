import { getChannelUrl } from '../utils/broadcast';

describe('getChannelUrl', () => {
  it('maps the Superliga channels', () => {
    expect(getChannelUrl('GE TV')).toContain('youtube.com');
    expect(getChannelUrl('SporTV 2')).toContain('globoplay');
  });

  it('maps the Brasileirão channels', () => {
    expect(getChannelUrl('Premiere')).toContain('globoplay');
    expect(getChannelUrl('TV Globo')).toContain('globoplay');
    expect(getChannelUrl('Prime Video')).toContain('primevideo');
    expect(getChannelUrl('CazéTV')).toContain('youtube.com/@CazeTV');
    expect(getChannelUrl('Record')).toContain('playplus');
  });

  it('has no link for an unknown channel', () => {
    expect(getChannelUrl('Canal X')).toBeNull();
  });
});
