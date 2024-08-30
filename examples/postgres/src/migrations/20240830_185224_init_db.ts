import { sql } from 'drizzle-orm';
import type { MigrationArgs } from '@llong2195/drizzle-migrations';

export async function up({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar,
	"slug" uuid
);

        ` as any);
}

export async function down({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          DROP TABLE "users";
        ` as any);
}
