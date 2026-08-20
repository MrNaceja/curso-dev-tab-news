import { Controller } from "infra/controller";
import { Authentication } from "models/authentication";
import { Authorization } from "models/authorization";
import { Session } from "models/session";

const controller = new Controller();

export default controller
  .POST(controller.withAuthorizedFeaturesOnly("create:session"), createSession)
  .PATCH(controller.withAuthorizedFeaturesOnly("renew:session"), renewSession)
  .DELETE(
    controller.withAuthorizedFeaturesOnly("invalidate:session"),
    invalidateSession,
  )
  .handle.bind(controller);

async function createSession(req, res) {
  const { email, password } = req.body;
  const session = await Authentication.createUserSession({ email, password });

  /** @type {import("cookie").SetCookie} */
  const sessionCookie = {
    name: "session_id",
    value: session.id,
    path: "/",
    maxAge: Session.EXPIRES_AT_IN_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  this.setCookie(sessionCookie);

  const { user: userAuthenticated } = req.context;

  const sessionSecurePublicOutput = Authorization.withSecureOutput(
    "read:session",
    userAuthenticated,
  )(session);

  return res.status(201).json(sessionSecurePublicOutput);
}

async function renewSession(req, res) {
  const sessionId = this.getCookie("session_id");

  await Authentication.renewUserSession(sessionId);

  /** @type {import("cookie").SetCookie} */
  const sessionCookie = {
    name: "session_id",
    value: sessionId,
    path: "/",
    maxAge: Session.EXPIRES_AT_IN_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  this.setCookie(sessionCookie);

  return res.status(204).send();
}

async function invalidateSession(req, res) {
  const sessionId = this.getCookie("session_id");

  await Authentication.invalidateUserSession(sessionId);

  /** @type {import("cookie").SetCookie} */
  const sessionCookie = {
    name: "session_id",
    value: "",
    path: "/",
    maxAge: -1,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  this.setCookie(sessionCookie);

  res.status(204).send();
}
