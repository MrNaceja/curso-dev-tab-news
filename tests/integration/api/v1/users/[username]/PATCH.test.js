import { ForbiddenError, NotFoundError, ValidationError } from "infra/errors";
import { Security } from "models/security";
import { User } from "models/user";
import { Orchestrator } from "tests/orchestrator";
import * as Cookie from "cookie";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("PATCH on /api/v1/users/[username]", () => {
  describe("with Anonymous user", () => {
    test("when passing a new unique username", async () => {
      const newUniqueUsername = Orchestrator.Mock.internet
        .username()
        .replace(/[._-]/g, "");

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/Anonymous`,
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
      const expectedError = new ForbiddenError({
        message: "Você não possui permissão(ões) para executar esta ação.",
        action: 'Verifique se você possui a(s) feature(s) "update:user"',
      });

      expect(res.status).toBe(expectedError.statusCode);
      const errorBody = await res.json();
      expect(errorBody).toEqual(expectedError.toJSON());
    });
  });

  describe("with Authenticated user", () => {
    test("when passing duplicated username", async () => {
      const userTestA =
        await Orchestrator.User.withUsername("usernameA").createActivated();

      const userTestB =
        await Orchestrator.User.withUsername("usernameB").createActivated();

      const sessionUserA =
        await Orchestrator.Session.withUser(userTestA).create();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTestA.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: Cookie.stringifyCookie({
              session_id: sessionUserA.id,
            }),
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
        await Orchestrator.User.withEmail("userA@email.com").createActivated();
      const userTestB =
        await Orchestrator.User.withEmail("userB@email.com").createActivated();

      const sessionUserA =
        await Orchestrator.Session.withUser(userTestA).create();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTestA.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: Cookie.stringifyCookie({
              session_id: sessionUserA.id,
            }),
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
      const auhtenticatedUserSessionTest =
        await Orchestrator.Session.withRandomNewActivatedUser().create();
      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/UsuarioInexistente`,
        {
          method: "PATCH",
          headers: {
            Cookie: Cookie.stringifyCookie({
              session_id: auhtenticatedUserSessionTest.id,
            }),
          },
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
      const sessionUserTest =
        await Orchestrator.Session.withRandomNewActivatedUser().create();

      const newUniqueUsername = Orchestrator.Mock.internet
        .username()
        .replace(/[._-]/g, "");

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${sessionUserTest.user.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: Cookie.stringifyCookie({
              session_id: sessionUserTest.id,
            }),
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
      const sessionUserTest =
        await Orchestrator.Session.withRandomNewActivatedUser().create();
      const newUniqueEmail = Orchestrator.Mock.internet.email();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${sessionUserTest.user.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: Cookie.stringifyCookie({
              session_id: sessionUserTest.id,
            }),
          },
          body: JSON.stringify({
            email: newUniqueEmail,
          }),
        },
      );
      expect(res.status).toBe(204);

      const updatedUser = await User.findByUsername(
        sessionUserTest.user.username,
      );

      expect(updatedUser.email).toEqual(newUniqueEmail);
      expect(new Date(updatedUser.updated_at).getTime()).toBeGreaterThan(
        new Date(updatedUser.created_at).getTime(),
      );
    });
    test("when passing a new password", async () => {
      const userTest =
        await Orchestrator.User.withPassword(
          "initial_password",
        ).createActivated();
      const sessionUserTest =
        await Orchestrator.Session.withUser(userTest).create();
      const newPassword = Orchestrator.Mock.internet.password();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTest.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: Cookie.stringifyCookie({
              session_id: sessionUserTest.id,
            }),
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
    test("when an user try update another user", async () => {
      const userTestA = await Orchestrator.User.createActivated();
      const userTestB = await Orchestrator.User.createActivated();

      const sessionUserA =
        await Orchestrator.Session.withUser(userTestA).create();

      const newUniqueUsername = Orchestrator.Mock.internet
        .username()
        .replace(/[._-]/g, "");

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${userTestB.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: Cookie.stringifyCookie({
              session_id: sessionUserA.id,
            }),
          },
          body: JSON.stringify({
            username: newUniqueUsername,
          }),
        },
      );

      const expectedError = new ForbiddenError({
        message:
          "Usuário não possui permissão(ões) para gerenciar este recurso.",
        action: "Verifique as permissão(ões) concedidas.",
      });

      expect(res.status).toBe(expectedError.statusCode);
      const errorBody = await res.json();
      expect(errorBody).toEqual(expectedError.toJSON());
    });
  });

  describe("with Privilegied user", () => {
    test("when has 'update:user:super' trying update another user", async () => {
      const userPrivilegiedTest =
        await Orchestrator.User.withFeatures(
          "update:user:super",
        ).createActivated();
      const otherUserTest = await Orchestrator.User.createActivated();

      const sessionUserPrivilegied =
        await Orchestrator.Session.withUser(userPrivilegiedTest).create();

      const newUniqueUsername = Orchestrator.Mock.internet
        .username()
        .replace(/[._-]/g, "");

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/${otherUserTest.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: Cookie.stringifyCookie({
              session_id: sessionUserPrivilegied.id,
            }),
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
  });
});
