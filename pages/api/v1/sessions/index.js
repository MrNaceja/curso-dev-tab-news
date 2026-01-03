import { Controller } from "infra/controller";
import { Authentication } from "models/authentication";
import * as Cookie from "cookie";
import { Session } from "models/session";
const controller = new Controller();

export default controller.POST(createSession).handle.bind(controller);

async function createSession(req, res) {
  const { email, password } = req.body;
  const session = await Authentication.createUserSession({ email, password });
  res.setHeader(
    "Set-Cookie",
    Cookie.stringifySetCookie({
      name: "session_id",
      value: session.id,
      path: "/",
      maxAge: Session.EXPIRES_AT_IN_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }),
  );
  return res.status(201).json(session);
}
