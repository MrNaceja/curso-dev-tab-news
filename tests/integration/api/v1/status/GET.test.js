import { ForbiddenError } from "infra/errors";
import { Orchestrator } from "tests/orchestrator";
import * as Cookie from "cookie";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("GET on /api/v1/status", () => {
  test("with Anonymous user", async () => {
    const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/status`, {
      method: "GET",
    });
    const forbiddenError = await res.json();
    const expectedError = new ForbiddenError({
      message: "Você não possui permissão(ões) para executar esta ação.",
      action: 'Verifique se você possui a(s) feature(s) "read:system-status"',
    });

    expect(res.status).toBe(403);
    expect(forbiddenError).toEqual(expectedError.toJSON());
  });
  describe("with Authenticated User", () => {
    test("with minimum feature to display status", async () => {
      const user =
        Orchestrator.User.withFeatures("read:system-status").createActivated();
      const authenticatedUserSessionTest =
        await Orchestrator.Session.withUser(user).create();
      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/status`, {
        method: "GET",
        headers: {
          Cookie: Cookie.stringifyCookie({
            session_id: authenticatedUserSessionTest.id,
          }),
        },
      });
      expect(res.status).toBe(200);

      const status = await res.json();

      expect(status.dependencies.database).not.toHaveProperty(
        "postgres_version",
      );
      expect(status).toEqual(
        expect.objectContaining({
          updated_at: expect.stringContaining(
            new Date(status.updated_at).toISOString(),
          ),
          dependencies: expect.objectContaining({
            database: expect.objectContaining({
              max_connections: expect.any(Number),
              opened_connections: 1,
            }),
          }),
        }),
      );
    });
    test("with feature to see postgres version", async () => {
      const user = Orchestrator.User.withFeatures(
        "read:system-status",
        "read:system-status:postgres-version",
      ).createActivated();
      const authenticatedUserSessionTest =
        await Orchestrator.Session.withUser(user).create();
      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/status`, {
        method: "GET",
        headers: {
          Cookie: Cookie.stringifyCookie({
            session_id: authenticatedUserSessionTest.id,
          }),
        },
      });
      expect(res.status).toBe(200);

      const status = await res.json();

      expect(status).toEqual(
        expect.objectContaining({
          updated_at: expect.stringContaining(
            new Date(status.updated_at).toISOString(),
          ),
          dependencies: expect.objectContaining({
            database: expect.objectContaining({
              postgres_version: expect.stringContaining("16.0"),
              max_connections: expect.any(Number),
              opened_connections: 1,
            }),
          }),
        }),
      );
    });
  });
});
