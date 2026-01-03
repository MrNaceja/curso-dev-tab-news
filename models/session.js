import database from "infra/database";

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
};
