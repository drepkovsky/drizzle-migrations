import { sql } from 'drizzle-orm'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import type { MigrationContext } from './drizzle-config'
import { getFileExtension } from './misc-utils'

const VALID_MIGRATION_EXTENSIONS = new Set(['.ts', '.js', '.cjs', '.mjs', '.tsx', '.jsx'])

/**
 * Ordered migration files in ascending order. That means the first file is the oldest migration.
 * TODO: glob search for migration files
 */
export async function getMigrationFiles(ctx: MigrationContext) {
  const dir = ctx.migrationFolder
  if (!fs.existsSync(dir)) {
    throw new Error(`Migration folder ${dir} does not exist. Please create it first.`)
  }

  const tsFiles = (await fsp.readdir(dir)).filter((file) => {
    return VALID_MIGRATION_EXTENSIONS.has(getFileExtension(file))
  })

  return tsFiles
}

export async function ensureMigrationTable(ctx: MigrationContext) {
  const migrationTable = ctx.migrationTable
  const migrationSchema = ctx.migrationSchema

  if (ctx.dialect === 'postgresql') {
    // ensure schema
    await ctx.client.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS ${migrationSchema}`))

    // ensure table
    await ctx.client.execute(
      sql.raw(
        `CREATE TABLE IF NOT EXISTS "${migrationSchema}"."${migrationTable}" (name TEXT PRIMARY KEY, batch INT NOT NULL)`
      )
    )
  }

  if (ctx.dialect === 'mysql') {
    await ctx.client.execute(
      sql.raw(
        `CREATE TABLE IF NOT EXISTS "${migrationTable}" (name TEXT PRIMARY KEY, batch INT NOT NULL)`
      )
    )
  }

  if (ctx.dialect === 'sqlite') {
    await ctx.client.run(
      sql.raw(
        `CREATE TABLE IF NOT EXISTS "${migrationTable}" (name TEXT PRIMARY KEY, batch INT NOT NULL)`
      )
    )
  }
}

export function getLatestBatch(ctx: MigrationContext) {
  if (ctx.dialect === 'sqlite') {
    return ctx.client
      .run(sql.raw(`SELECT MAX(batch) as batch FROM "${ctx.migrationTable}"`))
      .then((r: any) => r[0]?.batch as number)
  }

  if (ctx.dialect === 'mysql') {
    return ctx.client
      .execute(sql.raw(`SELECT MAX(batch) as batch FROM "${ctx.migrationTable}"`))
      .then((r) => r[0].batch as number)
  }
  if (ctx.dialect === 'postgresql') {
    return ctx.client
      .execute(
        sql.raw(`SELECT MAX(batch) as batch FROM "${ctx.migrationSchema}"."${ctx.migrationTable}"`)
      )
      .then((r) => {
        return r[0]?.batch as number
      })
  }

  throw new Error('Unsupported dialect')
}

export function getMigrationBatch(migrationName: string, ctx: MigrationContext) {
  if (ctx.dialect === 'sqlite') {
    return ctx.client
      .run(sql.raw(`SELECT batch FROM "${ctx.migrationTable}" WHERE name = '${migrationName}'`))
      .then((r: any) => r[0]?.batch as number)
  }
  if (ctx.dialect === 'mysql') {
    return ctx.client
      .execute(sql.raw(`SELECT batch FROM "${ctx.migrationTable}" WHERE name = '${migrationName}'`))
      .then((r) => r[0].batch as number)
  }
  if (ctx.dialect === 'postgresql') {
    return ctx.client
      .execute(
        sql.raw(
          `SELECT batch FROM "${ctx.migrationSchema}"."${ctx.migrationTable}" WHERE name = '${migrationName}'`
        )
      )
      .then((r) => {
        return r[0]?.batch as number
      })
  }

  throw new Error('Unsupported dialect')
}

export function saveMigration(migrationName: string, batch: number, ctx: MigrationContext) {
  if (ctx.dialect === 'sqlite') {
    return ctx.client.run(
      sql.raw(
        `INSERT INTO "${ctx.migrationTable}" (name,batch) VALUES ('${migrationName}',${batch})`
      )
    )
  }
  if (ctx.dialect === 'mysql') {
    return ctx.client.execute(
      sql.raw(
        `INSERT INTO "${ctx.migrationTable}" (name,batch) VALUES ('${migrationName}',${batch})`
      )
    )
  }
  if (ctx.dialect === 'postgresql') {
    return ctx.client.execute(
      sql.raw(
        `INSERT INTO "${ctx.migrationSchema}"."${ctx.migrationTable}" (name,batch) VALUES ('${migrationName}',${batch})`
      )
    )
  }
  throw new Error('Unsupported dialect')
}

export function deleteMigrationByName(migrationName: string, ctx: MigrationContext) {
  if (ctx.dialect === 'sqlite') {
    return ctx.client.run(
      sql.raw(`DELETE FROM "${ctx.migrationTable}" WHERE name = '${migrationName}'`)
    )
  }
  if (ctx.dialect === 'mysql') {
    return ctx.client.execute(
      sql.raw(`DELETE FROM "${ctx.migrationTable}" WHERE name = '${migrationName}'`)
    )
  }
  if (ctx.dialect === 'postgresql') {
    return ctx.client.execute(
      sql.raw(
        `DELETE FROM "${ctx.migrationSchema}"."${ctx.migrationTable}" WHERE name = '${migrationName}'`
      )
    )
  }
  throw new Error('Unsupported dialect')
}

export function deleteMigrationUntilBatch(batch: number, ctx: MigrationContext) {
  if (ctx.dialect === 'sqlite') {
    return ctx.client.run(sql.raw(`DELETE FROM "${ctx.migrationTable}" WHERE batch >= ${batch}`))
  }
  if (ctx.dialect === 'mysql') {
    return ctx.client.execute(
      sql.raw(`DELETE FROM "${ctx.migrationTable}" WHERE batch >= ${batch}`)
    )
  }
  if (ctx.dialect === 'postgresql') {
    return ctx.client.execute(
      sql.raw(
        `DELETE FROM "${ctx.migrationSchema}"."${ctx.migrationTable}" WHERE batch >= ${batch}`
      )
    )
  }
  throw new Error('Unsupported dialect')
}
