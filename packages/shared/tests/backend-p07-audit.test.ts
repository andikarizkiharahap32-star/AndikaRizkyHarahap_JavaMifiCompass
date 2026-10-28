import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ERROR_CODES,
  formatProblemDetails,
} from '../../../apps/api/src/errors/app-error';

describe('Backend and Workflows - P07: Error Model (RFC 9457)', () => {
  it('formats AppError subclasses strictly into RFC 9457 problem+json structure', () => {
    const error = new ValidationError('Payload failed schema validation', [
      { name: 'destinationCountry', reason: 'Must be 2-letter ISO country code' },
    ]);

    const correlationId = 'test-corr-id-12345';
    const problem = formatProblemDetails(error, correlationId, false);

    expect(problem.type).toBe('https://api.javamifi.com/errors/validation-failed');
    expect(problem.title).toBe('Payload failed schema validation');
    expect(problem.status).toBe(400);
    expect(problem.code).toBe(ERROR_CODES.VALIDATION_FAILED);
    expect(problem.correlationId).toBe(correlationId);
    expect(problem.invalidParams).toHaveLength(1);
    expect(problem.invalidParams![0]!.name).toBe('destinationCountry');
  });

  it('maps all standard AppError subclasses to their expected HTTP status codes', () => {
    const cases = [
      {
        err: new ValidationError(),
        expectedStatus: 400,
        expectedCode: ERROR_CODES.VALIDATION_FAILED,
      },
      {
        err: new AuthenticationError(),
        expectedStatus: 401,
        expectedCode: ERROR_CODES.AUTHENTICATION_REQUIRED,
      },
      {
        err: new ForbiddenError(),
        expectedStatus: 403,
        expectedCode: ERROR_CODES.FORBIDDEN_ACCESS,
      },
      {
        err: new NotFoundError('Place', 'tokyo-ramen'),
        expectedStatus: 404,
        expectedCode: ERROR_CODES.RESOURCE_NOT_FOUND,
      },
      {
        err: new ConflictError(),
        expectedStatus: 409,
        expectedCode: ERROR_CODES.RESOURCE_CONFLICT,
      },
      {
        err: new RateLimitError(30),
        expectedStatus: 429,
        expectedCode: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      },
      {
        err: new InternalServerError(),
        expectedStatus: 500,
        expectedCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      },
    ];

    for (const { err, expectedStatus, expectedCode } of cases) {
      const problem = formatProblemDetails(err, 'c1', false);
      expect(problem.status).toBe(expectedStatus);
      expect(problem.code).toBe(expectedCode);
      expect(problem.status).not.toBe(200); // Strict prohibition: never 200 for errors
    }
  });

  it('preserves retryAfter header in RateLimitError', () => {
    const rateLimitError = new RateLimitError(120);
    const problem = formatProblemDetails(rateLimitError, 'c_rate', false);
    expect(problem.status).toBe(429);
    expect(problem.retryAfter).toBe(120);
  });

  it('strict security prohibition: strips stack traces and SQL queries from non-dev responses', () => {
    // Simulated raw database error with sensitive SQL query
    const sqlError = new Error(
      'syntax error at or near "SELECT password_hash FROM users" at line 1',
    );
    sqlError.stack =
      'Error: syntax error at ...\n    at Client.query (/node_modules/pg/client.js:123)';

    // In non-dev environment:
    const problem = formatProblemDetails(sqlError, 'corr_sec_test', false);

    expect(problem.status).toBe(500);
    expect(problem.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
    expect(problem.title).toBe('An unexpected internal server error occurred');
    // SQL query must NOT leak in details or title
    expect(problem.detail).not.toContain('SELECT password_hash');
    expect(problem.title).not.toContain('password_hash');
    // Stack trace must NOT be attached
    expect(problem.stack).toBeUndefined();
  });

  it('includes stack trace ONLY when isDev is explicitly true for local debugging', () => {
    const debugError = new Error('Local dev test error');
    const devProblem = formatProblemDetails(debugError, 'corr_dev_test', true);

    expect(devProblem.status).toBe(500);
    expect(devProblem.stack).toBeDefined();
    expect(devProblem.stack).toContain('Local dev test error');
  });

  it('guarantees correlationId is attached to all error responses', () => {
    const genericErr = new Error('Random system glitch');
    const problem = formatProblemDetails(genericErr);

    expect(problem.correlationId).toBeDefined();
    expect(typeof problem.correlationId).toBe('string');
    expect(problem.correlationId.length).toBeGreaterThan(10);
  });

  it('verifies complete error code registry coverage', () => {
    const requiredCodes = [
      'VALIDATION_FAILED',
      'AUTHENTICATION_REQUIRED',
      'FORBIDDEN_ACCESS',
      'RESOURCE_NOT_FOUND',
      'RESOURCE_CONFLICT',
      'RATE_LIMIT_EXCEEDED',
      'INTERNAL_SERVER_ERROR',
    ];

    for (const code of requiredCodes) {
      expect((ERROR_CODES as any)[code]).toBe(code);
    }
  });
});
