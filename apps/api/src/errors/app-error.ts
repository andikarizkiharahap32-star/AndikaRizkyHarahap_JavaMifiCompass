import * as crypto from 'crypto';

/**
 * P07: RFC 9457 Problem Details Error Model
 *
 * Invariants:
 * 1. Output adheres strictly to RFC 9457 application/problem+json:
 *    type, title, status, code, correlationId, detail?, invalidParams?
 * 2. AppError subclasses map deterministically to HTTP status codes.
 * 3. Prohibitions: NEVER leak stack traces, SQL strings, or raw DB errors in non-dev responses.
 * 4. NEVER use 200 for error responses.
 */

export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  FORBIDDEN_ACCESS: 'FORBIDDEN_ACCESS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface InvalidParam {
  name: string;
  reason: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: ErrorCode;
  detail?: string;
  correlationId: string;
  invalidParams?: InvalidParam[];
  retryAfter?: number;
  stack?: string; // ONLY populated if isDev === true
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly type: string;
  readonly detail?: string;
  readonly invalidParams?: InvalidParam[];
  readonly retryAfter?: number;

  constructor(params: {
    message: string;
    statusCode: number;
    code: ErrorCode;
    type?: string;
    detail?: string;
    invalidParams?: InvalidParam[];
    retryAfter?: number;
  }) {
    super(params.message);
    this.name = this.constructor.name;
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.type = params.type || `https://api.javamifi.com/errors/${params.code.toLowerCase().replace(/_/g, '-')}`;
    this.detail = params.detail || params.message;
    this.invalidParams = params.invalidParams;
    this.retryAfter = params.retryAfter;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed for one or more fields', invalidParams?: InvalidParam[]) {
    super({
      message,
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_FAILED,
      invalidParams,
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication credentials are required or invalid') {
    super({
      message,
      statusCode: 401,
      code: ERROR_CODES.AUTHENTICATION_REQUIRED,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access to this resource is prohibited for your role') {
    super({
      message,
      statusCode: 403,
      code: ERROR_CODES.FORBIDDEN_ACCESS,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', identifier?: string) {
    const detail = identifier ? `${resource} '${identifier}' was not found.` : `${resource} was not found.`;
    super({
      message: detail,
      statusCode: 404,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      detail,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource state conflict encountered') {
    super({
      message,
      statusCode: 409,
      code: ERROR_CODES.RESOURCE_CONFLICT,
    });
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds = 60, message = 'Rate limit exceeded. Please retry later.') {
    super({
      message,
      statusCode: 429,
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      retryAfter: retryAfterSeconds,
    });
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected server error occurred') {
    super({
      message,
      statusCode: 500,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Converts any thrown error or exception into an RFC 9457 Problem Details object.
 * Strictly strips internal stacks, SQL queries, and database driver messages in non-dev environments.
 */
export function formatProblemDetails(
  err: unknown,
  correlationId: string = crypto.randomUUID(),
  isDev = false,
): ProblemDetails {
  if (err instanceof AppError) {
    const problem: ProblemDetails = {
      type: err.type,
      title: err.message,
      status: err.statusCode,
      code: err.code,
      detail: err.detail,
      correlationId,
      invalidParams: err.invalidParams,
      retryAfter: err.retryAfter,
    };

    if (isDev && err.stack) {
      problem.stack = err.stack;
    }
    return problem;
  }

  // Handle standard NestJS HttpExceptions if present
  if (err && typeof err === 'object' && 'getStatus' in err && typeof (err as any).getStatus === 'function') {
    const nestStatus = (err as any).getStatus();
    const nestResponse = (err as any).getResponse?.() || {};
    const message = typeof nestResponse === 'string' ? nestResponse : (nestResponse as any).message || (err as any).message || 'HTTP Error';

    return {
      type: `https://api.javamifi.com/errors/http-${nestStatus}`,
      title: Array.isArray(message) ? message.join('; ') : String(message),
      status: nestStatus,
      code: nestStatus === 400 ? ERROR_CODES.VALIDATION_FAILED : nestStatus === 401 ? ERROR_CODES.AUTHENTICATION_REQUIRED : nestStatus === 403 ? ERROR_CODES.FORBIDDEN_ACCESS : nestStatus === 404 ? ERROR_CODES.RESOURCE_NOT_FOUND : ERROR_CODES.INTERNAL_SERVER_ERROR,
      correlationId,
    };
  }

  // Unknown / unhandled system error: fail closed to 500 without leaking SQL or internal stack
  const generic500: ProblemDetails = {
    type: 'https://api.javamifi.com/errors/internal-server-error',
    title: 'An unexpected internal server error occurred',
    status: 500,
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    detail: 'The operational team has been notified with this correlation ID.',
    correlationId,
  };

  if (isDev && err instanceof Error && err.stack) {
    generic500.stack = err.stack;
    generic500.detail = err.message;
  }

  return generic500;
}
