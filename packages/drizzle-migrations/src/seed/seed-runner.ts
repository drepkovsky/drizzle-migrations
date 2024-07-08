import type { ConfigDialect } from '..'
import { startTransaction } from '../helpers/db-helpers'
import type { MigrationContext } from '../helpers/drizzle-config'
import type { BaseSeederConstructor } from './_base.seeder'

export class SeedRunner<TDialect extends ConfigDialect> {
  constructor(private readonly ctx: Pick<MigrationContext<any, TDialect>, 'dialect' | 'client'>) {}

  async run(
    seeder: BaseSeederConstructor<TDialect>,
    state: Record<string, any> = {}
  ): Promise<void> {
    await startTransaction(this.ctx, async (db) => {
      const state: Record<string, any> = {}
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log('[Running seeder]:', seeder.name)
      const instance = new seeder()
      await instance.seed({ db, state })
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log('[Seeder completed]:', seeder.name)
    })
  }
}
