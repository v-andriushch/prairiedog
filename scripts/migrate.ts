// Entry point of the one-shot `migrate` container: apply all module migrations, then exit.
import { migrateAll } from '@prairiedog/db';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const applied = await migrateAll(url, new URL('../modules', import.meta.url).pathname);
console.log(`migrations up to date: ${applied.join(', ')}`);
