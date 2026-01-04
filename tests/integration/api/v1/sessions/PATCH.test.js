import { Orchestrator } from "tests/orchestrator";
import * as Cookie from "cookie";
import { UnauthorizedError } from "infra/errors";
import { Session } from "models/session";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("PATCH on /api/v1/sessions", () => {
  describe("With Authenticated user", () => {
    test("with nonexistent session cookie", async () => {
      const nonExistentSessionId = "f0cc8bb5-a5c9-42e6-862c-97d2b0228e03";

      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/sessions`, {
        method: "PATCH",
        headers: {
          Cookie: Cookie.stringifyCookie({
            session_id: nonExistentSessionId,
          }),
        },
      });

      const errorBody = await res.json();

      const expectedUnauthorizedError = new UnauthorizedError({
        message: "Usuário não possui sessão ativa.",
        action: "Tente efetuar o login novamente",
      });

      expect(res.status).toBe(expectedUnauthorizedError.statusCode);
      expect(errorBody).toEqual(expectedUnauthorizedError.toJSON());
    });
    test("with expired session cookie", async () => {
      const past30DaysInMs = Date.now() - Session.EXPIRES_AT_IN_MS;

      const authenticatedUserSessionTest = await Orchestrator.withTimeTravel(
        async () => Orchestrator.Session.withRandomNewUser().create(),
        past30DaysInMs,
      );

      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/sessions`, {
        method: "PATCH",
        headers: {
          Cookie: Cookie.stringifyCookie({
            session_id: authenticatedUserSessionTest.id,
          }),
        },
      });

      const errorBody = await res.json();

      const expectedUnauthorizedError = new UnauthorizedError({
        message: "Usuário não possui sessão ativa.",
        action: "Tente efetuar o login novamente",
      });

      expect(res.status).toBe(expectedUnauthorizedError.statusCode);
      expect(errorBody).toEqual(expectedUnauthorizedError.toJSON());
    });
    test("with active and valid session cookie", async () => {
      const authenticatedUserSessionTest =
        await Orchestrator.Session.withRandomNewUser().create();

      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/sessions`, {
        method: "PATCH",
        headers: {
          Cookie: Cookie.stringifyCookie({
            session_id: authenticatedUserSessionTest.id,
          }),
        },
      });

      expect(res.status).toBe(204);

      const renewedSession = await Session.findValidById(
        authenticatedUserSessionTest.id,
      );

      expect(
        renewedSession.updated_at > authenticatedUserSessionTest.updated_at,
      ).toBeTruthy();
      expect(
        renewedSession.expires_at > authenticatedUserSessionTest.expires_at,
      ).toBeTruthy();

      const cookies = Orchestrator.extractCookiesFromResponse(res);
      expect(cookies.session_id).toEqual({
        name: "session_id",
        value: authenticatedUserSessionTest.id,
        maxAge: Session.EXPIRES_AT_IN_MS / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
