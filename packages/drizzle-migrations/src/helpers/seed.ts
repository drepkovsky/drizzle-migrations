import fs from 'node:fs';
import fsp from 'node:fs/promises';
import type { MigrationContext } from './drizzle-config';

export async function getSeederFiles(ctx: MigrationContext) {
  if (!ctx.seed) {
    return [];
  }

  const dir = ctx.seed.dirPath;
  if (!fs.existsSync(dir)) {
    throw new Error(
      `Seeder folder ${dir} does not exist. Please create it first.`,
    );
  }
  //   if file is (ts,tsx,js,cjs,mjs,jsx) then return file

  const seederFiles = (await fsp.readdir(dir)).filter(file => {
    const ext = file.split('.').pop();
    if (!ext) return false;
    return ['ts', 'tsx', 'js', 'cjs', 'mjs', 'jsx'].includes(ext);
  });

  return seederFiles;
}
