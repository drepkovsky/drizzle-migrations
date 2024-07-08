import type { ConfigDialect, DBClient } from '..'

export type SeederContext<TDialect extends ConfigDialect> = {
  db: DBClient<TDialect>
  state?: Record<string, any>
}

export interface BaseSeederConstructor<TDialect extends ConfigDialect> {
  new (): BaseSeeder<TDialect>
}

export abstract class BaseSeeder<TDialect extends ConfigDialect> {
  abstract seed(ctx: SeederContext<TDialect>): Promise<void>
  protected async call(db: DBClient<TDialect>, seeder: BaseSeederConstructor<TDialect>[]) {
    const state: Record<string, any> = {}
    for (const s of seeder) {
      const seeder = new s()
      await seeder.seed({ db, state })
    }
  }
}
