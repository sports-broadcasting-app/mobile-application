import { render } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { NotificationResponder } from './NotificationResponder';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockNavigationKey: string | undefined = 'root';
let mockPathname = '/';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useRootNavigationState: () => ({ key: mockNavigationKey }),
  usePathname: () => mockPathname,
}));
jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  useLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
}));

function mockResponse(
  data: object,
  action = 'expo.modules.notifications.actions.DEFAULT',
) {
  (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue({
    actionIdentifier: action,
    notification: { request: { content: { data } } },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNavigationKey = 'root';
  mockPathname = '/';
});

describe('NotificationResponder', () => {
  it('opens the match of the tapped reminder once', () => {
    mockResponse({ matchId: '100' });
    render(<NotificationResponder />);
    expect(mockPush).toHaveBeenCalledWith('/match/100');
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalled();
  });

  it('waits for the navigation to be ready', () => {
    mockNavigationKey = undefined;
    mockResponse({ matchId: '100' });
    render(<NotificationResponder />);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('ignores responses without a match or with no tap', () => {
    (Notifications.useLastNotificationResponse as jest.Mock).mockReturnValue(
      null,
    );
    const { rerender } = render(<NotificationResponder />);
    mockResponse({});
    rerender(<NotificationResponder />);
    mockResponse(
      { matchId: '100' },
      'expo.modules.notifications.actions.DISMISS',
    );
    rerender(<NotificationResponder />);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('swaps the open match instead of stacking a second one', () => {
    mockPathname = '/match/99';
    mockResponse({ matchId: '100' });
    render(<NotificationResponder />);
    expect(mockReplace).toHaveBeenCalledWith('/match/100');
    expect(mockPush).not.toHaveBeenCalled();
  });
  it('opens the weekend of a Formula 1 reminder', () => {
    mockResponse({
      matchId: 'session-7238',
      path: '/grand-prix/gp-do-catar-2026',
    });
    render(<NotificationResponder />);
    expect(mockPush).toHaveBeenCalledWith('/grand-prix/gp-do-catar-2026');
  });
});
