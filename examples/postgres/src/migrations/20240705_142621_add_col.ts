
  import { sql } from 'drizzle-orm'
  import type { MigrationArgs } from '@drepkovsky/drizzle-migrations'

  export async function up({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          ALTER TABLE "posts" ADD COLUMN "new_column" varchar;
        `);
  
  };

  export async function down({ db }: MigrationArgs<'postgresql'>): Promise<void> {
  await db.execute(sql`
          ALTER TABLE "posts" DROP COLUMN IF EXISTS "new_column";
        `);
  
  };
  