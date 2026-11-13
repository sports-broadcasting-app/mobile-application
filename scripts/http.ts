const USER_AGENT =
  'WhereToWatchCollector/1.0 (+https://github.com/sports-broadcasting-app/mobile-application)';
const REQUEST_INTERVAL_MS = 2000;
const TIMEOUT_MS = 30_000;

/** Downloads a page politely: one request every two seconds, identified. */
export async function download(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  console.log(`GET ${url} -> ${response.status}`);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS));
  return response.text();
}
