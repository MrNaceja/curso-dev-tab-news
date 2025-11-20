test("GET on /api/v1/status should be receive 200 status code", async () => {
  const res = await fetch("http://localhost:3000/api/v1/status", {
    method: "GET",
  });
  expect(res.status).toBe(200);
});
