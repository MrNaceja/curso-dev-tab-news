import { Controller } from "infra/controller";
import { UserActivation } from "models/user-activation";

const controller = new Controller();

export default controller.PATCH(activateUser).handle.bind(controller);

async function activateUser(req, res) {
  const { token: activationToken } = req.query;
  await UserActivation.activate(activationToken);
  return res.status(204).send();
}
