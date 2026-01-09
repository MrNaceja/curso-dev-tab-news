import { User } from "models/user";
import { UserActivation } from "models/user-activation";

const { Controller } = require("infra/controller");

const controller = new Controller();

export default controller.POST(createUser).handle.bind(controller);

async function createUser(req, res) {
  const { username, email, password } = req.body;
  const createdUser = await User.create({
    username,
    email,
    password,
  });
  await UserActivation.requestUserActivation(createdUser);
  return res.status(201).json(createdUser);
}
