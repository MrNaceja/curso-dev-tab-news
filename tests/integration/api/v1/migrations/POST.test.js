import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepare);

describe("POST on /api/v1/migrations", () => {
  describe("with Anonymous user", () => {
    test("on first time should list pending migrations", async () => {
      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/migrations`,
        {
          method: "POST",
        },
      );
      expect(res.status).toBe(201);

      const pendingMigrations = await res.json();
      expect(Array.isArray(pendingMigrations)).toBeTruthy();

      expect(pendingMigrations.length).toBeGreaterThan(0);
    });
    test("on second time should list executed migrations", async () => {
      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/migrations`,
        {
          method: "POST",
        },
      );
      expect(res.status).toBe(200);

      const executedMigrations = await res.json();
      expect(Array.isArray(executedMigrations)).toBeTruthy();

      expect(executedMigrations.length).toBe(0);
    });
  });
});
