import { act, fireEvent, render, screen } from '../test-utils';
import { AdsConsent } from 'react-native-google-mobile-ads';
import { AdBanner } from '../components/AdBanner';
import { AdsProvider } from '../contexts/AdsContext';

const getConsentInfo = AdsConsent.getConsentInfo as jest.Mock;

function renderWithAds() {
  return render(
    <AdsProvider>
      <AdBanner />
    </AdsProvider>,
  );
}

describe('AdBanner', () => {
  beforeEach(() => {
    getConsentInfo.mockResolvedValue({ canRequestAds: true });
  });

  it('shows a test banner outside store builds once ads are ready', async () => {
    renderWithAds();
    const banner = await screen.findByTestId('banner-ad');
    expect(banner.props.unitId).toBe('test-adaptive-banner');
  });

  it('shows nothing before the ads SDK is ready', () => {
    render(<AdBanner />);
    expect(screen.queryByTestId('ad-banner')).toBeNull();
  });

  it('shows nothing when there is no consent', async () => {
    getConsentInfo.mockResolvedValue({ canRequestAds: false });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithAds();
    await act(async () => {});
    expect(screen.queryByTestId('ad-banner')).toBeNull();
  });

  it('collapses when the ad fails to load', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    renderWithAds();
    fireEvent(
      await screen.findByTestId('banner-ad'),
      'adFailedToLoad',
      new Error('No ad to show'),
    );
    expect(screen.queryByTestId('ad-banner')).toBeNull();
  });
});
