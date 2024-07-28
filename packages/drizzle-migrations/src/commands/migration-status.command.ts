import { printTable } from 'console-table-printer'
import { getMigrationBatch, getMigrationFiles } from '../helpers/migration'
import { BaseCommand } from './_base.command'

export class MigrationStatusCommand extends BaseCommand {
  async run(): Promise<void> {
    const migrationFiles = await getMigrationFiles(this.ctx)

    const migrationNames = migrationFiles.map((file) => file.split('/').pop()!.replace('.ts', ''))

    const migrationTable: {
      name: string
      status: 'pending' | 'completed'
      batch: number | null
    }[] = []

    for (const migrationName of migrationNames) {
      const batch = await getMigrationBatch(migrationName, this.ctx)
      migrationTable.push({
        name: migrationName,
        status: batch ? 'completed' : 'pending',
        batch,
      })
    }

    const sortedMigrationTable = migrationTable.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })

    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log('Migration status:')
    printTable(sortedMigrationTable)
  }
}
