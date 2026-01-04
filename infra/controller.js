import * as Cookie from "cookie";

import {
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors";

export class Controller {
  constructor() {
    /**
     * @type {Map<string, (req: Request, res: Response) => void>}
     */
    this.handlers = new Map();
    /**
     * @type {Map<string, Cookie.Cookies>}
     */
    this.cookies = new Map();

    /** @type {Request} */
    this.req = undefined;
    /** @type {Response} */
    this.res = undefined;
  }

  /**
   * @param {(req: Request, res: Response) => void} handler
   */
  GET(handler) {
    this.handlers.set("GET", handler);
    return this;
  }

  /**
   * @param {(req: Request, res: Response) => void} handler
   */
  POST(handler) {
    this.handlers.set("POST", handler);
    return this;
  }

  /**
   * @param {(req: Request, res: Response) => void} handler
   */
  DELETE(handler) {
    this.handlers.set("DELETE", handler);
    return this;
  }

  /**
   * @param {(req: Request, res: Response) => void} handler
   */
  PUT(handler) {
    this.handlers.set("PUT", handler);
    return this;
  }

  /**
   * @param {(req: Request, res: Response) => void} handler
   */
  PATCH(handler) {
    this.handlers.set("PATCH", handler);
    return this;
  }

  /**
   * @param {Cookie.Cookies} cookie
   */
  setCookie(cookie) {
    this.res?.setHeader("Set-Cookie", Cookie.stringifySetCookie(cookie));
    return this;
  }

  getCookie(name) {
    return this.req?.cookies[name];
  }

  async handle(req, res) {
    this.req = req;
    this.res = res;

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

      return await handler.call(this, req, res);
    } catch (e) {
      let error = e;

      if (
        !(error instanceof ValidationError) &&
        !(error instanceof NotFoundError) &&
        !(error instanceof UnauthorizedError)
      ) {
        error = new InternalServerError({
          cause: error,
        });
        console.error(error);
      }

      return res.status(error.statusCode).json(error);
    }
  }
}
