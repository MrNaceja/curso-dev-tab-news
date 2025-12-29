class BaseError extends Error {
  constructor({ cause, message, action, name, statusCode }) {
    super(message, {
      cause,
    });
    this.name = name;
    this.action = action;
    this.statusCode = statusCode;
  }

  toJSON() {
    return {
      message: this.message,
      name: this.name,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class InternalServerError extends BaseError {
  constructor({ cause, statusCode = 500 }) {
    super({
      cause,
      message: "Erro interno não esperado.",
      name: "InternalServerError",
      action: "Entre em contato com o suporte.",
      statusCode,
    });
  }
}

export class MethodNotAllowedError extends BaseError {
  constructor() {
    super({
      message: "Método HTTP não permitido.",
      name: "MethodNotAllowedError",
      action: "Verifique o método HTTP enviado nos cabeçalhos da requisição.",
      statusCode: 405,
    });
  }
}

export class NotFoundError extends BaseError {
  constructor() {
    super({
      message: "Recurso não encontrado",
      name: "NotFoundError",
      action: "Verifique os cabeçalhos enviados e a formatação da URL",
      statusCode: 404,
    });
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor({ message, cause }) {
    super({
      message:
        "Serviço indisponível no momento." + (message ? `\n ${message}` : ""),
      name: "ServiceUnavailableError",
      action: "Verifique a disponíbilidade do serviço.",
      statusCode: 503,
      cause,
    });
  }
}
