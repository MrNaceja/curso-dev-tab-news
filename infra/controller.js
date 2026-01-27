import * as Cookie from "cookie";

import {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors";
import { Authentication } from "models/authentication";
import { Authorization } from "models/authorization";

export class Controller {
  constructor() {
    /**
     * @type {Map<string, (req: Request, res: Response) => void | Promise<void>>}
     */
    this.handlers = new Map();

    /**
     * @type {Map<string, Array<(req: Request, res: Response, next: () => void | Promise<void>) => void | Promise<void>>>}
     */
    this.middlewares = new Map();

    /**
     * @type {Map<string, Cookie.Cookies>}
     */
    this.cookies = new Map();

    /** @type {Request} */
    this.req = undefined;
    /** @type {Response} */
    this.res = undefined;

    this.withInjectUserMiddleware();
  }

  async withInjectUserMiddleware() {
    this.with(async (req, res, next) => {
      const sessionId = this.getCookie("session_id");

      const anonymousUser = {
        features: ["activate:user", "create:session", "create:user"],
      };
      let user = anonymousUser;
      if (sessionId) {
        const authenticatedUser =
          await Authentication.getUserBySession(sessionId);
        user = authenticatedUser;
      }
      req.context = {
        ...req.context,
        user,
      };
      console.info(
        `Request ${sessionId ? "authenticated" : "anonymous"} user`,
        user,
      );
      next();
    });
  }

  with(middleware, method = "ALL") {
    if (!this.middlewares.get(method)) {
      this.middlewares.set(method, []);
    }
    this.middlewares.get(method).push(middleware);
    return this;
  }

  GET(middleware, handler) {
    if (!handler) {
      handler = middleware;
    } else {
      this.with(middleware, "GET");
    }
    this.handlers.set("GET", handler);
    return this;
  }

  POST(middleware, handler) {
    if (!handler) {
      handler = middleware;
    } else {
      this.with(middleware, "POST");
    }
    this.handlers.set("POST", handler);
    return this;
  }

  DELETE(middleware, handler) {
    if (!handler) {
      handler = middleware;
    } else {
      this.with(middleware, "DELETE");
    }
    this.handlers.set("DELETE", handler);
    return this;
  }

  PUT(middleware, handler) {
    if (!handler) {
      handler = middleware;
    } else {
      this.with(middleware, "PUT");
    }
    this.handlers.set("PUT", handler);
    return this;
  }

  PATCH(middleware, handler) {
    if (!handler) {
      handler = middleware;
    } else {
      this.with(middleware, "PATCH");
    }
    this.handlers.set("PATCH", handler);
    return this;
  }

  /**
   * @param {Cookie.SetCookie} cookie
   */
  setCookie(cookie) {
    this.res?.setHeader("Set-Cookie", Cookie.stringifySetCookie(cookie));
    return this;
  }

  /**
   * @param {string} name
   * @returns {string|undefined}
   */
  getCookie(name) {
    return this.req?.cookies[name];
  }

  /**
   * @param {string} name
   * @returns {boolean}
   */
  hasCookie(name) {
    return !!this.req?.cookies[name];
  }

  /**
   * @param {string} name
   * @param {Omit<Cookie.SetCookie, 'name' | 'maxAge' | 'value'>} props
   */
  removeCookie(name, props) {
    if (this.hasCookie(name)) {
      this.setCookie({
        name,
        ...props,
        value: "",
        maxAge: -1,
      });
    }
    return this;
  }

  withAuthorizedFeaturesOnly(...features) {
    return async function (req, _, next) {
      await Authorization.validate(req.context.user, features);
      next();
    };
  }

  async handle(req, res) {
    this.req = req;
    this.res = res;
    const method = String(req.method).toUpperCase();

    try {
      const middlewaresToExecute = [
        ...(this.middlewares.get("ALL") || []),
        ...(this.middlewares.get(method) || []),
      ];

      let shouldNext = false;
      const next = () => {
        shouldNext = true;
      };

      for (const middleware of middlewaresToExecute) {
        const execution = middleware(req, res, next);
        if (execution instanceof Promise) {
          await execution;
        }
        if (shouldNext) {
          continue;
        } else {
          return;
        }
      }

      if (!this.handlers.has(method)) {
        const error = new MethodNotAllowedError();
        return res.status(error.statusCode).json(error);
      }

      const handler = this.handlers.get(method);
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
        !(error instanceof UnauthorizedError) &&
        !(error instanceof ForbiddenError)
      ) {
        error = new InternalServerError({
          cause: error,
        });
        console.error(error);
      }

      if (error instanceof UnauthorizedError) {
        this.removeCookie("session_id", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });
      }

      return res.status(error.statusCode).json(error);
    }
  }
}
