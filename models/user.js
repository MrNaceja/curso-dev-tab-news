import database from "infra/database";
import { ValidationError } from "infra/errors";

async function validateUniqueEmail(email) {
  const existsQuery = await database.query({
    text: `
     SELECT 1
      FROM users
      WHERE LOWER(email) = LOWER($1) 
  `.trim(),
    values: [email],
  });

  if (existsQuery.rowCount !== 0) {
    throw new ValidationError({
      message: "Email duplicado.",
      action: "Tente outro email.",
    });
  }
}

async function validateUniqueUsername(username) {
  const existsQuery = await database.query({
    text: `
     SELECT 1
      FROM users
      WHERE LOWER(username) = LOWER($1) 
  `.trim(),
    values: [username],
  });

  if (existsQuery.rowCount !== 0) {
    throw new ValidationError({
      message: "Apelido não disponível.",
      action: "Tente outro apelido.",
    });
  }
}

export const User = {
  async create({ username, email, password }) {
    await validateUniqueEmail(email);
    await validateUniqueUsername(username);

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
