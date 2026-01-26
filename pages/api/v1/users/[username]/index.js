import { Controller } from "infra/controller";
import { User } from "models/user";

const controller = new Controller();

export default controller
  .GET(findUserByUsername)
  .PATCH(
    controller.withAuthorizedFeaturesOnly("update:user"),
    updateUserByUsername,
  )
  .handle.bind(controller);

async function findUserByUsername(req, res) {
  const { username } = req.query;
  const userFounded = await User.findByUsername(username);
  return res.status(200).json(userFounded);
}

async function updateUserByUsername(req, res) {
  const { username: usernameTarget } = req.query;
  const { username, email, password } = req.body;

  await User.updateByUsername(usernameTarget, { username, password, email });
  return res.status(204).send();
}
