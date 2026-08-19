import { Controller } from "infra/controller";
import { Authorization } from "models/authorization";
import { User } from "models/user";
import { UserActivation } from "models/user-activation";

const controller = new Controller();

export default controller
  .POST(controller.withAuthorizedFeaturesOnly("create:user"), createUser)
  .GET(
    controller.withAuthorizedFeaturesOnly("read:session"),
    showAuthenticatedUser,
  )
  .handle.bind(controller);

async function createUser(req, res) {
  const { user: authenticatedUser } = req.context;
  const { username, email, password } = req.body;
  const createdUser = await User.create({
    username,
    email,
    password,
  });
  await UserActivation.requestUserActivation(createdUser);
  const userSecurePublicOutput = Authorization.withSecureOutput(
    "read:user",
    authenticatedUser,
  )(createdUser);
  return res.status(201).json(userSecurePublicOutput);
}

async function showAuthenticatedUser(req, res) {
  const { user: authenticatedUser } = req.context;
  const userSecurePublicOutput = Authorization.withSecureOutput(
    "read:user",
    authenticatedUser,
  )(authenticatedUser);
  return res.status(200).send(userSecurePublicOutput);
}
