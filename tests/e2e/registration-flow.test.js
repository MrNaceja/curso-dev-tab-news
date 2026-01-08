import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("Registration flow with success", () => {
  test("Create user account", async () => {
    const userTest = {
      username: "registration.flow",
      email: "registration.flow@email.com",
      password: "registration_flow",
    };
    const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userTest),
    });

    const createdUser = await res.json();

    expect(res.status).toBe(201);
    expect(createdUser).toEqual(
      expect.objectContaining({
        created_at: expect.stringContaining(
          new Date(createdUser.created_at).toISOString(),
        ),
        updated_at: expect.stringContaining(
          new Date(createdUser.updated_at).toISOString(),
        ),
        id: expect.stringContaining(createdUser.id),
        username: expect.stringContaining(userTest.username),
        email: expect.stringContaining(userTest.email),
        password: expect.stringContaining(createdUser.password),
        features: ["read:activation-token"],
      }),
    );
  });

  test("Receive activation email", async () => {});
  test("Activate account", async () => {});
  test("Create a authenticated session (login)", async () => {});
  test("Call auhtenticated/private endpoint", async () => {});
});
