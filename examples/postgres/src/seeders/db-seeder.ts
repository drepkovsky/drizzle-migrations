import { BaseSeeder, type SeederContext } from '@drepkovsky/drizzle-migrations'
import AdminSeeder from './admin-seeder'

export default class DbSeeder extends BaseSeeder<'postgresql'> {
  async seed(ctx: SeederContext<'postgresql'>) {
    return this.call(ctx.db, [AdminSeeder])
  }
}
