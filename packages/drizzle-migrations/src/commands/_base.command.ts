import type { MigrationContext } from '../helpers/drizzle-config'

export abstract class BaseCommand<TOpts extends Record<string, any>> {
  constructor(protected readonly ctx: MigrationContext<TOpts>) {}
  abstract run(): Promise<void>
}
