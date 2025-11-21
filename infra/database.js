import { Client } from "pg";

async function query(q) {
  const postgressCredentials = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
  };
  const client = new Client(postgressCredentials);
  console.info("Credenciais Postgres: ", postgressCredentials);

  try {
    await client.connect();
    const result = await client.query(q);
    return result;
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await client.end();
  }
}

export default { query };
