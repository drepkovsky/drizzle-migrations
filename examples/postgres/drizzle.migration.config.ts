import { defineConfig } from '@llong2195/drizzle-migrations';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

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
  getMigrator: async (): Promise<any> => {
    const client = new Pool({
      connectionString: "postgres://postgres:postgres@localhost/postgres-db",
    });

    return drizzle(client);
  },

  seed: { dirPath: './src/seeders', defaultSeeder: 'default-seeder' },
});
