export class InternalServerError extends Error {
  constructor(cause) {
    super("Erro interno não esperado.", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Entre em contato com o suporte.";
    this.statusCode = 500;
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

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Método HTTP não permitido.");
    this.name = "MethodNotAllowedError";
    this.action =
      "Verifique o método HTTP enviado nos cabeçalhos da requisição.";
    this.statusCode = 405;
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

export class NotFoundError extends Error {
  constructor() {
    super("Recurso não encontrado");
    this.name = "NotFoundError";
    this.action = "Verifique os cabeçalhos enviados e a formatação da URL";
    this.statusCode = 404;
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
