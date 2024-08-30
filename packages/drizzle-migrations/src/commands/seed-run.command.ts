import path from 'node:path';
import tsx from 'tsx/cjs/api';
import { type ConfigDialect } from '..';
import { getFileNameWithoutExtension } from '../helpers/misc-utils';
import { getSeederFiles } from '../helpers/seed';
import type { BaseSeederConstructor } from '../seed/_base.seeder';
import { SeedRunner } from '../seed/seed-runner';
import { BaseCommand } from './_base.command';

export class SeedRunCommand extends BaseCommand<{ seederName: string }> {
  async run() {
    const seederFiles = await getSeederFiles(this.ctx);

    if (!seederFiles.length) {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log('[Seed run]: No seeders to run');
      return;
    }

    for (const seederFile of seederFiles) {
      const seederName = getFileNameWithoutExtension(seederFile);

      if (this.ctx.opts.seederName && this.ctx.opts.seederName !== seederName) {
        continue;
      }

      const seeder = tsx.require(
        path.join(this.ctx.seed!.dirPath, seederFile),
        __filename,
      ).default as BaseSeederConstructor<ConfigDialect>;

      const seedRunner = new SeedRunner(this.ctx);

      await seedRunner.run(seeder, {});
    }
  }
}
