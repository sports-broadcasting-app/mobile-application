# Where to Watch

Mobile app that shows where Superliga volleyball matches (men's and women's) are broadcast, with matches for yesterday, today and tomorrow, standings and one favorite team per competition.

There is no login and no backend. On first run the app downloads a static JSON and stores everything on the device in SQLite, so it keeps working offline.

## Running

```bash
yarn install
yarn start
yarn test
```

## Data

`.github/workflows/superliga-data.yml` runs `scripts/superliga/collect.ts` every 2 hours and publishes `superliga.json` to GitHub Pages. The app reads it from `EXPO_PUBLIC_SUPERLIGA_DATA_URL`.

Check that the source allows this use before publishing the app. See `CLAUDE.md` for the architecture and conventions.
