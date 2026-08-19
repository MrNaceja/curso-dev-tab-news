import { Orchestrator } from "tests/orchestrator";
import * as Cookie from "cookie";
import { getWebserverOrigin } from "infra/controller";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("GET on /api/v1/status", () => {
  test("with Anonymous user", async () => {
    const res = await fetch(`${getWebserverOrigin()}/api/v1/status`, {
      method: "GET",
    });
    expect(res.status).toBe(200);

    const status = await res.json();

    expect(status.dependencies.database).not.toHaveProperty("postgres_version");
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
  describe("with Authenticated User", () => {
    test("with minimum feature to display status", async () => {
      const user =
        Orchestrator.User.withFeatures("read:system-status").createActivated();
      const authenticatedUserSessionTest =
        await Orchestrator.Session.withUser(user).create();
      const res = await fetch(`${getWebserverOrigin()}/api/v1/status`, {
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
      const res = await fetch(`${getWebserverOrigin()}/api/v1/status`, {
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
