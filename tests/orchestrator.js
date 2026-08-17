import { faker } from "@faker-js/faker";
import retry from "async-retry";
import database from "infra/database";
import { Migrator } from "models/migrator";
import { Session } from "models/session";
import { User } from "models/user";
import * as Cookie from "cookie";
import { getEmailHttpUrl } from "infra/email";
import { UserActivation } from "models/user-activation";
import { getWebserverOrigin } from "infra/controller";

const EMAIL_HTTP_URL = getEmailHttpUrl();

function checkNextWebserverIsUp() {
  return retry(
    async () => {
      const res = await fetch(`${getWebserverOrigin()}/api/v1/status`, {
        method: "GET",
      });

      await res
        .json()
        .catch(
          (cause) =>
            new Error("Webserver is not ready, retrying...", { cause }),
        );
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
      const res = await fetch(EMAIL_HTTP_URL);

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
  async prepareServices() {
    await checkNextWebserverIsUp();
    await checkEmailServersIsUp();
  },
  async prepareCleanEnviroment() {
    await Orchestrator.prepareServices();
    await resetDatabase();
    await Orchestrator.Email.clearInbox();
  },
  async prepareEnviromentWithMigrationsExecuted() {
    await Orchestrator.prepareCleanEnviroment();
    await Migrator.runPending();
  },
  User: {
    username: undefined,
    email: undefined,
    password: undefined,
    features: undefined,

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
    withFeatures(...features) {
      this.features = features;
      return this;
    },

    async create() {
      const {
        username = Orchestrator.Mock.internet.username().replace(/[_.-]/g, ""),
        email = Orchestrator.Mock.internet.email(),
        password = Orchestrator.Mock.internet.password(),
        features,
      } = this;

      this.username = undefined;
      this.email = undefined;
      this.password = undefined;
      this.features = undefined;

      const user = await User.create({
        username,
        email,
        password,
      });

      if (features && Array.isArray(features) && features.length) {
        await User.setFeaturesById(user.id, ...features);
        user.features = [...user.features, ...features];
      }

      return {
        ...user,
        plainPassword: password,
      };
    },
    async createActivated() {
      const { features } = this;
      this.features = undefined;

      const user = await this.create();
      const activationToken =
        await Orchestrator.UserActivation.withUser(user).generateToken();
      await Orchestrator.UserActivation.activate(activationToken);
      const activatedUser = await User.findById(user.id);

      if (features && Array.isArray(features) && features.length) {
        const userFeatures = [...activatedUser.features, ...features];
        await User.setFeaturesById(user.id, ...userFeatures);
        activatedUser.features = userFeatures;
      }

      return {
        ...activatedUser,
        plainPassword: user.plainPassword,
      };
    },
    async setFeatures(user, ...features) {
      await User.setFeaturesById(user.id, ...features);
      return { ...user, features };
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
    withRandomNewActivatedUser() {
      this.user = Orchestrator.User.createActivated();
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
  UserActivation: {
    user: undefined,
    withUser(user) {
      this.user = user;
      return this;
    },
    async activate(token) {
      await UserActivation.activate(token);
    },
    async generateToken() {
      let { user } = this;
      this.user = undefined;

      if (user instanceof Promise) {
        user = await user;
      }

      const activation = await UserActivation.create(user.id);
      return activation.id;
    },
  },
  Mock: faker,
  Email: {
    async readLatestEmail() {
      const fetchEmailsRes = await fetch(`${EMAIL_HTTP_URL}/messages`);
      const emails = await fetchEmailsRes.json();
      const latestEmail = emails.pop();

      if (!latestEmail) return;

      const fetchEmailBodyRes = await fetch(
        `${EMAIL_HTTP_URL}/messages/${latestEmail.id}.plain`,
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
      return fetch(`${EMAIL_HTTP_URL}/messages`, { method: "DELETE" });
    },
  },
  extractCookiesFromResponse(res) {
    return res.headers.getSetCookie().reduce((jar, cookie) => {
      const parsedCookie = Cookie.parseSetCookie(cookie);
      jar[parsedCookie.name] = parsedCookie;
      return jar;
    }, {});
  },
  extractActivationTokenFromActivationEmailBody(activationEmailBody) {
    const [, activationUrl] = activationEmailBody.match(/(http?.*)\n/);
    const extractedActivationToken = new URL(activationUrl).pathname
      .split("/")
      .pop();
    return extractedActivationToken;
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
