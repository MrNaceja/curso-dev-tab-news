import { Controller } from "infra/controller";
import { Authentication } from "models/authentication";

const controller = new Controller();

export default controller.POST(createSession).handle.bind(controller);

async function createSession(req, res) {
  const { email, password } = req.body;
  const session = await Authentication.createUserSession({ email, password });
  return res.status(201).json(session);
}
