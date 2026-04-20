export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') { super(message, 400); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super(message, 401); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403); }
}
export class NotFoundError extends AppError {
  constructor(message = 'Not Found') { super(message, 404); }
}
export class ValidationError extends AppError {
  constructor(message = 'Validation Error') { super(message, 422); }
}
export class ConflictError extends AppError {
  constructor(message = 'Conflict') { super(message, 409); }
}
export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') { super(message, 500); }
}
export class ExternalAPIError extends AppError {
  constructor(message = 'External API Error') { super(message, 502); }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 422;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
  }

  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
