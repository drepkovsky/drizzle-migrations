import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'localhost',
    database: 'postgres-db',
    user: 'postgres',
    password: 'postgres',
  },
  out: './src/migrations',
  tablesFilter: [],
  strict: true,
  breakpoints: true,
  migrations: {
    schema: 'public',
    table: 'drizzle_migrations',
  },
});
