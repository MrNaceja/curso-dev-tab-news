import { NotFoundError } from "infra/errors";
import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("GET on /api/v1/users/[username]", () => {
  describe("with Anonymous user", () => {
    test("with exact case of username", async () => {
      const userTest =
        await Orchestrator.User.withUsername("usernameExactCase").create();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTest.username}`,
        {
          method: "GET",
        },
      );
      const userFounded = await res.json();

      expect(res.status).toBe(200);
      expect(userFounded).toEqual(
        expect.objectContaining({
          created_at: expect.stringContaining(
            new Date(userFounded.created_at).toISOString(),
          ),
          updated_at: expect.stringContaining(
            new Date(userFounded.updated_at).toISOString(),
          ),
          id: expect.stringContaining(userFounded.id),
          username: expect.stringContaining(userTest.username),
          email: expect.stringContaining(userTest.email),
          password: expect.stringContaining(userTest.password),
        }),
      );
    });
    test("with mismatch case of username", async () => {
      const userTest = await Orchestrator.User.withUsername(
        "usernameMismatchCase",
      ).create();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTest.username.toLowerCase()}`,
        {
          method: "GET",
        },
      );

      expect(res.status).toBe(200);

      const userFounded = await res.json();

      expect(userFounded).toEqual(
        expect.objectContaining({
          created_at: expect.stringContaining(
            new Date(userFounded.created_at).toISOString(),
          ),
          updated_at: expect.stringContaining(
            new Date(userFounded.updated_at).toISOString(),
          ),
          id: expect.stringContaining(userFounded.id),
          username: expect.stringContaining(userTest.username),
          email: expect.stringContaining(userTest.email),
          password: expect.stringContaining(userTest.password),
        }),
      );
    });
    test("with inexistent username", async () => {
      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/UsuarioInexistente`,
        {
          method: "GET",
        },
      );

      const errorBody = await res.json();

      const expectedNotFoundError = new NotFoundError({
        message: "Nenhum usuário encontrado para o username fornecido.",
        action: "Tente buscar por outro username.",
      });

      expect(res.status).toBe(expectedNotFoundError.statusCode);
      expect(errorBody).toEqual(expectedNotFoundError.toJSON());
    });
  });
});
