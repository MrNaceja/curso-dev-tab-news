import { Controller } from "infra/controller";
import database from "infra/database";
import migrator from "node-pg-migrate";
import Path from "node:path";

const controller = new Controller();

const RUN_MIGRATIONS_OPTIONS = {
  direction: "up",
  migrationsTable: "pgmigrations",
  dir: Path.resolve("infra", "migrations"),
  databaseUrl: process.env.DATABASE_URL,
  verbose: true,
};

export default controller
  .GET(listPendingMigrations)
  .POST(executePendingMigrations)
  .handle.bind(controller);

async function listPendingMigrations(req, res) {
  return await database.withClientConnected(async (client) => {
    const pendingMigrations = await migrator({
      ...RUN_MIGRATIONS_OPTIONS,
      dbClient: client,
      dryRun: true, // Rodando as migrations "de mentirinha"
    });
    return res.status(200).send(pendingMigrations);
  });
}

async function executePendingMigrations(req, res) {
  return await database.withClientConnected(async (client) => {
    const migratedMigrations = await migrator({
      ...RUN_MIGRATIONS_OPTIONS,
      dbClient: client,
      dryRun: false, // Rodando as migrations pra valer!
    });

    if (migratedMigrations.length > 0) {
      res.status(201);
    } else {
      res.status(200);
    }

    return res.send(migratedMigrations);
  });
}
