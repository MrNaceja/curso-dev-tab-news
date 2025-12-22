import database from "infra/database";
import migrator from "node-pg-migrate";
import { join } from "node:path";

export default function handler(req, res) {
  switch (req.method) {
    case "GET":
      return GET(req, res);
    case "POST":
      return POST(req, res);
    default:
      return res.status(405).send();
  }
}

const RUN_MIGRATIONS_OPTIONS = {
  direction: "up",
  migrationsTable: "pgmigrations",
  dir: join("infra", "migrations"),
  databaseUrl: process.env.DATABASE_URL,
  verbose: true,
};

async function GET(req, res) {
  return await database.withClientConnected(async (client) => {
    const pendingMigrations = await migrator({
      ...RUN_MIGRATIONS_OPTIONS,
      dbClient: client,
      dryRun: true, // Rodando as migrations "de mentirinha"
    });
    return res.status(200).send(pendingMigrations);
  });
}
async function POST(req, res) {
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
