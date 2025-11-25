import { Client } from "pg";

const useSSL = () => {
  if (process.env.SSL_CREDENTIAL_CERTIFICATE) {
    return {
      ca: process.env.SSL_CREDENTIAL_CERTIFICATE,
    };
  }

  return process.env.NODE_ENV === "production";
};

async function query(q) {
  return await withClientConnected(async (client) => {
    const result = await client.query(q);
    return result;
  });
}

function newClient() {
  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: useSSL(),
  });
  return client;
}

async function withClientConnected(callback) {
  const client = newClient();
  try {
    await client.connect();
    const result = callback(client);
    if (result instanceof Promise) {
      await result;
    }
    return result;
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await client.end();
  }
}

export default { query, newClient, withClientConnected };
