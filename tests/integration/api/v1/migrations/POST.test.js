import { ForbiddenError } from "infra/errors";
import { Orchestrator } from "tests/orchestrator";
import * as Cookie from "cookie";
import { getWebserverOrigin } from "infra/controller";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("POST on /api/v1/migrations", () => {
  test("with Anonymous user", async () => {
    const res = await fetch(`${getWebserverOrigin()}/api/v1/migrations`, {
      method: "POST",
    });
    const forbiddenError = await res.json();
    const expectedError = new ForbiddenError({
      message: "Você não possui permissão(ões) para executar esta ação.",
      action: 'Verifique se você possui a(s) feature(s) "create:migration"',
    });

    expect(res.status).toBe(403);
    expect(forbiddenError).toEqual(expectedError.toJSON());
  });
  test("with Authenticated Default User", async () => {
    const authenticatedUserSessionTest =
      await Orchestrator.Session.withRandomNewActivatedUser().create();
    const res = await fetch(`${getWebserverOrigin()}/api/v1/migrations`, {
      method: "POST",
      headers: {
        Cookie: Cookie.stringifyCookie({
          session_id: authenticatedUserSessionTest.id,
        }),
      },
    });
    const forbiddenError = await res.json();
    const expectedError = new ForbiddenError({
      message: "Você não possui permissão(ões) para executar esta ação.",
      action: 'Verifique se você possui a(s) feature(s) "create:migration"',
    });

    expect(res.status).toBe(403);
    expect(forbiddenError).toEqual(expectedError.toJSON());
  });

  describe("with Authenticated User Privileged", () => {
    test("on first time should list pending migrations", async () => {
      const userWithFeature =
        Orchestrator.User.withFeatures("create:migration").createActivated();
      const authenticatedUserSessionTest =
        await Orchestrator.Session.withUser(userWithFeature).create();

      const res = await fetch(`${getWebserverOrigin()}/api/v1/migrations`, {
        method: "POST",
        headers: {
          Cookie: Cookie.stringifyCookie({
            session_id: authenticatedUserSessionTest.id,
          }),
        },
      });
      expect(res.status).toBe(200);

      const pendingMigrations = await res.json();
      expect(Array.isArray(pendingMigrations)).toBeTruthy();
    });
    test("on second time should list executed migrations", async () => {
      const userWithFeature =
        Orchestrator.User.withFeatures("create:migration").createActivated();
      const authenticatedUserSessionTest =
        await Orchestrator.Session.withUser(userWithFeature).create();
      const res = await fetch(`${getWebserverOrigin()}/api/v1/migrations`, {
        method: "POST",
        headers: {
          Cookie: Cookie.stringifyCookie({
            session_id: authenticatedUserSessionTest.id,
          }),
        },
      });
      expect(res.status).toBe(200);

      const executedMigrations = await res.json();
      expect(Array.isArray(executedMigrations)).toBeTruthy();

      expect(executedMigrations.length).toBe(0);
    });
  });
});
