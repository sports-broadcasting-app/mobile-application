export function logSync(message: string, details?: object): void {
  if (!__DEV__) return;
  if (details) console.log(`[sync] ${message}`, JSON.stringify(details));
  else console.log(`[sync] ${message}`);
}
