import { NotFoundError, ValidationError } from "infra/errors";
import { Security } from "models/security";
import { User } from "models/user";
import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("PATCH on /api/v1/users/[username]", () => {
  describe("with Anonymous user", () => {
    test("when passing duplicated username", async () => {
      for (let i = 1; i <= 2; i++) {
        const createUserRes = await fetch(
          `${process.env.WEBSERVER_URL}/api/v1/users`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: `duplicado${i}`,
              email: `user${i}@email.com`,
              password: "usuario123",
            }),
          },
        );
        expect(createUserRes.status).toBe(201);
      }

      const updateUserRes = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/duplicado1`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "duplicado2",
          }),
        },
      );

      const errorBody = await updateUserRes.json();
      const expectedDuplicatedUsernameError = new ValidationError({
        message: "Apelido não disponível.",
        action: "Tente outro apelido.",
      });

      expect(updateUserRes.status).toBe(
        expectedDuplicatedUsernameError.statusCode,
      );
      expect(errorBody).toEqual(expectedDuplicatedUsernameError.toJSON());
    });
    test("when passing duplicated email", async () => {
      for (let i = 3; i <= 4; i++) {
        const createUserRes = await fetch(
          `${process.env.WEBSERVER_URL}/api/v1/users`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: `duplicado${i}`,
              email: `user${i}@email.com`,
              password: "usuario123",
            }),
          },
        );
        expect(createUserRes.status).toBe(201);
      }

      const updateUserRes = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/duplicado3`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "user4@email.com",
          }),
        },
      );

      const errorBody = await updateUserRes.json();
      const expectedDuplicatedEmailError = new ValidationError({
        message: "Email duplicado.",
        action: "Tente outro email.",
      });

      expect(updateUserRes.status).toBe(
        expectedDuplicatedEmailError.statusCode,
      );
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
      const createUserRes = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "usernameTest",
            email: "test@email.com",
            password: "test123",
          }),
        },
      );
      expect(createUserRes.status).toBe(201);

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/usernameTest`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "usernameTestUpdated",
          }),
        },
      );
      expect(res.status).toBe(204);

      expect(async () => {
        const updatedUser = await User.findOneByUsername("usernameTestUpdated");
        expect(new Date(updatedUser.updated_at).getTime()).toBeGreaterThan(
          new Date(updatedUser.created_at).getTime(),
        );
      }).not.toThrow(NotFoundError);
    });
    test("when passing a new unique email", async () => {
      const createUserRes = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "usernameTest",
            email: "test2@email.com",
            password: "test123",
          }),
        },
      );
      expect(createUserRes.status).toBe(201);

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/usernameTest`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test.updated@email.com",
          }),
        },
      );
      expect(res.status).toBe(204);

      const updatedUser = await User.findOneByUsername("usernameTest");

      expect(updatedUser.email).toEqual("test.updated@email.com");
      expect(new Date(updatedUser.updated_at).getTime()).toBeGreaterThan(
        new Date(updatedUser.created_at).getTime(),
      );
    });
    test("when passing a new password", async () => {
      const createUserRes = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "usernameTest3",
            email: "test3@email.com",
            password: "test123",
          }),
        },
      );
      expect(createUserRes.status).toBe(201);

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/usernameTest3`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newPassword",
          }),
        },
      );
      expect(res.status).toBe(204);

      const updatedUser = await User.findOneByUsername("usernameTest3");

      const isSameUpdatedPassword = await Security.comparePassword(
        "newPassword",
        updatedUser.password,
      );
      const isNotUpdatedPassword = await Security.comparePassword(
        "test123",
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
