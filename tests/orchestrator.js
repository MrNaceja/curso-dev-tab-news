import { faker } from "@faker-js/faker";
import retry from "async-retry";
import database from "infra/database";
import { Migrator } from "models/migrator";
import { User } from "models/user";

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
  async prepareCleanEnviroment() {
    await checkNextWebserverIsUp();
    await resetDatabase();
  },
  async prepareEnviromentWithMigrationsExecuted() {
    await Orchestrator.prepareCleanEnviroment();
    await Migrator.runPending();
  },

  User: {
    username: undefined,
    email: undefined,
    password: undefined,

    withUsername(username) {
      this.username = username;
      return this;
    },
    withEmail(email) {
      this.email = email;
      return this;
    },
    withPassword(password) {
      this.password = password;
      return this;
    },

    async create() {
      const user = await User.create({
        username:
          this.username ||
          Orchestrator.Mock.internet.username().replace(/[_.-]/g, ""),
        email: this.email || Orchestrator.Mock.internet.email(),
        password: this.password || Orchestrator.Mock.internet.password(),
      });
      this.username = undefined;
      this.email = undefined;
      this.password = undefined;
      return user;
    },
  },
  Mock: faker,
};
