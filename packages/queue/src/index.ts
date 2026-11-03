import { PgBoss, type Queue } from 'pg-boss';

export { PgBoss };
export type { Job } from 'pg-boss';

/** pg-boss keeps its tables in its own "pgboss" schema, created on first start. */
export function createBoss(databaseUrl: string): PgBoss {
  return new PgBoss({ connectionString: databaseUrl, schema: 'pgboss' });
}

/**
 * Creates `name` with our defaults (3 retries, exponential backoff from 30 s) and a
 * dead-letter queue `<name>.dead` that receives jobs which failed every retry.
 * Safe to call on every start; options of an existing queue are not changed.
 */
export async function createQueueWithDeadLetter(
  boss: PgBoss,
  name: string,
  options: Omit<Queue, 'name' | 'deadLetter'> = {},
): Promise<void> {
  const deadLetter = `${name}.dead`;
  await boss.createQueue(deadLetter);
  await boss.createQueue(name, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
    ...options,
    deadLetter,
  });
}
