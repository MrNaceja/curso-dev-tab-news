import database from "infra/database";
import { Email } from "infra/email";
import { NotFoundError } from "infra/errors";

const expiresAt15MinutesInMs = 60 * 60 * 15 * 1000;

export const UserActivation = {
  EXPIRES_AT_IN_MS: expiresAt15MinutesInMs,
  async create(userId) {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiresAt15MinutesInMs);

    const insertQuery = await database.query({
      text: `
        INSERT INTO
          user_activations (user_id, created_at, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      `.trim(),
      values: [userId, createdAt, expiresAt],
    });

    const [activation] = insertQuery.rows;
    return activation;
  },
  async findValidById(id) {
    if (!id) {
      throw new NotFoundError({
        message: "Ativação de usuário não encontrada para o id fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });
    }

    const findActivationQuery = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activations
        WHERE TRUE
          AND id = $1 
          AND expires_at > timezone('utc', now()) 
          AND activated_at IS NULL
        LIMIT 1;
      `.trim(),
      values: [id],
    });

    const [activationFounded] = findActivationQuery.rows;
    if (!activationFounded) {
      throw new NotFoundError({
        message:
          "Nenhuma ativação de usuário ativa encontrada para o id fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });
    }
    return activationFounded;
  },
  generateActivationLink(activationToken) {
    return `${process.env.WEBSERVER_URL}/users/activate?token=${activationToken}`;
  },
  async requestUserActivation({ email, username, id: userId }) {
    const { id: activationToken } = await this.create(userId);

    await Email.from("contato@naceja.com.br")
      .to(email)
      .send(
        "Ative sua conta no Naceja",
        [
          `${username}, falta pouco para ativar sua conta. Ative agora mesmo pelo link abaixo:\n`,

          this.generateActivationLink(activationToken),

          "Atenciosamente",
          "Equipe Naceja.",
        ].join("\n"),
      );
  },
};
