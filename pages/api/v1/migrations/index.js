import { Controller } from "infra/controller";
import { Migrator } from "models/migrator";

const controller = new Controller();

export default controller
  .GET(listPendingMigrations)
  .POST(runPendingMigrations)
  .handle.bind(controller);

async function listPendingMigrations(req, res) {
  const pendingMigrations = await Migrator.listPending();
  return res.status(200).send(pendingMigrations);
}

async function runPendingMigrations(req, res) {
  const migratedMigrations = await Migrator.runPending();

  if (migratedMigrations.length > 0) {
    res.status(201);
  } else {
    res.status(200);
  }

  return res.send(migratedMigrations);
}
