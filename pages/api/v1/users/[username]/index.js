import { User } from "models/user";

const { Controller } = require("infra/controller");

const controller = new Controller();

export default controller.GET(findUserByUsername).handle.bind(controller);

async function findUserByUsername(req, res) {
  const { username } = req.query;
  const userFounded = await User.findOneByUsername(username);
  return res.status(200).json(userFounded);
}
