import { Controller } from "infra/controller";
import { Authentication } from "models/authentication";
import { Session } from "models/session";
const controller = new Controller();

export default controller
  .POST(createSession)
  .PATCH(renewSession)
  .handle.bind(controller);

async function createSession(req, res) {
  const { email, password } = req.body;
  const session = await Authentication.createUserSession({ email, password });

  this.setCookie({
    name: "session_id",
    value: session.id,
    path: "/",
    maxAge: Session.EXPIRES_AT_IN_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(201).json(session);
}

async function renewSession(req, res) {
  const sessionId = this.getCookie("session_id");

  await Authentication.renewUserSession(sessionId);

  this.setCookie({
    name: "session_id",
    value: sessionId,
    path: "/",
    maxAge: Session.EXPIRES_AT_IN_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(204).end();
}
