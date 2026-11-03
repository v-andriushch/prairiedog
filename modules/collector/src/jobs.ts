import { createQueueWithDeadLetter, type PgBoss } from '@prairiedog/queue';
import type { Logger } from 'pino';

export const COLLECTOR_RUN = 'collector.run';

// shortcut: one fixed hourly schedule; becomes per-source settings in the UI (P2.10).
const SCHEDULE = '0 * * * *';

export async function registerCollectorJobs(boss: PgBoss, log: Logger): Promise<void> {
  // stately: at most one run queued and one active, so slow runs never pile up.
  await createQueueWithDeadLetter(boss, COLLECTOR_RUN, { policy: 'stately' });
  // missed: 'once' sends one catch-up run after downtime (e.g. a blackout), not one per missed hour.
  await boss.schedule(COLLECTOR_RUN, SCHEDULE, null, { missed: 'once' });

  await boss.work(COLLECTOR_RUN, async (jobs) => {
    for (const job of jobs) {
      const jobLog = log.child({ queue: job.name, jobId: job.id });
      jobLog.info('collector run started');
      // Source adapters plug in here (P1.5).
      jobLog.info('collector run finished: no sources configured yet');
    }
  });
}
