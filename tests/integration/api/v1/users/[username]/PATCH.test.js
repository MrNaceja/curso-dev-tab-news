import { NotFoundError, ValidationError } from "infra/errors";
import { Security } from "models/security";
import { User } from "models/user";
import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("PATCH on /api/v1/users/[username]", () => {
  describe("with Anonymous user", () => {
    test("when passing duplicated username", async () => {
      const userTestA =
        await Orchestrator.User.withUsername("usernameA").create();
      const userTestB =
        await Orchestrator.User.withUsername("usernameB").create();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTestA.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: userTestB.username,
          }),
        },
      );

      const errorBody = await res.json();
      const expectedDuplicatedUsernameError = new ValidationError({
        message: "Apelido não disponível.",
        action: "Tente outro apelido.",
      });

      expect(res.status).toBe(expectedDuplicatedUsernameError.statusCode);
      expect(errorBody).toEqual(expectedDuplicatedUsernameError.toJSON());
    });
    test("when passing duplicated email", async () => {
      const userTestA =
        await Orchestrator.User.withEmail("userA@email.com").create();
      const userTestB =
        await Orchestrator.User.withEmail("userB@email.com").create();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTestA.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userTestB.email,
          }),
        },
      );

      const errorBody = await res.json();
      const expectedDuplicatedEmailError = new ValidationError({
        message: "Email duplicado.",
        action: "Tente outro email.",
      });

      expect(res.status).toBe(expectedDuplicatedEmailError.statusCode);
      expect(errorBody).toEqual(expectedDuplicatedEmailError.toJSON());
    });
    test("when passing inexistent username", async () => {
      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/UsuarioInexistente`,
        {
          method: "PATCH",
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
    test("when passing a new unique username", async () => {
      const userTest = await Orchestrator.User.create();

      const newUniqueUsername = Orchestrator.Mock.internet
        .username()
        .replace(/[._-]/g, "");

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTest.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: newUniqueUsername,
          }),
        },
      );
      expect(res.status).toBe(204);

      expect(async () => {
        const updatedUser = await User.findByUsername(newUniqueUsername);
        expect(new Date(updatedUser.updated_at).getTime()).toBeGreaterThan(
          new Date(updatedUser.created_at).getTime(),
        );
      }).not.toThrow(NotFoundError);
    });
    test("when passing a new unique email", async () => {
      const userTest = await Orchestrator.User.create();
      const newUniqueEmail = Orchestrator.Mock.internet.email();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTest.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newUniqueEmail,
          }),
        },
      );
      expect(res.status).toBe(204);

      const updatedUser = await User.findByUsername(userTest.username);

      expect(updatedUser.email).toEqual(newUniqueEmail);
      expect(new Date(updatedUser.updated_at).getTime()).toBeGreaterThan(
        new Date(updatedUser.created_at).getTime(),
      );
    });
    test("when passing a new password", async () => {
      const userTest =
        await Orchestrator.User.withPassword("initial_password").create();
      const newPassword = Orchestrator.Mock.internet.password();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTest.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: newPassword,
          }),
        },
      );
      expect(res.status).toBe(204);

      const updatedUser = await User.findByUsername(userTest.username);

      const isSameUpdatedPassword = await Security.comparePassword(
        newPassword,
        updatedUser.password,
      );
      const isNotUpdatedPassword = await Security.comparePassword(
        "initial_password",
        updatedUser.password,
      );
      expect(isSameUpdatedPassword).toBeTruthy();
      expect(isNotUpdatedPassword).toBeFalsy();

      expect(new Date(updatedUser.updated_at).getTime()).toBeGreaterThan(
        new Date(updatedUser.created_at).getTime(),
      );
    });
  });
});
