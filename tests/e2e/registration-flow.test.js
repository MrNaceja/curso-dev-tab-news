import { User } from "models/user";
import { UserActivation } from "models/user-activation";
import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("Registration flow with success", () => {
  const userTest = {
    username: "registration.flow",
    email: "registration.flow@email.com",
    password: "registration_flow",
  };
  test("Create user account", async () => {
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

  test("Receive activation email", async () => {
    const user = await User.findByUsername(userTest.username);
    const activationEmail = await Orchestrator.Email.readLatestEmail();
    expect(activationEmail).toBeDefined();
    expect(activationEmail).toEqual(
      expect.objectContaining({
        from: "<contato@naceja.com.br>",
        to: [`<${user.email}>`],
        subject: "Ative sua conta no Naceja",
      }),
    );
    expect(activationEmail.body).toContain(user.username);

    const [, extractedActivationToken] = activationEmail.body.match(
      /[?&]token=([a-f0-9-]+)/,
    );

    expect(extractedActivationToken).toBeDefined();

    expect(activationEmail.body).toContain(
      UserActivation.generateActivationLink(extractedActivationToken),
    );

    const activation = await UserActivation.findValidById(
      extractedActivationToken,
    );

    const expirationDiffInMs =
      new Date(activation.expires_at).getTime() -
      new Date(activation.created_at).getTime();

    expect(activation).toEqual(
      expect.objectContaining({
        id: extractedActivationToken,
        user_id: user.id,
        activated_at: null,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        expires_at: expect.any(Date),
      }),
    );
    expect(expirationDiffInMs).toBe(UserActivation.EXPIRES_AT_IN_MS);
  });
  test("Activate account", async () => {});
  test("Create a authenticated session (login)", async () => {});
  test("Call authenticated/private endpoint", async () => {});
});
