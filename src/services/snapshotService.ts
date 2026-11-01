import { SUPERLIGA_DATA_URL } from '../constants/config';
import { SuperligaSnapshot } from '../types/superliga';

const REQUEST_TIMEOUT_MS = 20_000;
const EXPECTED_COMPETITIONS = 2;

function isValidSnapshot(data: unknown): data is SuperligaSnapshot {
  const snapshot = data as Partial<SuperligaSnapshot> | null;
  return (
    snapshot?.version === 1 &&
    Array.isArray(snapshot.competitions) &&
    snapshot.competitions.length === EXPECTED_COMPETITIONS &&
    snapshot.competitions.every(
      (competition) =>
        competition.teams?.length > 0 && Array.isArray(competition.matches),
    )
  );
}

export async function fetchSnapshot(): Promise<SuperligaSnapshot> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(SUPERLIGA_DATA_URL, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Falha ao baixar os dados (${response.status})`);
    }

    const data: unknown = await response.json();
    if (!isValidSnapshot(data)) throw new Error('Dados invalidos');
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
