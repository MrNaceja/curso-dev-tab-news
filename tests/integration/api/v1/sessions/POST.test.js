import { UnauthorizedError } from "infra/errors";
import { Session } from "models/session";
import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("POST on api/v1/sessions", () => {
  describe("With Anonymous user", () => {
    test("when passing correct password but incorrect email", async () => {
      const correctPassword = "correct_password";
      await Orchestrator.User.withPassword(correctPassword).create();

      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "incorrect@email.com",
          password: correctPassword,
        }),
      });
      const errorBody = await res.json();

      expect(res.status).toBe(401);

      expect(errorBody).toEqual(
        new UnauthorizedError({
          message: "Credenciais inválidas.",
          action: "Verifique as credenciais informadas.",
        }).toJSON(),
      );
    });
    test("when passing correct email but incorrect password", async () => {
      const correctEmail = "correct@email";
      await Orchestrator.User.withEmail(correctEmail).create();

      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: correctEmail,
          password: "incorrect_password",
        }),
      });
      const errorBody = await res.json();

      expect(res.status).toBe(401);

      expect(errorBody).toEqual(
        new UnauthorizedError({
          message: "Credenciais inválidas.",
          action: "Verifique as credenciais informadas.",
        }).toJSON(),
      );
    });
    test("when passing correct email and password", async () => {
      const userTest = await Orchestrator.User.create();

      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userTest.email,
          password: userTest.plainPassword,
        }),
      });
      const createdSession = await res.json();

      expect(res.status).toBe(201);
      expect(createdSession).toEqual(
        expect.objectContaining({
          id: createdSession.id,
          user_id: userTest.id,
          created_at: expect.stringContaining(
            new Date(createdSession.created_at).toISOString(),
          ),
          updated_at: expect.stringContaining(
            new Date(createdSession.updated_at).toISOString(),
          ),
          expires_at: expect.stringContaining(
            new Date(createdSession.expires_at).toISOString(),
          ),
        }),
      );

      expect(
        new Date(createdSession.expires_at).getTime() -
          new Date(createdSession.created_at).getTime(),
      ).toBe(Session.EXPIRES_AT_IN_MS);
    });
  });
});
