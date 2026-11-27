import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const attempts = 3;

/**
 * Falla salvo que `sha` siga siendo la cabeza de `main`. Un rerun o una corrida encolada de una
 * revisión anterior no puede publicar, y si GitHub no lo confirma tampoco se publica.
 */
export async function assertCurrentRevision(sha, env = process.env, fetchImpl = fetch) {
  const head = await readMainHead(env, fetchImpl);
  if (head !== sha) {
    throw new Error(
      `La revisión ${sha} ya no es la cabeza de main (${head}). ` +
        'No se publica: ejecutar el workflow sobre main.',
    );
  }
}

async function readMainHead(env, fetchImpl) {
  const { GITHUB_API_URL: api = 'https://api.github.com' } = env;
  const { GITHUB_REPOSITORY: repository, GITHUB_TOKEN: token } = env;
  if (!repository || !token) {
    throw new Error('No se pudo confirmar la cabeza de main: faltan repositorio o token.');
  }

  let failure;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(`${api}/repos/${repository}/git/ref/heads/main`, {
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'x-github-api-version': '2022-11-28',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`GitHub respondió HTTP ${response.status}.`);
      const sha = (await response.json())?.object?.sha;
      if (typeof sha !== 'string' || !/^[a-f0-9]{40}$/.test(sha)) {
        throw new Error('GitHub no informó un SHA válido.');
      }
      return sha;
    } catch (error) {
      failure = error;
      if (attempt < attempts) await wait(attempt * 1000);
    }
  }
  throw new Error(`No se pudo confirmar la cabeza de main: ${failure?.message ?? 'sin detalle'}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await assertCurrentRevision(process.env.GITHUB_SHA);
  console.log(`La revisión ${process.env.GITHUB_SHA} es la cabeza de main.`);
}
