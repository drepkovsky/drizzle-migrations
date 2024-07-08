import { defineConfig } from '@drepkovsky/drizzle-migrations'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
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
  getMigrator: async () => {
    const migrationClient = postgres('postgres://postgres:postgres@localhost/postgres-db', {
      max: 1,
    })

    return drizzle(migrationClient)
  },

  seed: { dirPath: './src/seeders', defaultSeeder: 'default-seeder' },
})
