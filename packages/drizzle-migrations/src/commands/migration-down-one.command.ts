import path from "node:path";
import * as tsx from "tsx/cjs/api";
import type { ConfigDialect, Migration } from "..";
import { startTransaction } from "../helpers/db-helpers";
import {
  deleteMigrationByName,
  ensureMigrationTable,
  getMigrationWithHighestIndex,
} from "../helpers/migration";
import { BaseCommand } from "./_base.command";

export class MigrationDownOneCommand extends BaseCommand {
  async run() {
    await ensureMigrationTable(this.ctx);

    const migrationNameWithHighestIndex = await getMigrationWithHighestIndex(
      this.ctx
    );

    if (!migrationNameWithHighestIndex) {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log("[Down One]: No migrations to roll back");
      return;
    }

    await startTransaction(this.ctx, async (trx) => {
      const migrationFile = `${migrationNameWithHighestIndex}.ts`;

      const migration = tsx.require(
        path.join(this.ctx.migrationFolder, migrationFile),
        __filename
      ) as Migration<ConfigDialect>;

      if (!migration.down) {
        throw new Error(
          `Migration ${migrationNameWithHighestIndex} is missing a down function`
        );
      }

      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log(`[Down One]: ${migrationNameWithHighestIndex} is running`);
      await migration.down({ db: trx });
      await deleteMigrationByName(migrationNameWithHighestIndex, {
        ...this.ctx,
        client: trx as any,
      });
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log(
        `[Down One]: ${migrationNameWithHighestIndex} run successfully`
      );
    });
  }
}
