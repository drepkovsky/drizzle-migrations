import { sql } from 'drizzle-orm'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import type { DBClient } from '..'
import type { MigrationContext } from './drizzle-config'

/**
 * Ordered migration files in ascending order. That means the first file is the oldest migration.
 */
export async function getMigrationFiles(ctx: MigrationContext) {
  const dir = ctx.migrationFolder
  if (!fs.existsSync(dir)) {
    throw new Error(`Migration folder ${dir} does not exist. Please create it first.`)
  }

  const jsonFiles = (await fsp.readdir(dir)).filter((file) => file.endsWith('.json')).sort()

  const tsFiles = (await fsp.readdir(dir)).filter((file) => file.endsWith('.ts')).sort()

  const pairs = jsonFiles.map((json) => {
    const ts = tsFiles.find((tsFile) => tsFile.startsWith(json.replace('.json', '')))
    if (!ts)
      throw new Error(
        `Migration file ${json} has no corresponding typescript file. Your migration files are corrupted. Please fix this manually by removing the corrupted migration or regenerating all files again.`
      )

    return { json, ts }
  })

  return pairs
}

export async function ensureMigrationTable(ctx: MigrationContext) {
  const migrationTable = ctx.migrationTable
  const migrationSchema = ctx.migrationSchema

  if (ctx.dialect === 'postgresql') {
    const client = ctx.client as DBClient<'postgresql'>
    // ensure schema
    await client.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS ${migrationSchema}`))

    // ensure table
    await client.execute(
      sql.raw(
        `CREATE TABLE IF NOT EXISTS "${migrationSchema}"."${migrationTable}" (name TEXT PRIMARY KEY, batch INT NOT NULL)`
      )
    )
  }

  if (ctx.dialect === 'mysql') {
    const client = ctx.client as DBClient<'mysql'>
    await client.execute(
      sql.raw(
        `CREATE TABLE IF NOT EXISTS "${migrationTable}" (name TEXT PRIMARY KEY, batch INT NOT NULL)`
      )
    )
  }

  if (ctx.dialect === 'sqlite') {
    const client = ctx.client as DBClient<'sqlite'>
    await client.run(
      sql.raw(
        `CREATE TABLE IF NOT EXISTS "${migrationTable}" (name TEXT PRIMARY KEY, batch INT NOT NULL)`
      )
    )
  }
}

export function getLatestBatch(ctx: MigrationContext) {
  if (ctx.dialect === 'sqlite') {
    const client = ctx.client as DBClient<'sqlite'>
    return client
      .run(sql.raw(`SELECT MAX(batch) as batch FROM "${ctx.migrationTable}"`))
      .then((r: any) => r[0]?.batch as number)
  }

  if (ctx.dialect === 'mysql') {
    const client = ctx.client as DBClient<'mysql'>
    return client
      .execute(sql.raw(`SELECT MAX(batch) as batch FROM "${ctx.migrationTable}"`))
      .then((r) => r[0].batch as number)
  }
  if (ctx.dialect === 'postgresql') {
    const client = ctx.client as DBClient<'postgresql'>
    return client
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
    const client = ctx.client as DBClient<'sqlite'>
    return client
      .run(sql.raw(`SELECT batch FROM "${ctx.migrationTable}" WHERE name = '${migrationName}'`))
      .then((r: any) => r[0]?.batch as number)
  }

  if (ctx.dialect === 'mysql') {
    const client = ctx.client as DBClient<'mysql'>
    return client
      .execute(sql.raw(`SELECT batch FROM "${ctx.migrationTable}" WHERE name = '${migrationName}'`))
      .then((r) => r[0].batch as number)
  }
  if (ctx.dialect === 'postgresql') {
    const client = ctx.client as DBClient<'postgresql'>
    return client
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
    const client = ctx.client as DBClient<'sqlite'>
    return client.run(
      sql.raw(
        `INSERT INTO "${ctx.migrationTable}" (name,batch) VALUES ('${migrationName}',${batch})`
      )
    )
  }
  if (ctx.dialect === 'mysql') {
    const client = ctx.client as DBClient<'mysql'>
    return client.execute(
      sql.raw(
        `INSERT INTO "${ctx.migrationTable}" (name,batch) VALUES ('${migrationName}',${batch})`
      )
    )
  }
  if (ctx.dialect === 'postgresql') {
    const client = ctx.client as DBClient<'postgresql'>
    return client.execute(
      sql.raw(
        `INSERT INTO "${ctx.migrationSchema}"."${ctx.migrationTable}" (name,batch) VALUES ('${migrationName}',${batch})`
      )
    )
  }
  throw new Error('Unsupported dialect')
}

export function deleteMigrationByName(migrationName: string, ctx: MigrationContext) {
  if (ctx.dialect === 'sqlite') {
    const client = ctx.client as DBClient<'sqlite'>
    return client.run(
      sql.raw(`DELETE FROM "${ctx.migrationTable}" WHERE name = '${migrationName}'`)
    )
  }
  if (ctx.dialect === 'mysql') {
    const client = ctx.client as DBClient<'mysql'>
    return client.execute(
      sql.raw(`DELETE FROM "${ctx.migrationTable}" WHERE name = '${migrationName}'`)
    )
  }
  if (ctx.dialect === 'postgresql') {
    const client = ctx.client as DBClient<'postgresql'>
    return client.execute(
      sql.raw(
        `DELETE FROM "${ctx.migrationSchema}"."${ctx.migrationTable}" WHERE name = '${migrationName}'`
      )
    )
  }
  throw new Error('Unsupported dialect')
}

export function deleteMigrationUntilBatch(batch: number, ctx: MigrationContext) {
  if (ctx.dialect === 'sqlite') {
    const client = ctx.client as DBClient<'sqlite'>
    return client.run(sql.raw(`DELETE FROM "${ctx.migrationTable}" WHERE batch >= ${batch}`))
  }
  if (ctx.dialect === 'mysql') {
    const client = ctx.client as DBClient<'mysql'>
    return client.execute(sql.raw(`DELETE FROM "${ctx.migrationTable}" WHERE batch >= ${batch}`))
  }
  if (ctx.dialect === 'postgresql') {
    const client = ctx.client as DBClient<'postgresql'>
    return client.execute(
      sql.raw(
        `DELETE FROM "${ctx.migrationSchema}"."${ctx.migrationTable}" WHERE batch >= ${batch}`
      )
    )
  }
  throw new Error('Unsupported dialect')
}