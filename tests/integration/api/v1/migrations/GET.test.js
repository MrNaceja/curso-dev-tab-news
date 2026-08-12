import { ForbiddenError } from "infra/errors";
import { Orchestrator } from "tests/orchestrator";
import * as Cookie from "cookie";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("GET on /api/v1/migrations", () => {
  test("with Anonymous User", async () => {
    const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/migrations`, {
      method: "GET",
    });
    const forbiddenError = await res.json();
    const expectedError = new ForbiddenError({
      message: "Você não possui permissão(ões) para executar esta ação.",
      action: 'Verifique se você possui a(s) feature(s) "read:migration"',
    });

    expect(res.status).toBe(403);
    expect(forbiddenError).toEqual(expectedError.toJSON());
  });
  test("with Default Authenticated User", async () => {
    const authenticatedUserSessionTest =
      await Orchestrator.Session.withRandomNewActivatedUser().create();

    const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/migrations`, {
      method: "GET",
      headers: {
        Cookie: Cookie.stringifyCookie({
          session_id: authenticatedUserSessionTest.id,
        }),
      },
    });

    const forbiddenError = await res.json();
    const expectedError = new ForbiddenError({
      message: "Você não possui permissão(ões) para executar esta ação.",
      action: 'Verifique se você possui a(s) feature(s) "read:migration"',
    });

    expect(res.status).toBe(403);
    expect(forbiddenError).toEqual(expectedError.toJSON());
  });
  test("with Authenticated User Privileged", async () => {
    const userWithFeature =
      Orchestrator.User.withFeatures("read:migration").createActivated();
    const authenticatedUserSessionTest =
      await Orchestrator.Session.withUser(userWithFeature).create();

    const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/migrations`, {
      method: "GET",
      headers: {
        Cookie: Cookie.stringifyCookie({
          session_id: authenticatedUserSessionTest.id,
        }),
      },
    });
    expect(res.status).toBe(200);

    const migrations = await res.json();
    expect(Array.isArray(migrations)).toBeTruthy();
  });
});
