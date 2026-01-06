import { Email } from "infra/email";
import { Orchestrator } from "tests/orchestrator";

beforeAll(Orchestrator.checkEmailServersIsUp);

describe("Email.send()", () => {
  test("read latest email", async () => {
    await Orchestrator.Email.clearInbox();

    const emailTest = {
      from: "<test@email.com>",
      to: ["<to@email.com>"],
      subject: "Email Subject",
      body: "Email body goes here.",
    };

    await Email.from(Orchestrator.Mock.internet.email())
      .to(Orchestrator.Mock.internet.email())
      .send(
        Orchestrator.Mock.lorem.words(2),
        Orchestrator.Mock.lorem.paragraphs(3),
      );

    await Email.from(emailTest.from)
      .to(emailTest.to)
      .send(emailTest.subject, emailTest.body);

    const latestInboxEmailSended = await Orchestrator.Email.readLatestEmail();
    expect(latestInboxEmailSended).toEqual(emailTest);
  });
});
