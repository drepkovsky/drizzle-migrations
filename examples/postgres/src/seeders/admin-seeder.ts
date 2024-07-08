import { BaseSeeder, type SeederContext } from '@drepkovsky/drizzle-migrations'
import { usersTable } from '../schema'
import { randomUUID } from 'node:crypto'

export default class AdminSeeder extends BaseSeeder<'postgresql'> {
  async seed(ctx: SeederContext<'postgresql'>) {
    await ctx.db.insert(usersTable).values({
      name: 'admin',
      uuid: randomUUID(),
    })
  }
}
