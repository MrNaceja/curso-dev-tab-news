import { ForbiddenError, NotFoundError } from "infra/errors";
import { Orchestrator } from "tests/orchestrator";
import { UserActivation } from "models/user-activation";
import { User } from "models/user";
import * as Cookie from "cookie";

beforeAll(Orchestrator.prepareEnviromentWithMigrationsExecuted);

describe("PATCH on /api/v1/users/activate/[token]", () => {
  describe("with Anonymous user", () => {
    test("with nonexistent token", async () => {
      const inexistentToken = "a00c2980-4011-4c4c-b781-71b2641b3edd";

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/activate/${inexistentToken}`,
        {
          method: "PATCH",
        },
      );

      const notFoundError = await res.json();
      const expectedError = new NotFoundError({
        message:
          "Nenhuma ativação de usuário ativa encontrada para o token fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });

      expect(res.status).toBe(expectedError.statusCode);
      expect(notFoundError).toEqual(expectedError.toJSON());
    });
    test("with expired token", async () => {
      const past15MinutesInMs = Date.now() - UserActivation.EXPIRES_AT_IN_MS;

      const expiredToken = await Orchestrator.withTimeTravel(async () => {
        const userTest = await Orchestrator.User.create();
        return Orchestrator.UserActivation.withUser(userTest).generateToken();
      }, past15MinutesInMs);

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/activate/${expiredToken}`,
        {
          method: "PATCH",
        },
      );

      const notFoundError = await res.json();
      const expectedError = new NotFoundError({
        message:
          "Nenhuma ativação de usuário ativa encontrada para o token fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });

      expect(res.status).toBe(expectedError.statusCode);
      expect(notFoundError).toEqual(expectedError.toJSON());
    });
    test("with already activated token", async () => {
      const userTest = await Orchestrator.User.create();
      const activationToken =
        await Orchestrator.UserActivation.withUser(userTest).generateToken();

      const firstActivationRes = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/activate/${activationToken}`,
        {
          method: "PATCH",
        },
      );

      expect(firstActivationRes.status).toBe(204);

      const alreadyActivatedToken = activationToken;

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/activate/${alreadyActivatedToken}`,
        {
          method: "PATCH",
        },
      );

      const notFoundError = await res.json();
      const expectedError = new NotFoundError({
        message:
          "Nenhuma ativação de usuário ativa encontrada para o token fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });

      expect(res.status).toBe(expectedError.statusCode);
      expect(notFoundError).toEqual(expectedError.toJSON());
    });
    test("with valid activation token", async () => {
      const userTest = await Orchestrator.User.create();
      const activationToken =
        await Orchestrator.UserActivation.withUser(userTest).generateToken();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/activate/${activationToken}`,
        {
          method: "PATCH",
        },
      );

      expect(res.status).toBe(204);

      const activatedUserActivation =
        await UserActivation.findById(activationToken);
      expect(activatedUserActivation).toEqual(
        expect.objectContaining({
          id: activationToken,
          user_id: userTest.id,
        }),
      );

      const expirationDiffInMs =
        new Date(activatedUserActivation.expires_at).getTime() -
        new Date(activatedUserActivation.created_at).getTime();

      expect(expirationDiffInMs).toBe(UserActivation.EXPIRES_AT_IN_MS);

      expect(
        activatedUserActivation.updated_at > activatedUserActivation.created_at,
      ).toBeTruthy();
      expect(activatedUserActivation.activated_at).not.toBeNull();
      expect(activatedUserActivation.activated_at).toBeInstanceOf(Date);

      const activatedUser = await User.findById(userTest.id);
      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
        "update:user",
        "invalidate:session",
        "renew:session",
      ]);
    });
  });

  describe("with Authenticated user", () => {
    test("when an authenticated user try activate another user activation token", async () => {
      const authenticatedUserA =
        await Orchestrator.Session.withRandomNewActivatedUser().create();

      const userB = await Orchestrator.User.create();
      const activationTokenUserB =
        await Orchestrator.UserActivation.withUser(userB).generateToken();

      const res = await fetch(
        `${process.env.WEBSERVER_URL}/api/v1/users/activate/${activationTokenUserB}`,
        {
          method: "PATCH",
          headers: {
            Cookie: Cookie.stringifyCookie({
              session_id: authenticatedUserA.id,
            }),
          },
        },
      );

      const forbiddenError = await res.json();
      const expectedError = new ForbiddenError({
        message: "Você não possui permissão(ões) para executar esta ação.",
        action: 'Verifique se você possui a(s) feature(s) "activate:user"',
      });

      expect(res.status).toBe(expectedError.statusCode);
      expect(forbiddenError).toEqual(expectedError.toJSON());
    });
  });
});
