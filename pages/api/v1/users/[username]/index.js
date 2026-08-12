import { Controller } from "infra/controller";
import { Authorization } from "models/authorization";
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
  const { user: userAuthenticated } = req.context;
  const userFounded = await User.findByUsername(username);
  const userSecurePublicOutput = Authorization.withSecureOutput(
    "read:user",
    userAuthenticated,
  )(userFounded);
  return res.status(200).json(userSecurePublicOutput);
}

async function updateUserByUsername(req, res) {
  const { username: usernameTarget } = req.query;
  const { username, email, password } = req.body;
  const { user } = req.context;

  const userTarget = await User.findByUsername(usernameTarget);
  await Authorization.validate(user, "update:user", userTarget.id);

  await User.updateByUsername(usernameTarget, { username, password, email });
  return res.status(204).send();
}
