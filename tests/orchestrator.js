import retry from "async-retry";
import database from "infra/database";

function checkNextWebserverIsUp() {
  return retry(
    async () => {
      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/status`, {
        method: "GET",
      });

      if (!res.ok) throw new Error("Webserver is not ready, retrying...");
      await res.json();
    },
    {
      retries: 10,
    },
  );
}

async function resetDatabase() {
  await database.query("DROP SCHEMA PUBLIC CASCADE; CREATE SCHEMA PUBLIC;");
}

export const Orchestrator = {
  async beforeAll() {
    await resetDatabase();
    await checkNextWebserverIsUp();
  },
};
