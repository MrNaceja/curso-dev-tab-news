import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.beforeAll);

test("GET on /api/v1/migrations should be receive 200 status code and exists a valid migrations list", async () => {
  const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/migrations`, {
    method: "GET",
  });
  expect(res.status).toBe(200);

  const migrations = await res.json();
  console.info(migrations);
  expect(Array.isArray(migrations)).toBeTruthy();

  expect(migrations.length).toBeGreaterThan(0);
});
