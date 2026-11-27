import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CompetitionSlug } from '../src/types/snapshot';
import { parseJson } from '../src/utils/json.ts';
import { collectSerieA } from './brasileirao/collect.ts';
import { addNbaQuarters } from './apiSports/nba.ts';
import { addNflScores } from './bigBalls/nfl.ts';
import { applyBroadcasts, toBroadcastFile } from './broadcasts.ts';
import { collectF1 } from './f1/collect.ts';
import { AGENDA_QUERY } from './f1/parseGe.ts';
import {
  collectWithFallback,
  loadPrevious,
  toPublished,
  type Source,
} from './fallback.ts';
import { staleCompetitions } from './freshness.ts';
import { fetchText, postJson } from './http.ts';
import { collectNba } from './nba/collect.ts';
import { collectNfl } from './nfl/collect.ts';
import { toLegacySnapshot } from './legacy.ts';
import { assertOldBuildsRead } from './oldBuilds.ts';
import { liveCompetitions, planSources } from './schedule.ts';
import { collectSuperliga } from './superliga/collect.ts';
import { assertValidSnapshot } from './validate.ts';

export const SNAPSHOT_FILE = 'onde-passa.json';
/** Read by the first app release; see legacy.ts. */
export const LEGACY_FILE = 'superliga.json';
/** Broadcasters the sources miss (Netflix, Prime Video), curated by hand. */
const BROADCASTS_FILE = new URL('./broadcasts.json', import.meta.url);

/**
 * Usage: collect.ts <output dir> [dir with saved pages, skips the network]
 * Writes onde-passa.json (every competition) and superliga.json (legacy).
 * With PREVIOUS_SNAPSHOT_URL (the published file), a source that fails keeps
 * its competitions from there instead of failing the whole run.
 */
async function main(): Promise<void> {
  const [outputDir, fixturesDir] = process.argv.slice(2);
  if (!outputDir) throw new Error('Missing the output directory');

  const previousUrl = process.env.PREVIOUS_SNAPSHOT_URL;
  const previous =
    previousUrl && !fixturesDir ? await loadPrevious(previousUrl) : null;

  const previousOf = (slug: CompetitionSlug) =>
    previous?.competitions.find((c) => c.slug === slug);

  // Live runs (game windows, started by the Worker) only refresh the listed
  // competitions and only around their games; full runs refresh everything.
  const live = fixturesDir
    ? null
    : liveCompetitions(
        process.env.COLLECT_MODE,
        process.env.COLLECT_COMPETITIONS,
      );
  const liveOptions = { live: live !== null };
  console.log(
    live ? `Live run: ${[...live].join(', ')}` : 'Full run: every competition',
  );

  const sources: Source[] = [
    {
      name: 'Superliga (CBV)',
      slugs: ['masculina', 'feminina'],
      collect: () => collectSuperliga(fixturesDir),
    },
    {
      name: 'Brasileirão (ge)',
      slugs: ['serie-a'],
      collect: async () => [
        await collectSerieA(
          fixturesDir,
          Date.now(),
          previousOf('serie-a'),
          liveOptions,
        ),
      ],
    },
    {
      name: 'NFL (ge)',
      slugs: ['nfl'],
      collect: async () => {
        const nfl = await collectNfl(
          fixturesDir,
          Date.now(),
          previousOf('nfl'),
          liveOptions,
        );
        // Live and quarter scores come from Big Balls (ge has none);
        // offline runs skip it.
        console.log(
          await addNflScores(nfl, previousOf('nfl'), {
            key: fixturesDir ? undefined : process.env.BIGBALLS_KEY,
            now: Date.now(),
            fetchText: (url, key) =>
              fetchText(url, { headers: { 'x-api-key': key } }),
          }),
        );
        return [nfl];
      },
    },
    {
      name: 'NBA (ge)',
      slugs: ['nba'],
      collect: async () => {
        const nba = await collectNba(
          fixturesDir,
          Date.now(),
          previousOf('nba'),
          liveOptions,
        );
        // Quarters come from API-Sports (ge has none); offline runs skip it.
        console.log(
          await addNbaQuarters(nba, previousOf('nba'), {
            key: fixturesDir ? undefined : process.env.API_SPORTS_KEY,
            now: Date.now(),
            fetchText: (url, key) =>
              fetchText(url, { headers: { 'x-apisports-key': key } }),
          }),
        );
        return [nba];
      },
    },
    {
      name: 'Fórmula 1 (ge agenda)',
      slugs: ['f1'],
      collect: async () => [
        await collectF1({
          now: Date.now(),
          previous: previousOf('f1'),
          live: live !== null,
          // Offline runs read f1-agenda-YYYY-MM-DD.json; a missing date is
          // a date without sessions.
          fetchAgenda: (date) =>
            fixturesDir
              ? readFile(
                  join(fixturesDir, `f1-agenda-${date}.json`),
                  'utf8',
                ).catch(() => null)
              : postJson('https://geql.globo.com/graphql', {
                  operationName: 'GetMotorsportAgenda',
                  variables: { date },
                  query: AGENDA_QUERY,
                }),
        }),
      ],
    },
  ];

  const plan = planSources(sources, live, previous);
  const { competitions: collected } = await collectWithFallback(
    plan.collect,
    previous,
  );
  // Same order as the sources, whichever were asked.
  const order: string[] = sources.flatMap((s) => s.slugs);
  const competitions = [...collected, ...plan.kept].sort(
    (a, b) => order.indexOf(a.slug) - order.indexOf(b.slug),
  );
  // On every run, kept competitions included: a live run asks ge for the
  // round again, and ge has no streaming broadcasters.
  const broadcasts = toBroadcastFile(
    parseJson(await readFile(BROADCASTS_FILE, 'utf8')),
  );
  for (const line of applyBroadcasts(competitions, broadcasts)) {
    console.log(line);
  }

  const snapshot = toPublished(new Date().toISOString(), competitions);
  assertValidSnapshot(snapshot);
  const legacy = toLegacySnapshot(snapshot);
  // Builds already installed cannot be fixed: never publish what they reject.
  assertOldBuildsRead({
    'onde-passa.json': snapshot,
    'superliga.json': legacy,
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, SNAPSHOT_FILE), JSON.stringify(snapshot));
  await writeFile(join(outputDir, LEGACY_FILE), JSON.stringify(legacy));

  // Published anyway (the other sources are fresh); the workflow turns the
  // run red after the upload, so a source stuck on old data is noticed.
  const stale = staleCompetitions(competitions, Date.now());
  if (stale.length > 0) {
    console.log(`::warning title=Stale data::${stale.join('; ')}`);
    if (process.env.GITHUB_OUTPUT) {
      await appendFile(
        process.env.GITHUB_OUTPUT,
        `stale=${stale.join('; ')}\n`,
      );
    }
  }

  for (const c of competitions) {
    console.log(
      c.sessions
        ? `${c.name}: ${c.sessions.length} sessions, updated ${c.updatedAt}`
        : `${c.name}: ${c.teams.length} teams, ${c.matches.length} matches, ${c.transfers?.length ?? 0} transfers, updated ${c.updatedAt}`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
