# Drizzle migrations

Simple tool that ads `up` and `down` migration capability for drizzle projects.

| **Warning**! This tool is work in progress and was only tested on `pg` databases, but should be working on `sqlite` and `mysql` too.
| This is also something that drizzle will probably have built-in inside `drizzle-kit` in the future.


## Installation

```bash
npm install @drepkovsky/drizzle-migrations # or yarn,pnpm,bun
```

## Configuration

To make this work you must make a small changes in your `drizzle.config.ts` file

```ts
import { defineConfigWithMigrator } from '@drepkovsky/drizzle-migrations'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// notice how we are not using definedConfig from drizzle but our custom definedConfigWithMigrator
export default defineConfigWithMigrator({
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



### Example of generated migration

```ts
import { sql } from 'drizzle-orm'
import type { MigrationArgs } from '@drepkovsky/drizzle-migrations'

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
