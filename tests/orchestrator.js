import retry from "async-retry";
import database from "infra/database";

function checkNextWebserverIsUp() {
  return retry(
    async () => {
      const res = await fetch(`${process.env.WEBSERVER_URL}/api/v1/status`, {
        method: "GET",
      });

      if (!res.ok) throw new Error("Webserver is not ready, retrying...");
    },
    {
      retries: 10,
      maxTimeout: 1000,
      onRetry(fail, attempt) {
        console.warn(
          `Attempt #${attempt} - Fail on checking next webserver`,
          fail,
        );
      },
    },
  );
}

async function resetDatabase() {
  await database.query("DROP SCHEMA PUBLIC CASCADE; CREATE SCHEMA PUBLIC;");
}

export const Orchestrator = {
  async beforeAll() {
    await checkNextWebserverIsUp();
    await resetDatabase();
  },
};
