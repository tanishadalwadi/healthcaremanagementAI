export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly error?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, error?: unknown) {
    super(404, message, error);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, error?: unknown) {
    super(400, message, error);
    this.name = "BadRequestError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, error?: unknown) {
    super(409, message, error);
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, error?: unknown) {
    super(401, message, error);
    this.name = "UnauthorizedError";
  }
}
