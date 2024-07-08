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
      const instance = new seeder()
      await instance.seed({ db, state })
    })
  }
}
