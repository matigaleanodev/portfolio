import { createHash } from 'node:crypto';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const stateUrl = 'https://matiasgaleano.dev/publication-state.json';

export function createPublicationState(posts, gitSha) {
  if (!Array.isArray(posts) || typeof gitSha !== 'string' || !gitSha.trim()) {
    throw new Error('A generated posts index and GITHUB_SHA are required.');
  }
  return {
    version: 1,
    gitSha,
    postsHash: createHash('sha256').update(JSON.stringify(posts)).digest('hex'),
  };
}

export async function getDeploymentDecision(expected, eventName, fetchImpl = fetch) {
  if (eventName !== 'schedule') {
    return { deploy: true, reason: 'Push or manual deployment requested.' };
  }

  try {
    const response = await fetchImpl(stateUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Publication state returned HTTP ${response.status}.`);
    const published = await response.json();
    if (
      published?.version !== 1 ||
      typeof published.gitSha !== 'string' ||
      !published.gitSha ||
      typeof published.postsHash !== 'string' ||
      !/^[a-f0-9]{64}$/.test(published.postsHash)
    ) {
      throw new Error('Published state is missing or invalid.');
    }
    const deploy =
      expected.gitSha !== published.gitSha || expected.postsHash !== published.postsHash;
    return {
      deploy,
      reason: deploy
        ? 'Source revision or eligible posts changed.'
        : 'Source revision and eligible posts are already deployed.',
    };
  } catch (error) {
    return {
      deploy: true,
      reason: `Cannot confirm deployed state; rebuilding safely. ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function writePublicationState(state, rootDir = process.cwd()) {
  await writeFile(
    join(rootDir, 'dist', 'portfolio', 'browser', 'publication-state.json'),
    `${JSON.stringify(state, null, 2)}\n`,
  );
}

async function main() {
  const posts = JSON.parse(
    await readFile(join(process.cwd(), 'src', 'assets', 'blog', 'posts.json'), 'utf8'),
  );
  const state = createPublicationState(posts, process.env.GITHUB_SHA);
  if (process.argv.includes('--write')) {
    await writePublicationState(state);
    return;
  }
  const decision = await getDeploymentDecision(state, process.env.GITHUB_EVENT_NAME);
  console.log(decision.reason);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `deploy=${decision.deploy}\n`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
