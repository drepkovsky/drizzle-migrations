import { Command } from 'commander'
import { GenerateMigration } from './commands/generate-migration.command'
import { buildMigrationContext, resolveDrizzleConfig } from './helpers/drizzle-config'

const program = new Command()

program.name('drizzle-migrations').description('Drizzle migrations by @drepkovsky').version('0.1.0')

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
    return command.run()
  })

program.parse()
