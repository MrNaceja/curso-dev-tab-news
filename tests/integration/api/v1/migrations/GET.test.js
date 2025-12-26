import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepare);

describe("GET on /api/v1/migrations", () => {
  describe("with Anonymous User", () => {
    test("only list pending migrations", async () => {
      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/migrations`,
        {
          method: "GET",
        },
      );
      expect(res.status).toBe(200);

      const migrations = await res.json();
      expect(Array.isArray(migrations)).toBeTruthy();

      expect(migrations.length).toBeGreaterThan(0);
    });
  });
});
