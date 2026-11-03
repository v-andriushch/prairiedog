import { defineConfig } from 'drizzle-kit';

// Each module keeps its own migration history, so it can move to its own service later.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './migrations',
  schemaFilter: ['collector'],
});
