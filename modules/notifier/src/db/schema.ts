import { pgSchema } from 'drizzle-orm/pg-core';

// Every table of this module lives in the "notifier" Postgres schema. No foreign keys
// into other modules' schemas; owned rows carry a plain user_id column instead.
export const notifier = pgSchema('notifier');
