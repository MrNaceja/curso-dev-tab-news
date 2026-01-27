import database from "infra/database";
import { Email } from "infra/email";
import { NotFoundError } from "infra/errors";
import { Authorization } from "models/authorization";
import { User } from "models/user";

const expiresAt15MinutesInMs = 60 * 15 * 1000;

export const UserActivation = {
  EXPIRES_AT_IN_MS: expiresAt15MinutesInMs,
  generateActivationLink(activationToken) {
    return `${process.env.WEBSERVER_URL}/signup/activate/${activationToken}`;
  },
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
  async findById(id) {
    if (!id) {
      throw new NotFoundError({
        message: "Ativação de usuário não encontrada para o token fornecido.",
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
        LIMIT 1;
      `.trim(),
      values: [id],
    });

    const [activationFounded] = findActivationQuery.rows;
    if (!activationFounded) {
      throw new NotFoundError({
        message:
          "Nenhuma ativação de usuário encontrada para o token fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });
    }
    return activationFounded;
  },
  async findValidById(id) {
    if (!id) {
      throw new NotFoundError({
        message: "Ativação de usuário não encontrada para o token fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });
    }

    const now = new Date().toISOString();

    const findActivationQuery = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activations
        WHERE TRUE
          AND id = $1 
          AND expires_at > timezone('utc', $2::timestamptz) 
          AND activated_at IS NULL
        LIMIT 1;
      `.trim(),
      values: [id, now],
    });

    const [activationFounded] = findActivationQuery.rows;
    if (!activationFounded) {
      throw new NotFoundError({
        message:
          "Nenhuma ativação de usuário ativa encontrada para o token fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });
    }
    return activationFounded;
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
  async updateBy(activationOrId, { expiresAt, activatedAt }) {
    let existentActiveActivation = activationOrId;
    if (typeof activationOrId === "string") {
      existentActiveActivation = await this.findValidById(activationOrId);
    }

    let fieldsToUpdate = new Map();

    if (expiresAt && expiresAt !== existentActiveActivation.expires_at) {
      fieldsToUpdate.set("expires_at", expiresAt);
    }
    if (activatedAt && activatedAt !== existentActiveActivation.activated_at) {
      fieldsToUpdate.set("activated_at", activatedAt);
    }

    if (fieldsToUpdate.size === 0) return;

    fieldsToUpdate = Array.from(fieldsToUpdate.entries());
    const updateQuery = await database.query({
      text: `
        UPDATE 
          user_activations
        SET
          ${fieldsToUpdate
            .map(([field], i) => `${field} = $${i + 1}`)
            .concat("updated_at = timezone('utc', now())")
            .join(",")}
        WHERE
          id = $${fieldsToUpdate.length + 1}
        RETURNING
          *
      `.trim(),
      values: fieldsToUpdate
        .map(([, value]) => value)
        .concat(existentActiveActivation.id),
    });
    const [updated] = updateQuery.rows;
    return updated;
  },
  async activate(id) {
    const activatedAt = new Date();
    const activation = await this.findValidById(id);
    const userToActivate = await User.findById(activation.user_id);
    await Authorization.validate(userToActivate, "activate:user");

    const activatedActivation = await UserActivation.updateBy(activation, {
      activatedAt,
    });
    await User.setFeaturesById(
      userToActivate.id,
      "create:session",
      "read:session",
      "update:user",
      "invalidate:session",
      "renew:session",
    );
    return activatedActivation;
  },
};
