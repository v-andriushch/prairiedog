import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { createBoss, createQueueWithDeadLetter, type PgBoss } from './index.ts';

let container: StartedPostgreSqlContainer;
let boss: PgBoss;

beforeAll(async () => {
  container = await new PostgreSqlContainer('pgvector/pgvector:0.8.7-pg18').start();
  boss = createBoss(container.getConnectionUri());
  await boss.start();
}, 120_000);

afterAll(async () => {
  await boss?.stop({ graceful: false });
  await container?.stop();
});

async function waitFor<T>(
  check: () => Promise<T | null | undefined>,
  timeoutMs = 20_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await check();
    if (value) return value;
    if (Date.now() > deadline) throw new Error('timed out waiting');
    await new Promise((r) => setTimeout(r, 250));
  }
}

test('creating a queue twice is harmless (it runs on every worker start)', async () => {
  await createQueueWithDeadLetter(boss, 'test.idempotent');
  await expect(createQueueWithDeadLetter(boss, 'test.idempotent')).resolves.toBeUndefined();
});

test('a job that fails every retry ends up in <name>.dead with its payload', async () => {
  // No delay so the test doesn't wait for the real 30 s backoff.
  await createQueueWithDeadLetter(boss, 'test.fail', {
    retryLimit: 1,
    retryDelay: 0,
    retryBackoff: false,
  });
  let attempts = 0;
  await boss.work('test.fail', { pollingIntervalSeconds: 0.5 }, async () => {
    attempts++;
    throw new Error('always fails');
  });

  const id = await boss.send('test.fail', { listingId: 42 });

  const dead = await waitFor(
    async () => (await boss.fetch<{ listingId: number }>('test.fail.dead'))[0],
  );
  expect(dead.data).toEqual({ listingId: 42 });
  expect(attempts).toBe(2); // first try + 1 retry
  const original = await boss.getJobById('test.fail', id!);
  expect(original?.state).toBe('failed');
});
