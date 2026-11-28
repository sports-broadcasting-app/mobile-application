import bundledTransfers from '../../../../scripts/superliga/transfers.json';
import {
  resolveTransfers,
  toTransferFile,
} from '../../../../scripts/superliga/transfers.ts';
import {
  ALL_COMPETITIONS,
  isCompetitionSlug,
} from '@/shared/config/competitions';
import { fingerprint } from '@/shared/lib/hash';
import { DATA_URL } from '@/shared/config/config';
import { Snapshot } from '../snapshot';
import { isSnapshot } from '@/shared/lib/guards';
import { logSync } from './syncLog';

const REQUEST_TIMEOUT_MS = 20_000;
const BODY_PREVIEW_LENGTH = 200;

/**
 * Series (Formula 1) are published apart from the competitions, which older
 * builds require to have teams; from here on they are competitions too,
 * with sessions instead of teams and matches.
 */
export function withSeries(snapshot: Snapshot): Snapshot {
  const series = (snapshot.series ?? []).map((entry) => ({
    ...entry,
    teams: entry.teams ?? [],
    matches: entry.matches ?? [],
    standings: entry.standings ?? [],
  }));
  const { series: _series, ...rest } = snapshot;
  return { ...rest, competitions: [...snapshot.competitions, ...series] };
}

/**
 * Keeps the competitions this app version knows, so a sport added to the
 * file later never breaks an older install. At least one must remain.
 */
export function keepKnownCompetitions(snapshot: Snapshot): Snapshot {
  snapshot.competitions = snapshot.competitions.filter((competition) =>
    isCompetitionSlug(competition.slug),
  );
  if (snapshot.competitions.length === 0) {
    throw new Error('Dados inválidos');
  }
  return snapshot;
}

/**
 * Fills transfers from the list shipped with the app while the published
 * snapshot has none. A bad line drops that competition's transfers, never
 * the sync.
 */
export function withBundledTransfers(snapshot: Snapshot): Snapshot {
  const bundled = toTransferFile(bundledTransfers);
  for (const competition of snapshot.competitions) {
    if (competition.sport !== 'volei' || competition.transfers?.length) {
      continue;
    }
    try {
      competition.transfers = resolveTransfers(
        competition.slug,
        bundled[competition.slug] ?? [],
        competition.teams,
      );
    } catch (error) {
      logSync('bundled transfers skipped', {
        competition: competition.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return snapshot;
}

let revision: string | null = null;

/**
 * What this build adds to the file (the competitions it keeps, the bundled
 * transfers), as a fingerprint. A saved ETag is only trusted by the build
 * that saved it: after an update, the same file may be shaped differently.
 */
export function transformRevision(): string {
  revision ??= fingerprint(
    JSON.stringify([ALL_COMPETITIONS, bundledTransfers]),
  );
  return revision;
}

/** A download: the file, or word that it is the one already saved. */
export type FetchResult =
  | { kind: 'unchanged' }
  | { kind: 'snapshot'; snapshot: Snapshot; etag: string | null };

/**
 * Downloads the published file. With the `etag` of the saved one, the server
 * answers 304 while the file is the same: no body to download or parse.
 */
export async function fetchSnapshot(
  etag: string | null = null,
): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();
  logSync('download started', { url: DATA_URL, conditional: etag !== null });

  try {
    const response = await fetch(DATA_URL, {
      signal: controller.signal,
      ...(etag ? { headers: { 'If-None-Match': etag } } : {}),
    });
    if (response.status === 304) {
      logSync('download not modified', {
        durationMs: Date.now() - startedAt,
      });
      return { kind: 'unchanged' };
    }
    const body = await response.text();
    logSync('download finished', {
      status: response.status,
      url: response.url,
      contentType: response.headers.get('content-type'),
      bytes: body.length,
      durationMs: Date.now() - startedAt,
    });

    if (!response.ok) {
      logSync('download rejected', {
        bodyPreview: body.slice(0, BODY_PREVIEW_LENGTH),
      });
      throw new Error(`Falha ao baixar os dados (${response.status})`);
    }

    const data: unknown = JSON.parse(body);
    if (!isSnapshot(data)) {
      logSync('invalid snapshot', {
        bodyPreview: body.slice(0, BODY_PREVIEW_LENGTH),
      });
      throw new Error('Dados inválidos');
    }
    return {
      kind: 'snapshot',
      snapshot: withBundledTransfers(keepKnownCompetitions(withSeries(data))),
      etag: response.headers.get('etag'),
    };
  } catch (error) {
    logSync('download failed', {
      url: DATA_URL,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
