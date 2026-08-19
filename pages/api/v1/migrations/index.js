import { Controller } from "infra/controller";
import { Authorization } from "models/authorization";
import { Migrator } from "models/migrator";

const controller = new Controller();

export default controller
  .GET(
    controller.withAuthorizedFeaturesOnly("read:migration"),
    listPendingMigrations,
  )
  .POST(
    controller.withAuthorizedFeaturesOnly("create:migration"),
    runPendingMigrations,
  )
  .handle.bind(controller);

async function listPendingMigrations(req, res) {
  const { user: userAuthenticated } = req.context;
  const pendingMigrations = await Migrator.listPending();
  const pendingMigrationsSecurePublicOutput = Authorization.withSecureOutput(
    "read:migration",
    userAuthenticated,
  )(pendingMigrations);
  return res.status(200).send(pendingMigrationsSecurePublicOutput);
}

async function runPendingMigrations(req, res) {
  const { user: userAuthenticated } = req.context;
  const migratedMigrations = await Migrator.runPending();

  if (migratedMigrations.length > 0) {
    res.status(201);
  } else {
    res.status(200);
  }

  const migratedMigrationsSecurePublicOutput = Authorization.withSecureOutput(
    "read:migration",
    userAuthenticated,
  )(migratedMigrations);

  return res.send(migratedMigrationsSecurePublicOutput);
}
