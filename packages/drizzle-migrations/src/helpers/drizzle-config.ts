import fs from 'node:fs'
import path from 'node:path'
import * as tsx from 'tsx/cjs/api'
import type { ConfigWithMigrator } from '..'

export function resolveDrizzleConfig() {
  const configFileNames = ['drizzle.config.ts', 'drizzle.config.tsx']
  let currentDir = process.cwd()

  while (true) {
    for (const configFileName of configFileNames) {
      const configFilePath = path.join(currentDir, configFileName)
      if (fs.existsSync(configFilePath)) {
        return configFilePath
      }
    }
    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir || fs.existsSync(path.join(currentDir, '.git'))) {
      // If we reached the root or found a .git directory, stop searching
      break
    }

    currentDir = parentDir
  }

  throw new Error(
    'drizzle.config.ts{x} not found in the current directory or any parent directories.'
  )
}

export async function buildMigrationContext(drizzleConfigPath: string) {
  let drizzleConfig: ConfigWithMigrator | undefined = undefined
  try {
    drizzleConfig = tsx.require(drizzleConfigPath, __filename).default as ConfigWithMigrator
  } catch (e) {
    console.error(e)
  }
  if (!drizzleConfig) {
    throw new Error(`Failed to load drizzle config from ${drizzleConfigPath}`)
  }

  if (!drizzleConfig.out?.length) {
    throw new Error(
      'Drizzle config must have an "out" field specified, so that migrations can be generated.'
    )
  }

  if (!drizzleConfig.schema) {
    throw new Error(
      'Drizzle config must have a "schema" field specified, so that migrations can be generated.'
    )
  }

  if (!drizzleConfig.getMigrator) {
    throw new Error(
      'Drizzle config must have a "getMigrator" field specified, so that migrations can be generated.'
    )
  }

  const drizzleFolder = path.dirname(drizzleConfigPath)

  const schemaArr = Array.isArray(drizzleConfig.schema)
    ? drizzleConfig.schema
    : [drizzleConfig.schema]
  const schemaObj: Record<string, any> = {}

  for (const schemaPath of schemaArr) {
    const schemaTs = tsx.require(path.join(drizzleFolder, schemaPath), __filename)
    Object.assign(schemaObj, schemaTs)
  }

  return {
    migrationFolder: drizzleConfig.out,
    schema: schemaObj,
    dialect: drizzleConfig.dialect,
    getMigrator: drizzleConfig.getMigrator,
    opts: {},
  }
}

export type MigrationContext<TOpts extends Record<string, any>> = Omit<
  Awaited<ReturnType<typeof buildMigrationContext>>,
  'opts'
> & {
  opts: TOpts
}
