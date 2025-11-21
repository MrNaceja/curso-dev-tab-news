import { Client } from "pg";

async function query(q) {
  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
  });
  await client.connect();

  try {
    const result = await client.query(q);
    return result;
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

export default { query };
