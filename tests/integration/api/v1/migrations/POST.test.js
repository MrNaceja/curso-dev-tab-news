import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepare);

test("POST on /api/v1/migrations should be receive 200 status code and exists a valid migrations list and check for granted migration execution", async () => {
  const res1 = await fetch(`${process.env.WEBSERVER_URL}/api/v1/migrations`, {
    method: "POST",
  });
  expect(res1.status).toBe(201);

  const migrations1 = await res1.json();
  console.info(migrations1);
  expect(Array.isArray(migrations1)).toBeTruthy();

  expect(migrations1.length).toBeGreaterThan(0);

  const res2 = await fetch(`${process.env.WEBSERVER_URL}/api/v1/migrations`, {
    method: "POST",
  });
  expect(res2.status).toBe(200);

  const migrations2 = await res2.json();
  console.info(migrations2);
  expect(Array.isArray(migrations2)).toBeTruthy();

  expect(migrations2.length).toBe(0);
});
