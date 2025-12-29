import database from "infra/database";
import migrator from "node-pg-migrate";
import Path from "node:path";

const RUN_MIGRATIONS_OPTIONS = {
  direction: "up",
  migrationsTable: "pgmigrations",
  dir: Path.resolve("infra", "migrations"),
  databaseUrl: process.env.DATABASE_URL,
  verbose: true,
};

export const Migrator = {
  async listPending() {
    return await database.withClientConnected(async (client) => {
      const pendingMigrations = await migrator({
        ...RUN_MIGRATIONS_OPTIONS,
        dbClient: client,
        dryRun: true, // Rodando as migrations "de mentirinha"
      });
      return pendingMigrations;
    });
  },
  async runPending() {
    return await database.withClientConnected(async (client) => {
      const migratedMigrations = await migrator({
        ...RUN_MIGRATIONS_OPTIONS,
        dbClient: client,
        dryRun: false, // Rodando as migrations pra valer!
      });

      return migratedMigrations;
    });
  },
};
