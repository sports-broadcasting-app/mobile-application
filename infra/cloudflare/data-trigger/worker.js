/**
 * Cloudflare Worker "onde-passa-trigger": starts the "Match data" workflow
 * every 30 minutes. GitHub's own cron is best effort and has run this repo
 * only every 6-9 hours; Cloudflare cron triggers fire on time.
 *
 * Setup (dashboard): Workers & Pages → Create → Worker → paste this file.
 * Settings → Variables and Secrets → secret GITHUB_TOKEN (fine-grained token,
 * only this repository, permission "Actions: Read and write").
 * Settings → Trigger Events → Cron Trigger "*\/30 * * * *".
 */

const WORKFLOW_URL =
  'https://api.github.com/repos/sports-broadcasting-app/mobile-application/actions/workflows/data.yml/dispatches';

async function dispatch(env) {
  const response = await fetch(WORKFLOW_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'onde-passa-trigger',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ ref: 'main' }),
  });
  // 204 means the run was queued. Anything else lands in the Worker logs;
  // 401 usually means the token expired.
  if (response.status !== 204) {
    throw new Error(
      `GitHub answered ${response.status}: ${await response.text()}`,
    );
  }
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(dispatch(env));
  },
  // The Worker has no public use; its URL only says so.
  async fetch() {
    return new Response('Not found', { status: 404 });
  },
};
