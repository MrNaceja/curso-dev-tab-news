test("GET on /api/v1/status should be receive 200 status code and a valid status body fields", async () => {
  const res = await fetch("http://localhost:3000/api/v1/status", {
    method: "GET",
  });
  expect(res.status).toBe(200);

  const status = await res.json();

  console.info(status);
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
