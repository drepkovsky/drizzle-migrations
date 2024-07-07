import { Command } from 'commander'
import { GenerateMigration } from './commands/generate-migration.command'
import { MigrateDownCommand } from './commands/migrate-down.command'
import { MigrateUpCommand } from './commands/migrate-up.command'
import { MigrationStatusCommand } from './commands/migration-status.command'
import { startTransaction } from './helpers/db-helpers'
import { buildMigrationContext, resolveDrizzleConfig } from './helpers/drizzle-config'

const program = new Command()

const getVersionFromPackageJson = () => {
  try {
    const pkg = require('../package.json')
    return pkg.version
  } catch (e) {
    return '0.0.0'
  }
}

program
  .name('drizzle-migrations')
  .description('Tiny helper for managing drizzle migrations in your project')
  .version(getVersionFromPackageJson())

program
  .command('generate')
  .option('-n, --name <name>', 'Migration name', '')
  .option('-f, --force', 'Force create migration if no schema changes detected')
  .option('--drop-cascade', 'Force all drop tables to cascade. Only for PostgreSQL')
  .action(async (options) => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())
    const command = new GenerateMigration({
      ...ctx,
      opts: {
        migrationName: options.name,
        forceAcceptWarning: Boolean(options.force),
        dropCascade: Boolean(options.dropCascade),
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
  .option('-b, --batch [batch]', 'Rollback up to until specific batch instead of the last')
  .action(async (opts) => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())
    const command = new MigrateDownCommand({
      ...ctx,
      opts: {
        batchToRollDownTo: Number(opts.batch) ?? undefined,
      },
    })
    await command.run()
    process.exit(0)
  })

program
  .command('status')
  .description('Show current status of migrations')
  .action(async () => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())
    const command = new MigrationStatusCommand(ctx)
    await command.run()
    process.exit(0)
  })

program
  .command('fresh')
  .description('Rollback all migrations')
  .action(async () => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())
    const command = new MigrateDownCommand({
      ...ctx,
      opts: {
        batchToRollDownTo: 0,
      },
    })
    await command.run()
    process.exit(0)
  })

program
  .command('refresh')
  .description('Rollback all migrations and run them again')
  .action(async () => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())

    const command = new MigrateDownCommand({
      ...ctx,
      opts: {
        batchToRollDownTo: 0,
      },
    })
    await command.run()
    const upCommand = new MigrateUpCommand(ctx)
    await upCommand.run()
    process.exit(0)
  })

program.parse()
