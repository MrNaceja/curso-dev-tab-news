import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepare);

describe("GET on /api/v1/status", () => {
  describe("with Anonymous user", () => {
    test("show current system status", async () => {
      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/status`, {
        method: "GET",
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
