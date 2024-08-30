# Drizzle migrations

```bash
 This repository is a fork from drepkovsky/drizzle-migrations. Thanks to drepkovsky.
```

Simple tool that ads `up` and `down` migration capability for drizzle projects.


Automatic migration generation for drizzle was adapted from the **PayloadCMS** repository.

 **Warning**! This tool is work in progress and was only tested on `pg` databases, but should be working on `sqlite` and `mysql` too.
 This is also something that drizzle will probably have built-in inside `drizzle-kit` in the future.


## Installation

```bash
npm install @llong2195/drizzle-migrations # or yarn,pnpm,bun
```

## Configuration

To make this work you have to make small changes inside your `drizzle.migration.config.ts` file

```ts
import { defineConfig } from '@llong2195/drizzle-migrations'
import { drizzle } from 'drizzle-orm/node-postgres'
import postgres from 'postgres'

// notice how we are not using `defineConfig` from drizzle but from `@llong2195/drizzle-migrations`
export default defineConfig({
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {  ...  },
  out: './src/migrations',

  // this is default if not provided. schema is for now supported only for postgres,
  migrations: {
    schema: 'public',
    table: 'drizzle_migrations',
  }, 

  // define your own client using adapter of your choice
  getMigrator: async () => {
    const migrationClient = postgres('postgres://postgres:postgres@localhost/postgres-db', {
      max: 1,
    })

    return drizzle(migrationClient)
  }, 

  // only needed if you want to use seed commands
  seed: { dirPath: './src/seeders', defaultSeeder: 'db-seeder' }
})
```

## Usage

### Generate migration
```bash
npm run drizzle-migrations generate --name <migration-name>
```

### Run migrations
```bash
npm run drizzle-migrations up
```

### Rollback migrations
```bash
npm run drizzle-migrations down
```

### Rollback up to specific batch
```bash
npm run drizzle-migrations down --bach <batch-number>
```

### Get status of migrations
```bash
npm run drizzle-migrations status
```

### Rollback all migrations
```bash
npm run drizzle-migrations fresh
```

### Rollback all migrations and run them again
```bash
npm run drizzle-migrations refresh
```

### Create seeder
```bash
npm run drizzle-migrations seed:create --name <seeder-name>
```

### Run seeders
```bash
npm run drizzle-migrations seed:run --name <seeder-name> // default seeder is db-seeder
```


### Example of generated migration

```ts
import { sql } from 'drizzle-orm'
import type { MigrationArgs } from '@llong2195/drizzle-migrations'

export async function up({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "posts" (
                "id" serial PRIMARY KEY NOT NULL,
                "title" varchar(255),
                "content" varchar,
                "user_id" integer
        );

        CREATE TABLE IF NOT EXISTS "users" (
                "id" serial PRIMARY KEY NOT NULL,
                "name" varchar,
                "slug" uuid
        );

        DO $$ BEGIN
        ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        EXCEPTION
        WHEN duplicate_object THEN null;
        END $$;

        `)
}

export async function down({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
        DROP TABLE "posts";
        DROP TABLE "users";
`)
}
```
