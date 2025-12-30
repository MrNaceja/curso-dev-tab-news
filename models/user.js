import database from "infra/database";

export const User = {
  async create({ username, email, password }) {
    const insertQuery = await database.query({
      text: `
        INSERT INTO
          users (username, email, password)
        VALUES 
          ($1, $2, $3)
        RETURNING 
          *
        ;
      `.trim(),
      values: [username, email, password],
    });

    const [createdUser] = insertQuery.rows;

    return createdUser;
  },
};
