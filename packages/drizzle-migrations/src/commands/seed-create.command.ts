import toCamelCase from 'lodash.camelcase'
import fs from 'node:fs'
import { BaseCommand } from './_base.command'
import { getSeederFiles } from '../helpers/seed'
import { getFileNameWithoutExtension } from '../helpers/misc-utils'

export class SeedCreateCommand extends BaseCommand<{ seederName: string }> {
  async run() {
    const dir = this.ctx.migrationFolder
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    const seeders = await getSeederFiles(this.ctx)

    const filePath = `${dir}/${this.ctx.opts.seederName}`

    let exists = false
    for (const seeder of seeders) {
      const seederName = getFileNameWithoutExtension(seeder)
      if (seederName === this.ctx.opts.seederName) {
        exists = true
        break
      }
    }

    if (exists) {
      console.error(`Seeder ${this.ctx.opts.seederName} already exists`)
      process.exit(1)
    }

    // write migration
    fs.writeFileSync(`${filePath}.ts`, this.getTemplate())

    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(`[Seed generate]: Seeder created at ${filePath}.ts`)
  }

  getTemplate() {
    // capitalize
    let nameInPascal = toCamelCase(this.ctx.opts.seederName)
    nameInPascal = nameInPascal.charAt(0).toUpperCase() + nameInPascal.slice(1)

    return `
import { BaseSeeder, type SeederContext } from './_base.seeder'

export default class ${nameInPascal} extends BaseSeeder<'${this.ctx.dialect}'> {
  async seed(ctx: SeederContext<'${this.ctx.dialect}'>) {
    // Implement seed logic here
  }
}
`
  }
}
