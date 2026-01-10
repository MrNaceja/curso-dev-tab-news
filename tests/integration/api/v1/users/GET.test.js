import { ForbiddenError } from "infra/errors";
import { Orchestrator } from "tests/orchestrator";
import * as Cookie from "cookie";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("GET on /api/v1/users", () => {
  test("with Anonymous user", async () => {
    const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/users`, {
      method: "GET",
    });
    const forbiddenError = await res.json();
    const expectedError = new ForbiddenError({
      message: "Você não possui permissão(ões) para executar esta ação.",
      action: 'Verifique se você possui a(s) feature(s) "read:session"',
    });

    expect(res.status).toBe(403);
    expect(forbiddenError).toEqual(expectedError.toJSON());
  });
  test("with Authenticated user", async () => {
    const authenticatedUserSessionTest =
      await Orchestrator.Session.withRandomNewActivatedUser().create();

    const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/users`, {
      method: "GET",
      headers: {
        Cookie: Cookie.stringifyCookie({
          session_id: authenticatedUserSessionTest.id,
        }),
      },
    });
    const user = await res.json();

    expect(res.status).toBe(200);
    expect(user).toEqual(
      expect.objectContaining({
        id: authenticatedUserSessionTest.user.id,
        username: authenticatedUserSessionTest.user.username,
        email: authenticatedUserSessionTest.user.email,
      }),
    );
  });
});
