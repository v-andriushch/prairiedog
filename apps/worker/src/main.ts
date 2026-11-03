// Worker process: background jobs of all modules (collector now; evaluator, notifier later).
import { registerCollectorJobs } from '@prairiedog/collector';
import { createBoss } from '@prairiedog/queue';
import { pino } from 'pino';

// How long running jobs may take to finish on shutdown; keep below compose's stop_grace_period.
const SHUTDOWN_TIMEOUT_MS = 30_000;

const log = pino({ level: process.env.LOG_LEVEL ?? 'info' });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const boss = createBoss(databaseUrl);
boss.on('error', (err) => log.error({ err }, 'pg-boss error'));
await boss.start();

await registerCollectorJobs(boss, log.child({ module: 'collector' }));
log.info('worker started');

// docker stop / a UPS-triggered shutdown send SIGTERM: stop taking jobs, let running ones finish.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    log.info({ signal }, 'stopping: waiting for running jobs');
    boss
      .stop({ graceful: true, timeout: SHUTDOWN_TIMEOUT_MS })
      .then(() => log.info('worker stopped'))
      .catch((err: unknown) => {
        log.error({ err }, 'unclean stop');
        process.exitCode = 1;
      });
  });
}
