import { Command } from 'commander'
import { GenerateMigration } from './commands/generate-migration.command'
import { MigrateUpCommand } from './commands/migrate-up.command'
import { buildMigrationContext, resolveDrizzleConfig } from './helpers/drizzle-config'
import { MigrateDownCommand } from './commands/migrate-down.command'

const program = new Command()

program
  .name('drizzle-migrations')
  .description('Tiny helper for managing drizzle migrations in your project')
  .version('0.1.3')

program
  .command('generate')
  .option('-n, --name <name>', 'Migration name', '')
  .action(async (options) => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())
    const command = new GenerateMigration({
      ...ctx,
      opts: {
        migrationName: options.name,
      },
    })
    await command.run()
    process.exit(0)
  })

program
  .command('up')
  .description('Run all pending migrations')
  .action(async () => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())
    const command = new MigrateUpCommand(ctx)
    await command.run()
    process.exit(0)
  })

program
  .command('down')
  .description('Rollback last batch of migrations')
  .action(async () => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())
    const command = new MigrateDownCommand(ctx)
    await command.run()
    process.exit(0)
  })

program.parse()
