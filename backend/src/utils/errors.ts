export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export class UsageLimitError extends AppError {
  constructor(message = 'Usage limit exceeded') {
    super(402, message);
    this.name = 'UsageLimitError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error') {
    super(400, message);
    this.name = 'ValidationError';
  }
}

export class SubscriptionBlockedError extends AppError {
  constructor(message = 'Subscription blocked — payment required to continue') {
    super(403, message);
    this.name = 'SubscriptionBlockedError';
  }
}
