---
name: release
description: Prepare a new store release of Onde Passa (iOS and Android) — check the version, run the quality gates, write the App Store / Play texts (What's New, promotional text, description) and give the build commands. Use when the user says they want to release, ship, publish a version or generate a new build.
---

# Release Onde Passa

Work through the steps in order and stop at each point that needs the user. Never commit, push, build or submit without the user's go-ahead.

## 1. Where we are

```bash
git fetch -q && git status -sb
git log --oneline origin/main -15
git describe --tags --abbrev=0 2>/dev/null
grep '"version"' app.json
```

- Releases are built from `main`. If the work is on another branch, it must be merged first (PR).
- Find what changed since the last release: the commits since the last version bump of `app.json` (`git log -L '/"version"/,+1:app.json' --oneline`) or the last tag.

## 2. Version

- `app.json` `expo.version` is the marketing version and **must match the version open in App Store Connect** ("Prepare for Submission"). Ask the user which version is open there; a build with another version does not show up for selection.
- Build numbers are remote (`appVersionSource: remote`, production `autoIncrement`): never edit `buildNumber` or `versionCode`.
- Bump: new feature → minor (1.3.0 → 1.4.0); fixes only → patch.
- If the version needs to change, propose the commit on a branch and wait for approval.

## 3. Quality gates

```bash
yarn test
yarn type-check
yarn lint
yarn format:check
```

All must pass. Report failures with their output; do not move on.

If the release changes the snapshot contract (`src/types/snapshot.ts`) or a data table, check `SCHEMA_VERSION` in `src/data/database.ts` was bumped, and that the published JSON (https://dados.onde-passa.app/onde-passa.json) already carries what the new build expects.

## 4. Native or OTA?

- Native change (new package, `app.json` plugin, permissions, icons) → full `eas build`.
- JS only → an `eas update --channel production` is enough; say so, since it skips store review.

## 5. Store texts (pt-BR)

Write them for the store reader, from the user-visible changes found in step 1, and show them ready to paste:

- **Promotional text**: up to 170 characters, leads with the headline feature. Give the count.
- **What's New**: headline feature first ("Novidade: …"), bullets of what the user can do, then "Também nesta versão:" with smaller items. Only what is new **in this version**; never repeat the previous release. If a new competition was added, add a line telling existing users to turn it on in Configurações › Competições e times (followed competitions are stored, so new ones are off for users who customized).
- **Description**: update only what changed (competitions list grouped by sport, features). Keep the closing disclaimer (independent, not affiliated, broadcast info may change).
- Do not name broadcasters you have not seen in the published data.

## 6. Build

Run sequentially, never in parallel (local builds share the machine):

```bash
git checkout main && git pull
eas build --platform ios --profile production --local --non-interactive --output builds/onde-passa-ios.ipa
eas build --platform android --profile production --local --non-interactive --output builds/onde-passa-android.aab
```

For a test APK instead: `eas build --platform android --profile preview`.

## 7. Wrap up

Summarize: version, gates passed, native vs OTA, the store texts, and the build commands or their result. Suggest tagging the release (`git tag v<version> && git push origin v<version>`) and wait for approval before doing it.
