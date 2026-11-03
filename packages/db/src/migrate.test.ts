import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { migrateAll } from './index.ts';

// Same image as compose.yaml, so the test sees the real extension set.
const IMAGE = 'pgvector/pgvector:0.8.7-pg18';
const modulesDir = new URL('../../../modules', import.meta.url).pathname;

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer(IMAGE).start();
}, 120_000);

afterAll(async () => {
  await container?.stop();
});

async function query(sql: string): Promise<string[]> {
  const client = new pg.Client({ connectionString: container.getConnectionUri() });
  await client.connect();
  try {
    const { rows } = await client.query<{ name: string }>(sql);
    return rows.map((r) => r.name);
  } finally {
    await client.end();
  }
}

test('applies every module migration: one schema per module, own history, pgvector', async () => {
  const applied = await migrateAll(container.getConnectionUri(), modulesDir);
  expect(applied).toEqual(['collector', 'evaluator', 'notifier', 'web']);

  expect(
    await query(
      `SELECT nspname AS name FROM pg_namespace WHERE nspname IN ('collector','evaluator','notifier','web') ORDER BY 1`,
    ),
  ).toEqual(applied);
  expect(
    await query(
      `SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'drizzle' ORDER BY 1`,
    ),
  ).toEqual(applied.map((m) => `${m}_migrations`));
  expect(await query(`SELECT extname AS name FROM pg_extension WHERE extname = 'vector'`)).toEqual([
    'vector',
  ]);
});

test('running migrations again is a no-op', async () => {
  await expect(migrateAll(container.getConnectionUri(), modulesDir)).resolves.toHaveLength(4);
});
