export class AppError extends Error {
  public readonly code: number;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code = 500001,
    statusCode = 500,
    isOperational = true,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400001, 400, true);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401001, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403001, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404001, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409001, 409, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super(message, 429001, 429, true);
  }
}
