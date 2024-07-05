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
