import {
  DrizzleSnapshotJSON,
  generateDrizzleJson,
  generateMigration,
} from 'drizzle-kit/api';
import { BaseCommand } from './_base.command';
import fs from 'node:fs';
import prompts from 'prompts';
type GenerateMigrationOptions = {
  migrationName: string;
  forceAcceptWarning?: boolean;
  dropCascade?: boolean;
};

export class MigrationGenerateCommand extends BaseCommand<GenerateMigrationOptions> {
  async run() {
    const dir = this.ctx.migrationFolder;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    // const {
    //   generateDrizzleJson,
    //   generateMigration,
    // } = require('drizzle-kit/payload');

    const [yyymmdd, hhmmss] = new Date().toISOString().split('T');
    const formattedDate = yyymmdd!.replace(/\D/g, '');
    const formattedTime = hhmmss!.split('.')[0]!.replace(/\D/g, '');

    const timestamp = `${formattedDate}_${formattedTime}`;

    const fileName = this.ctx.opts.migrationName
      ? `${timestamp}_${this.ctx.opts.migrationName.replace(/\W/g, '_')}`
      : `${timestamp}`;

    const filePath = `${dir}/${fileName}`;

    let drizzleJsonBefore = this.getDefaultDrizzleSnapshot(this.ctx.dialect);

    // Get latest migration snapshot
    const latestSnapshot = fs
      .readdirSync(dir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse()?.[0];

    if (latestSnapshot) {
      const latestSnapshotJSON = JSON.parse(
        fs.readFileSync(`${dir}/${latestSnapshot}`, 'utf8'),
      ) as DrizzleSnapshotJSON;

      drizzleJsonBefore = latestSnapshotJSON;
    }

    const drizzleJsonAfter = generateDrizzleJson(this.ctx.schema);
    const sqlStatementsUp = await generateMigration(
      drizzleJsonBefore,
      drizzleJsonAfter,
    );
    const sqlStatementsDown = await generateMigration(
      drizzleJsonAfter,
      drizzleJsonBefore,
    );

    if (
      !sqlStatementsUp.length &&
      !sqlStatementsDown.length &&
      !this.ctx.opts.forceAcceptWarning
    ) {
      const { confirm: shouldCreateBlankMigration } = await prompts(
        {
          name: 'confirm',
          type: 'confirm',
          initial: false,
          message:
            'No schema changes detected. Would you like to create a blank migration file?',
        },
        {
          onCancel: () => {
            process.exit(0);
          },
        },
      );

      if (!shouldCreateBlankMigration) {
        process.exit(0);
      }
    }

    // write schema
    fs.writeFileSync(
      `${filePath}.json`,
      JSON.stringify(drizzleJsonAfter, null, 2),
    );

    // write migration
    fs.writeFileSync(
      `${filePath}.ts`,
      this.getTemplate({
        up: sqlStatementsUp.length ? sqlStatementsUp?.join('\n') : '',
        down: sqlStatementsDown.length
          ? sqlStatementsDown?.join('\n')
          : '',
      }),
    );

    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log(`[Generate]: Migration created at ${filePath}.ts`);
  }

  private getTemplate(statement: { up: string; down: string }) {
    const upSQL = statement.up;
    let downSQL = statement.down;

    // if we detect DROP TABLE syntax in downSQL ensure we add CASCADE if the user has specified it
    if (
      this.ctx.opts.dropCascade &&
      downSQL?.includes('DROP TABLE') &&
      this.ctx.dialect === 'postgresql'
    ) {
      // ensure find all lines that contain DROP TABLE and add CASCADE at the end if it doesn't already have it
      downSQL = downSQL
        .split('\n')
        .map(line => {
          if (line.includes('DROP TABLE') && !line.includes('CASCADE')) {
            return line.replace(';', ' CASCADE;');
          }
          return line;
        })
        .join('\n');
    }

    const executeCommand = this.ctx.dialect === 'sqlite' ? 'run' : 'execute';
    return `
  import { sql } from 'drizzle-orm'
  import type { MigrationArgs } from '@llong2195/drizzle-migrations'

  export async function up({ db }: MigrationArgs<'${
    this.ctx.dialect
  }'>): Promise<void> {
  ${
    upSQL
      ? `await db.${executeCommand}(sql\`
          ${upSQL}
        \`);
  `
      : '// Migration code'
  }
  };

  export async function down({ db }: MigrationArgs<'${
    this.ctx.dialect
  }'>): Promise<void> {
  ${
    downSQL
      ? `await db.${executeCommand}(sql\`
          ${downSQL}
        \`);
  `
      : '// Migration code'
  }
  };
  `;
  }

  getDefaultDrizzleSnapshot(
    dialect: DrizzleSnapshotJSON['dialect'],
  ): DrizzleSnapshotJSON {
    return {
      id: '00000000-0000-0000-0000-000000000000',
      _meta: {
        columns: {},
        schemas: {},
        tables: {},
      },
      dialect: dialect,
      enums: {},
      prevId: '00000000-0000-0000-0000-00000000000',
      schemas: {},
      tables: {},
      version: '7',
    };
  }
}
