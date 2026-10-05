import env from '../config/env.js';

export const notFound = (req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
};

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (env.NODE_ENV === 'production' && !err.isOperational) {
    return res.status(500).json({ error: 'Internal server error' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
