import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createBoss, type PgBoss } from '@prairiedog/queue';
import { pino } from 'pino';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { COLLECTOR_RUN, registerCollectorJobs } from './jobs.ts';

let container: StartedPostgreSqlContainer;
let boss: PgBoss;

beforeAll(async () => {
  container = await new PostgreSqlContainer('pgvector/pgvector:0.8.7-pg18').start();
  boss = createBoss(container.getConnectionUri());
  await boss.start();
  await registerCollectorJobs(boss, pino({ level: 'silent' }));
}, 120_000);

afterAll(async () => {
  await boss?.stop({ graceful: false });
  await container?.stop();
});

test('registers an hourly schedule that catches up once after downtime', async () => {
  const schedules = await boss.getSchedules();
  const run = schedules.find((s) => s.name === COLLECTOR_RUN);
  expect(run?.cron).toBe('0 * * * *');
  expect(run?.options).toMatchObject({ missed: 'once' });
});

test('a queued collector run is picked up and completes', async () => {
  const id = await boss.send(COLLECTOR_RUN, {});
  expect(id).toBeTruthy();

  const deadline = Date.now() + 20_000;
  let state: string | undefined;
  while (Date.now() < deadline) {
    state = (await boss.getJobById(COLLECTOR_RUN, id!))?.state;
    if (state === 'completed') break;
    await new Promise((r) => setTimeout(r, 250));
  }
  expect(state).toBe('completed');
});
