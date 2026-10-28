import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { formatProblemDetails, AppError } from '../errors/app-error';

/**
 * Global RFC 9457 Problem Details Exception Filter
 *
 * Invariants (P07):
 * 1. Sets Content-Type: application/problem+json.
 * 2. Echoes x-correlation-id in response headers.
 * 3. Never returns 200 for error responses.
 * 4. Never leaks internal stacks or SQL in non-development modes.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 1. Resolve or generate correlationId
    const correlationIdHeader = request.headers['x-correlation-id'];
    const correlationId =
      typeof correlationIdHeader === 'string' && correlationIdHeader.trim() !== ''
        ? correlationIdHeader
        : crypto.randomUUID();

    const isDev = process.env.NODE_ENV === 'development';

    // 2. Format into RFC 9457 Problem Details
    const problem = formatProblemDetails(exception, correlationId, isDev);

    // 3. Log securely without logging credentials
    if (problem.status >= 500) {
      this.logger.error(
        `[${correlationId}] 500 Internal Error on ${request.method} ${request.url}: ${problem.title}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${correlationId}] ${problem.status} on ${request.method} ${request.url}: ${problem.title}`);
    }

    // 4. Set headers and response
    response
      .status(problem.status)
      .setHeader('Content-Type', 'application/problem+json')
      .setHeader('x-correlation-id', correlationId)
      .json(problem);
  }
}
