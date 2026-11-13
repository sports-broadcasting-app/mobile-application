import bundledTransfers from '../../scripts/superliga/transfers.json';
import {
  resolveTransfers,
  type TransferFile,
} from '../../scripts/superliga/transfers.ts';
import { isCompetitionSlug } from '../constants/competitions';
import { DATA_URL } from '../constants/config';
import { Snapshot } from '../types/snapshot';
import { logSync } from '../utils/syncLog';

const REQUEST_TIMEOUT_MS = 20_000;
const BODY_PREVIEW_LENGTH = 200;

function isValidSnapshot(data: unknown): data is Snapshot {
  const snapshot = data as Partial<Snapshot> | null;
  return (
    snapshot?.version === 2 &&
    Array.isArray(snapshot.competitions) &&
    snapshot.competitions.every(
      (competition) =>
        competition.teams?.length > 0 && Array.isArray(competition.matches),
    )
  );
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
  const bundled = bundledTransfers as TransferFile;
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

export async function fetchSnapshot(): Promise<Snapshot> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();
  logSync('download started', { url: DATA_URL });

  try {
    const response = await fetch(DATA_URL, {
      signal: controller.signal,
    });
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
    if (!isValidSnapshot(data)) {
      logSync('invalid snapshot', {
        bodyPreview: body.slice(0, BODY_PREVIEW_LENGTH),
      });
      throw new Error('Dados inválidos');
    }
    return withBundledTransfers(keepKnownCompetitions(data));
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
