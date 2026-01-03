import { NotFoundError, UnauthorizedError } from "infra/errors";
import { Security } from "models/security";
import { Session } from "models/session";
import { User } from "models/user";

export const Authentication = {
  async getUserByCredentials({ email, password }) {
    try {
      const userWithEmailFounded = await User.findByEmail(email);
      const isSamePassword = await Security.comparePassword(
        password,
        userWithEmailFounded.password,
      );
      if (!isSamePassword)
        throw new UnauthorizedError({
          message: "Senha inválida.",
        });

      return userWithEmailFounded;
    } catch (e) {
      if (e instanceof NotFoundError || e instanceof UnauthorizedError) {
        throw new UnauthorizedError({
          message: "Credenciais inválidas.",
          action: "Verifique as credenciais informadas.",
        });
      }
      throw e;
    }
  },
  async createUserSession({ email, password }) {
    const user = await Authentication.getUserByCredentials({
      email,
      password,
    });
    const session = await Session.create(user.id);
    return session;
  },
};
