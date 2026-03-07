# Where to Watch

Mobile app that shows where to watch live sports on TV and streaming platforms in Brazil.

## What it does

- Shows today's football and volleyball matches with broadcast info (TV channels and streaming apps)
- Highlights live matches and upcoming games
- Browse by championship or sport
- Set a favorite team and receive push notifications 30 minutes before their matches
- Dark/light mode support

## Tech Stack

- **React Native** with Expo SDK 55
- **TypeScript** (strict mode)
- **Expo Router** for navigation
- **Expo Notifications** + Firebase Cloud Messaging for push notifications
- **EAS Build** + **EAS Update** for builds and OTA updates

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- Expo CLI (`npm install --global eas-cli`)
- Expo Go app on your device (for development)

### Installation

```bash
yarn install
```

### Running

```bash
yarn start
```

Scan the QR code with Expo Go or use a development build.

### Testing

```bash
yarn test
```

### Linting

```bash
yarn lint
```

## Build & Deploy

```bash
# Development build
eas build --platform android --profile development

# Production build
eas build --platform android --profile production

# OTA update (JS-only changes, no rebuild needed)
eas update --channel development --message "description"
```

## How Notifications Work

1. User selects a favorite team in the app
2. App registers the Expo push token on the backend
3. Backend crawls match schedules daily (6am and 6pm)
4. 30 minutes before a match, the backend sends a push notification via Expo Push Service

The backend runs on Fly.io and uses `expo-server-sdk` to deliver notifications through FCM (Android) and APNs (iOS).

## Project Structure

```
app/            # Expo Router file-based routes (tabs + stack screens)
src/
  components/   # Reusable UI components
  contexts/     # React contexts (Theme, FavoriteTeam)
  hooks/        # Custom hooks
  services/     # API calls and notification services
  types/        # TypeScript type definitions
  constants/    # Theme colors, API config
  utils/        # Pure utility functions
```

## API

The app consumes a crawler backend API:

- `GET /api/matches/today` — Today's matches (optional `?sport=football|volleyball`)
- `POST /api/subscribers` — Register for push notifications
- `DELETE /api/subscribers/:pushToken` — Unregister from notifications
