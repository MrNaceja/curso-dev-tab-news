import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  ValidationError,
} from "infra/errors";

export class Controller {
  constructor() {
    this.handlers = new Map();
  }

  GET(handler) {
    this.handlers.set("GET", handler);
    return this;
  }
  POST(handler) {
    this.handlers.set("POST", handler);
    return this;
  }
  DELETE(handler) {
    this.handlers.set("DELETE", handler);
    return this;
  }
  PUT(handler) {
    this.handlers.set("PUT", handler);
    return this;
  }

  async handle(req, res) {
    try {
      if (!this.handlers.has(String(req.method).toUpperCase())) {
        const error = new MethodNotAllowedError();
        return res.status(error.statusCode).json(error);
      }

      const handler = this.handlers.get(String(req.method).toUpperCase());
      if (!handler) {
        const error = new NotFoundError();
        return res.status(error.statusCode).json(error);
      }

      return await handler(req, res);
    } catch (e) {
      let error = e;

      if (
        !(error instanceof ValidationError) &&
        !(error instanceof NotFoundError)
      ) {
        error = new InternalServerError({
          cause: error,
          statusCode: error.statusCode,
        });
        console.error(error);
      }

      return res.status(error.statusCode).json(error);
    }
  }
}
