
  import { sql } from 'drizzle-orm'
  import type { MigrationArgs } from '@llong2195/drizzle-migrations'

  export async function up({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "books" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(64),
	"description" text,
	"user_id" integer
);

CREATE TABLE IF NOT EXISTS "posts_books" (
	"book_id" uuid,
	"post_id" integer,
	CONSTRAINT "posts_books_book_id_post_id_pk" PRIMARY KEY("book_id","post_id")
);

DO $$ BEGIN
 ALTER TABLE "books" ADD CONSTRAINT "books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "posts_books" ADD CONSTRAINT "posts_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "posts_books" ADD CONSTRAINT "posts_books_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

        `);
  
  };

  export async function down({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          DROP TABLE "books" CASCADE;
DROP TABLE "posts_books" CASCADE;
        `);
  
  };
  