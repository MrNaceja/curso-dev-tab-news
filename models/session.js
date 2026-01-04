import database from "infra/database";
import { NotFoundError } from "infra/errors";

const expiresAt30DaysInMs = 60 * 60 * 24 * 30 * 1000;

export const Session = {
  EXPIRES_AT_IN_MS: expiresAt30DaysInMs,
  async create(userId) {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiresAt30DaysInMs);

    const insertQuery = await database.query({
      text: `
        INSERT INTO
          sessions (user_id, created_at, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
      `.trim(),
      values: [userId, createdAt, expiresAt],
    });

    const [session] = insertQuery.rows;
    return session;
  },
  async findById(id) {
    if (!id) {
      throw new NotFoundError({
        message: "Nenhuma sessão encontrado para o id fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });
    }

    const findSessionQuery = await database.query({
      text: `
        SELECT
          *
        FROM
          sessions
        WHERE TRUE
          AND id = $1 
        LIMIT 1;
      `.trim(),
      values: [id],
    });

    const [sessionFounded] = findSessionQuery.rows;
    if (!sessionFounded) {
      throw new NotFoundError({
        message: "Nenhuma sessão encontrado para o id fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });
    }
    return sessionFounded;
  },
  async findValidById(id) {
    if (!id) {
      throw new NotFoundError({
        message: "Nenhuma sessão encontrado para o id fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });
    }

    const findSessionQuery = await database.query({
      text: `
        SELECT
          *
        FROM
          sessions
        WHERE TRUE
          AND id = $1 
          AND expires_at > timezone('utc', now()) 
        LIMIT 1;
      `.trim(),
      values: [id],
    });

    const [activeSessionFounded] = findSessionQuery.rows;
    if (!activeSessionFounded) {
      throw new NotFoundError({
        message: "Nenhuma sessão ativa encontrado para o id fornecido.",
        action: "Verifique os parâmetros fornecidos.",
      });
    }
    return activeSessionFounded;
  },
  async updateById(id, { expiresAt }) {
    const existentActiveSession = await this.findValidById(id);

    let fieldsToUpdate = new Map();

    if (expiresAt && expiresAt !== existentActiveSession.expiresAt) {
      fieldsToUpdate.set("expires_at", expiresAt);
    }

    if (fieldsToUpdate.size === 0) return;

    fieldsToUpdate = Array.from(fieldsToUpdate.entries());
    await database.query({
      text: `
        UPDATE 
          sessions
        SET
          ${fieldsToUpdate
            .map(([field], i) => `${field} = $${i + 1}`)
            .concat("updated_at = timezone('utc', now())")
            .join(",")}
        WHERE
          id = $${fieldsToUpdate.length + 1}
      `.trim(),
      values: fieldsToUpdate.map(([, value]) => value).concat(id),
    });
  },
  async renewById(id) {
    const newExpiresAt = new Date(Date.now() + expiresAt30DaysInMs);
    const renewedSession = await Session.updateById(id, {
      expiresAt: newExpiresAt,
    });
    return renewedSession;
  },
  async invalidateById(id) {
    const newExpiresAt = new Date(Date.now() - expiresAt30DaysInMs);
    const expiredSession = await Session.updateById(id, {
      expiresAt: newExpiresAt,
    });
    return expiredSession;
  },
};
