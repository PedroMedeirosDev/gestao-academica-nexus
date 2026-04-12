import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorEnvelope } from '../types/api-error.types';

function defaultCodeForStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'VALIDATION_ERROR';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    default:
      return 'HTTP_ERROR';
  }
}

function isEnvelope(body: unknown): body is ApiErrorEnvelope {
  if (typeof body !== 'object' || body === null) return false;
  const err = (body as { error?: unknown }).error;
  if (typeof err !== 'object' || err === null) return false;
  return typeof (err as { code?: unknown }).code === 'string';
}

function messageFromUnknown(body: unknown): string {
  if (typeof body === 'string') return body;
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.filter((x) => typeof x === 'string').join('; ');
  }
  return 'Erro na requisição.';
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (isEnvelope(body)) {
        return res.status(status).json(body);
      }
      return res.status(status).json({
        error: {
          code: defaultCodeForStatus(status),
          message: messageFromUnknown(body),
        },
      } satisfies ApiErrorEnvelope);
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno.',
      },
    } satisfies ApiErrorEnvelope);
  }
}
