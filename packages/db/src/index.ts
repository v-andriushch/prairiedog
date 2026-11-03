import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

/**
 * Applies every module's migrations (`<modulesDir>/<name>/migrations`), in name order.
 * Each module has its own history table, `drizzle.<name>_migrations`, so a module can
 * later move to its own database without untangling a shared history.
 * The history tables live in a separate "drizzle" schema because drizzle-kit's own
 * migrations create the module schema, which must not exist beforehand.
 */
export async function migrateAll(databaseUrl: string, modulesDir: string): Promise<string[]> {
  const modules = readdirSync(modulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(modulesDir, d.name, 'migrations')))
    .map((d) => d.name)
    .sort();

  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const db = drizzle(pool);
    for (const name of modules) {
      await migrate(db, {
        migrationsFolder: join(modulesDir, name, 'migrations'),
        migrationsSchema: 'drizzle',
        migrationsTable: `${name}_migrations`,
      });
    }
  } finally {
    await pool.end();
  }
  return modules;
}
