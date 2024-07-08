import path from 'node:path'
import * as tsx from 'tsx/cjs/api'
import type { ConfigDialect, Migration } from '..'
import { startTransaction } from '../helpers/db-helpers'
import {
  deleteMigrationByName,
  ensureMigrationTable,
  getLatestBatch,
  getMigrationBatch,
  getMigrationFiles,
} from '../helpers/migration'
import { isNullish } from '../helpers/misc-utils'
import { BaseCommand } from './_base.command'

export class MigrationDownCommand extends BaseCommand<{ batchToRollDownTo?: number }> {
  async run() {
    const migrationFiles = (await getMigrationFiles(this.ctx)).reverse()

    if (!migrationFiles.length) {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log('[Down]: No migrations to run')
      return
    }

    await ensureMigrationTable(this.ctx)

    const latestBatch = (await getLatestBatch(this.ctx)) ?? 0

    if (!isNullish(this.ctx.opts.batchToRollDownTo)) {
      if (this.ctx.opts.batchToRollDownTo > latestBatch) {
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(
          `[Down]: No migrations to run, batch ${this.ctx.opts.batchToRollDownTo} is higher than latest batch ${latestBatch}`
        )
        return
      }
    }

    if (!latestBatch) {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log('[Down]: No migrations to run')
      return
    }

    let noOfRunMigrations = 0
    await startTransaction(this.ctx, async (trx) => {
      for (const migrationFile of migrationFiles) {
        // check if migration did not run already
        const migrationName = migrationFile.ts.split('/').pop()!.replace('.ts', '')
        const batch = await getMigrationBatch(migrationName, { ...this.ctx, client: trx as any })

        if (
          !batch ||
          (isNullish(this.ctx.opts.batchToRollDownTo) ||
          Number.isNaN(this.ctx.opts.batchToRollDownTo)
            ? batch !== latestBatch
            : batch < this.ctx.opts.batchToRollDownTo)
        ) {
          // console.log(`Migration ${migrationName} already ran in batch ${batch}`)
          continue
        }

        const migration = tsx.require(
          path.join(this.ctx.migrationFolder, migrationFile.ts),
          __filename
        ) as Migration<ConfigDialect>
        if (!migration.down) {
          throw new Error(`Migration ${migrationName} is missing an up function`)
        }

        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(`[Down]: ${migrationName} is running`)
        await migration.down({ db: trx })
        await deleteMigrationByName(migrationName, { ...this.ctx, client: trx as any })
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log(`[Down]: ${migrationName} run successfully`)
        noOfRunMigrations++
      }
    })

    if (noOfRunMigrations === 0) {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log('[Down]: No migrations to run')
    }
  }
}
