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
        features: ["activate:user"],
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

    const activationToken =
      Orchestrator.extractActivationTokenFromActivationEmailBody(
        activationEmail.body,
      );

    expect(activationToken).toBeDefined();

    expect(activationEmail.body).toContain(
      UserActivation.generateActivationLink(activationToken),
    );

    const activation = await UserActivation.findValidById(activationToken);

    const expirationDiffInMs =
      new Date(activation.expires_at).getTime() -
      new Date(activation.created_at).getTime();

    expect(activation).toEqual(
      expect.objectContaining({
        id: activationToken,
        user_id: user.id,
        activated_at: null,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        expires_at: expect.any(Date),
      }),
    );
    expect(expirationDiffInMs).toBe(UserActivation.EXPIRES_AT_IN_MS);
  });
  test("Activate account", async () => {
    const activationEmail = await Orchestrator.Email.readLatestEmail();
    const activationToken =
      Orchestrator.extractActivationTokenFromActivationEmailBody(
        activationEmail.body,
      );
    const res = await fetch(
      `${process.env.WEBSERVER_URL}/api/v1/users/activate/${activationToken}`,
      {
        method: "PATCH",
      },
    );

    expect(res.status).toBe(204);

    const activation = await UserActivation.findById(activationToken);
    expect(activation.activated_at).not.toBeNull();
    expect(activation.activated_at).toBeInstanceOf(Date);

    const activatedUser = await User.findByUsername(userTest.username);

    expect(activatedUser.features).toEqual(
      expect.arrayContaining([
        "create:session",
        "renew:session",
        "invalidate:session",
      ]),
    );
  });
  test("Create a authenticated session (login)", async () => {
    const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userTest.email,
        password: userTest.password,
      }),
    });
    expect(res.status).toBe(201);
  });
  test("Call authenticated/private endpoint", async () => {});
});
