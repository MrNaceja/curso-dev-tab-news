import { ServiceUnavailableError } from "infra/errors";
import { createTransport } from "nodemailer";

export const getEmailHttpUrl = () =>
  new URL(
    `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`,
  );

const emailSmtpTransporter = createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS,
  },
  secure: process.env.NODE_ENV === "production",
});

export const Email = {
  from(from) {
    if (!from.startsWith("<")) {
      from = `<${from}>`;
    }
    this._from = from;
    return this;
  },
  to(...to) {
    if (to.length === 1 && Array.isArray(to[0])) {
      to = to[0];
    }
    this._to = to.map((t) => (t.startsWith("<") ? t : `<${t}>`));
    return this;
  },
  async send(subject, body) {
    const { _from: from, _to: to } = this;
    delete this._from;
    delete this._to;

    try {
      return emailSmtpTransporter.sendMail({
        from,
        to,
        subject,
        text: body,
      });
    } catch (e) {
      throw new ServiceUnavailableError({
        cause: e,
        message: "Serviço de email indisponível.",
        ctx: {
          subject,
          body,
        },
      });
    }
  },
};
