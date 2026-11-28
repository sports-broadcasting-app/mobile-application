import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { download, postJson } from './http.ts';

/**
 * Where a source's pages come from: the network in a real run, or pages
 * saved in a folder (offline runs, tests). Each request names both its URL
 * and the file it is saved as, so a collector never asks which one it got.
 */
export interface SourceIO {
  /**
   * Saved pages: no published file to lean on, so every round is asked and
   * no live-run shortcut applies.
   */
  offline: boolean;
  /** A page the source cannot do without. */
  get(url: string, fixture: string): Promise<string>;
  /** A page that may be missing offline (a round, a match page): null. */
  find(url: string, fixture: string): Promise<string | null>;
  /** A GraphQL query; offline, its saved answer or null. */
  post(url: string, body: unknown, fixture: string): Promise<string | null>;
}

export const networkIO: SourceIO = {
  offline: false,
  get: (url) => download(url),
  find: (url) => download(url),
  post: (url, body) => postJson(url, body),
};

export function fixturesIO(dir: string): SourceIO {
  const read = (file: string) => readFile(join(dir, file), 'utf8');
  const tryRead = (file: string) => read(file).catch(() => null);
  return {
    offline: true,
    get: (_url, fixture) => read(fixture),
    find: (_url, fixture) => tryRead(fixture),
    post: (_url, _body, fixture) => tryRead(fixture),
  };
}
