const USER_AGENT =
  'WhereToWatchCollector/1.0 (+https://github.com/sports-broadcasting-app/mobile-application)';
const REQUEST_INTERVAL_MS = 2000;
const TIMEOUT_MS = 30_000;
/** Waits before the 2nd and 3rd attempts; a source hiccup rarely lasts more. */
export const RETRY_WAITS_MS = [5_000, 15_000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 5xx and 429 are worth another try; any other status will not change. */
const isTransient = (status: number) => status >= 500 || status === 429;

/**
 * Fetches with the collector's manners (identified, one request every two
 * seconds) and retries timeouts, network errors and transient statuses.
 */
export async function fetchText(
  url: string,
  init: RequestInit = {},
  waits: number[] = RETRY_WAITS_MS,
): Promise<string> {
  const method = init.method ?? 'GET';
  for (let attempt = 0; ; attempt++) {
    // Timeouts and network errors come back as an Error instead of throwing.
    const result = await fetch(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, ...init.headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((error: unknown) =>
      error instanceof Error ? error : new Error(String(error)),
    );

    let failure: Error;
    if (result instanceof Error) {
      failure = result;
    } else {
      console.log(`${method} ${url} -> ${result.status}`);
      if (result.ok) {
        const text = await result.text();
        await sleep(REQUEST_INTERVAL_MS);
        return text;
      }
      failure = new Error(`${url} returned ${result.status}`);
      if (!isTransient(result.status)) throw failure;
    }

    const wait = waits[attempt];
    if (wait === undefined) throw failure;
    console.log(`${method} ${url} failed (${failure.message}), retrying`);
    await sleep(wait);
  }
}

/** Posts a JSON body and returns the response text. */
export function postJson(url: string, body: unknown): Promise<string> {
  return fetchText(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Downloads a page politely: one request every two seconds, identified. */
export function download(url: string): Promise<string> {
  return fetchText(url);
}
