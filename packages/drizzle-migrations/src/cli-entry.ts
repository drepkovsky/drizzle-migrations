import { Command } from 'commander'
import toKebabCase from 'lodash.kebabcase'
import toSnakeCase from 'lodash.snakecase'
import { MigrationDownCommand } from './commands/migration-down.command'
import { MigrationGenerateCommand } from './commands/migration-generate.command'
import { MigrationStatusCommand } from './commands/migration-status.command'
import { MigrationUpCommand } from './commands/migration-up.command'
import { SeedCreateCommand } from './commands/seed-create.command'
import { SeedRunCommand } from './commands/seed-run.command'
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
  .option('-n, --name <name>', 'Migration name')
  .option('-f, --force', 'Force create migration if no schema changes detected')
  .option('--drop-cascade', 'Force all drop tables to cascade. Only for PostgreSQL')
  .action(async (options) => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())

    if (!options.name) {
      console.error('Migration name is required')
      process.exit(1)
    }

    const command = new MigrationGenerateCommand({
      ...ctx,
      opts: {
        migrationName: toSnakeCase((options.name ?? '').trim()),
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
    const command = new MigrationUpCommand(ctx)
    await command.run()
    process.exit(0)
  })

program
  .command('down')
  .description('Rollback last batch of migrations')
  .option('-b, --batch [batch]', 'Rollback up to until specific batch instead of the last')
  .action(async (opts) => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())
    const command = new MigrationDownCommand({
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
    const command = new MigrationDownCommand({
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

    const command = new MigrationDownCommand({
      ...ctx,
      opts: {
        batchToRollDownTo: 0,
      },
    })
    await command.run()
    const upCommand = new MigrationUpCommand(ctx)
    await upCommand.run()
    process.exit(0)
  })

program
  .command('seed:create')
  .description('Create a new seeder')
  .option('-n, --name <name>', 'Seeder name')
  .action(async (opts) => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())
    if (!ctx.seed) {
      console.error('Seed configuration is not defined in drizzle config')
      process.exit(1)
    }

    if (!opts.name) {
      opts.name = ctx.seed?.defaultSeeder ?? 'db-seeder'
    }

    const command = new SeedCreateCommand({
      ...ctx,
      opts: {
        seederName: toKebabCase(opts.name),
      },
    })

    await command.run()

    process.exit(0)
  })

program
  .command('seed:run')
  .option('-n, --name <name>', 'Seeder name')
  .description('Run seeders')
  .action(async (opts) => {
    const ctx = await buildMigrationContext(resolveDrizzleConfig())
    if (!ctx.seed) {
      console.error('Seed configuration is not defined in drizzle config')
      process.exit(1)
    }

    if (!opts.name) {
      opts.name = ctx.seed?.defaultSeeder ?? 'db-seeder'
    }

    const command = new SeedRunCommand({
      ...ctx,
      opts: {
        seederName: toKebabCase(opts.name),
      },
    })

    await command.run()

    process.exit(0)
  })

try {
  program.parse()
} catch (e) {
  console.error(e)
  process.exit(1)
}
