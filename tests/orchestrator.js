import { faker } from "@faker-js/faker";
import retry from "async-retry";
import database from "infra/database";
import { Migrator } from "models/migrator";
import { Session } from "models/session";
import { User } from "models/user";
import * as Cookie from "cookie";
import { emailHttpUrl } from "infra/email";

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
function checkEmailServersIsUp() {
  return retry(
    async () => {
      const res = await fetch(emailHttpUrl);

      if (!res.ok) throw new Error("Email servers is not ready, retrying...");
    },
    {
      retries: 10,
      maxTimeout: 1000,
      onRetry(fail, attempt) {
        console.warn(
          `Attempt #${attempt} - Fail on checking email servers`,
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
  checkNextWebserverIsUp,
  checkEmailServersIsUp,

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
      const {
        username = Orchestrator.Mock.internet.username().replace(/[_.-]/g, ""),
        email = Orchestrator.Mock.internet.email(),
        password = Orchestrator.Mock.internet.password(),
      } = this;

      this.username = undefined;
      this.email = undefined;
      this.password = undefined;

      const user = await User.create({
        username,
        email,
        password,
      });

      return {
        ...user,
        plainPassword: password,
      };
    },
  },
  Session: {
    user: undefined,
    withUser(user) {
      this.user = user;
      return this;
    },
    withRandomNewUser() {
      this.user = Orchestrator.User.create();
      return this;
    },
    async create() {
      let { user } = this;
      this.user = undefined;

      if (user instanceof Promise) {
        user = await user;
      }

      const session = await Session.create(user.id);

      return {
        ...session,
        user,
      };
    },
  },
  Mock: faker,
  Email: {
    async readLatestEmail() {
      const fetchEmailsRes = await fetch(`${emailHttpUrl}/messages`);
      const emails = await fetchEmailsRes.json();
      const latestEmail = emails.pop();

      const fetchEmailBodyRes = await fetch(
        `${emailHttpUrl}/messages/${latestEmail.id}.plain`,
      );
      const latestEmailBody = await fetchEmailBodyRes.text();

      return {
        from: latestEmail.sender,
        to: latestEmail.recipients,
        subject: latestEmail.subject,
        body: latestEmailBody.trim(),
      };
    },
    clearInbox() {
      return fetch(`${emailHttpUrl}/messages`, { method: "DELETE" });
    },
  },
  extractCookiesFromResponse(res) {
    return res.headers.getSetCookie().reduce((jar, cookie) => {
      const parsedCookie = Cookie.parseSetCookie(cookie);
      jar[parsedCookie.name] = parsedCookie;
      return jar;
    }, {});
  },
  async withTimeTravel(cb, timeToTravelInMs) {
    jest.useFakeTimers({
      now: timeToTravelInMs,
    });

    const result = cb();
    if (result instanceof Promise) {
      await result;
    }

    jest.useRealTimers();

    return result;
  },
};
