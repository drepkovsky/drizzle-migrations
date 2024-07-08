import path from 'node:path'
import * as tsx from 'tsx/cjs/api'
import type { ConfigDialect, Migration } from '..'
import { startTransaction } from '../helpers/db-helpers'
import {
  ensureMigrationTable,
  getLatestBatch,
  getMigrationBatch,
  getMigrationFiles,
  saveMigration,
} from '../helpers/migration'
import { BaseCommand } from './_base.command'

export class MigrationUpCommand extends BaseCommand {
  async run() {
    const migrationFiles = await getMigrationFiles(this.ctx)

    if (!migrationFiles.length) {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log('[Up]: No migrations to run')
      return
    }

    await ensureMigrationTable(this.ctx)

    const latestBatch = (await getLatestBatch(this.ctx)) ?? 0
    const currentBatch = latestBatch + 1

    let noOfRunMigrations = 0

    await startTransaction(this.ctx, async (trx) => {
      for (const migrationFile of migrationFiles) {
        // check if migration did not run already
        const migrationName = migrationFile.ts.split('/').pop()!.replace('.ts', '')
        const batch = await getMigrationBatch(migrationName, {
          ...this.ctx,
          client: trx as any,
        })

        if (batch) {
          // console.log(`Migration ${migrationName} already ran in batch ${batch}`)
          continue
        }

        const migration = tsx.require(
          path.join(this.ctx.migrationFolder, migrationFile.ts),
          __filename
        ) as Migration<ConfigDialect>
        if (!migration.up) {
          throw new Error(`Migration ${migrationName} is missing an up function`)
        }

        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(`[Up]: Migration ${migrationName} is running`)
        await migration.up({ db: trx })
        await saveMigration(migrationName, currentBatch, { ...this.ctx, client: trx as any })
        noOfRunMigrations++
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(`[Up]: Migration ${migrationName} run successfully`)
      }
    })

    if (noOfRunMigrations === 0) {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log('[Up]: No migrations to run')
    }
  }
}
