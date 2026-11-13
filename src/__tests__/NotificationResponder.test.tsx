import { render } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { NotificationResponder } from '../components/NotificationResponder';

const mockPush = jest.fn();
let mockNavigationKey: string | undefined = 'root';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRootNavigationState: () => ({ key: mockNavigationKey }),
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
});
