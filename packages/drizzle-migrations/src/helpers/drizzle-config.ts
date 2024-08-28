import fs from 'node:fs';
import path from 'node:path';
import * as tsx from 'tsx/cjs/api';
import type { ConfigDialect, DBClient, DrizzleMigrationsConfig } from '..';

export function resolveDrizzleConfig() {
  const configFileNames = [
    'drizzle.migration.config.ts',
    'drizzle.migration.config.tsx',
    'drizzle.migration.config.js',
    'drizzle.migration.config.jsx',
    'drizzle.migration.config.cjs',
    'drizzle.migration.config.mjs',
  ];
  let currentDir = process.cwd();

  while (true) {
    for (const configFileName of configFileNames) {
      const configFilePath = path.join(currentDir, configFileName);
      if (fs.existsSync(configFilePath)) {
        return configFilePath;
      }
    }
    const parentDir = path.dirname(currentDir);
    if (
      parentDir === currentDir ||
      fs.existsSync(path.join(currentDir, '.git'))
    ) {
      // If we reached the root or found a .git directory, stop searching
      break;
    }

    currentDir = parentDir;
  }

  throw new Error(
    'drizzle.migration.config.ts{x} not found in the current directory or any parent directories.',
  );
}

export async function buildMigrationContext(drizzleConfigPath: string) {
  let drizzleConfig: DrizzleMigrationsConfig | undefined = undefined;
  try {
    drizzleConfig = tsx.require(drizzleConfigPath, __filename)
      .default as DrizzleMigrationsConfig;
  } catch (e) {
    console.error(e);
  }
  if (!drizzleConfig) {
    throw new Error(`Failed to load drizzle config from ${drizzleConfigPath}`);
  }

  if (!drizzleConfig.out?.length) {
    throw new Error(
      'Drizzle config must have an "out" field specified, so that migrations can be generated.',
    );
  }

  if (!drizzleConfig.schema) {
    throw new Error(
      'Drizzle config must have a "schema" field specified, so that migrations can be generated.',
    );
  }

  if (!drizzleConfig.getMigrator) {
    throw new Error(
      'Drizzle config must have a "getMigrator" field specified.',
    );
  }

  const drizzleFolder = path.dirname(drizzleConfigPath);

  const schemaArr = Array.isArray(drizzleConfig.schema)
    ? drizzleConfig.schema
    : [drizzleConfig.schema];
  const schemaObj: Record<string, any> = {};

  for (const schemaPath of schemaArr) {
    const schemaTs = tsx.require(
      path.join(drizzleFolder, schemaPath),
      __filename,
    );
    Object.assign(schemaObj, schemaTs);
  }

  return {
    migrationFolder: path.join(drizzleFolder, drizzleConfig.out),
    schema: schemaObj,
    dialect: drizzleConfig.dialect,
    client: (await drizzleConfig.getMigrator()) as DBClient<
      typeof drizzleConfig.dialect
    >,
    migrationTable: drizzleConfig.migrations?.table || 'drizzle_migrations',
    migrationSchema: drizzleConfig.migrations?.schema || 'public',
    opts: {},
    seed: drizzleConfig.seed
      ? {
          dirPath: path.join(drizzleFolder, drizzleConfig.seed.dirPath),
          defaultSeeder: drizzleConfig.seed.defaultSeeder || 'db-seeder',
        }
      : undefined,
  } as MigrationContext;
}

export type MigrationContext<
  TOpts extends Record<string, any> = Record<string, any>,
  TDialect extends ConfigDialect = ConfigDialect,
> = {
  migrationFolder: string;
  schema: Record<string, any>;
  dialect: TDialect;
  client: DBClient<TDialect>;
  migrationTable: string;
  migrationSchema: string;
  opts: TOpts;
  seed?: DrizzleMigrationsConfig['seed'];
} & (
  | {
      dialect: 'sqlite';
      client: DBClient<'sqlite'>;
    }
  | {
      dialect: 'mysql';
      client: DBClient<'mysql'>;
    }
  | {
      dialect: 'postgresql';
      client: DBClient<'postgresql'>;
    }
);
