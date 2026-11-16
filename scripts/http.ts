const USER_AGENT =
  'WhereToWatchCollector/1.0 (+https://github.com/sports-broadcasting-app/mobile-application)';
const REQUEST_INTERVAL_MS = 2000;
const TIMEOUT_MS = 30_000;

/** Posts a JSON body and returns the response text; same manners as `download`. */
export async function postJson(url: string, body: unknown): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  console.log(`POST ${url} -> ${response.status}`);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS));
  return response.text();
}

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
