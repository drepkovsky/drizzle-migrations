import { defineConfig, type Config } from 'drizzle-kit'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

type ConfigDialect = Config['dialect']
export type ConfigWithMigrator = Config &
  (
    | {
        dialect: 'postgresql'
        getMigrator: () => Promise<PostgresJsDatabase>
      }
    | {
        dialect: 'sqlite'
        getMigrator: () => Promise<BetterSQLite3Database>
      }
    | {
        dialect: 'mysql'
        getMigrator: () => Promise<MySql2Database>
      }
  )

export function defineConfigWithMigrator(config: ConfigWithMigrator) {
  return defineConfig(config)
}

export type DBClient<TDialect extends ConfigDialect> = TDialect extends 'sqlite'
  ? BetterSQLite3Database
  : TDialect extends 'mysql'
    ? MySql2Database
    : TDialect extends 'postgresql'
      ? PostgresJsDatabase
      : never

export type MigrationArgs<TDialect extends ConfigDialect> = {
  db: DBClient<TDialect>
}
