import { getChannelUrl } from '../utils/broadcast';

describe('getChannelUrl', () => {
  it('maps the Superliga channels', () => {
    expect(getChannelUrl('GE TV')).toContain('youtube.com');
    expect(getChannelUrl('SporTV 2')).toContain('globoplay');
  });

  it('has no link for an unknown channel', () => {
    expect(getChannelUrl('Canal X')).toBeNull();
  });
});
