import database from "infra/database";

beforeAll(resetDatabase);

async function resetDatabase() {
  await database.query("DROP SCHEMA PUBLIC CASCADE; CREATE SCHEMA PUBLIC;");
}

test("GET on /api/v1/migrations should be receive 200 status code and exists a valid migrations list", async () => {
  const res = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "GET",
  });
  expect(res.status).toBe(200);

  const migrations = await res.json();
  console.info(migrations);
  expect(Array.isArray(migrations)).toBeTruthy();

  expect(migrations.length).toBeGreaterThan(0);
});
