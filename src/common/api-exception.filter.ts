import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { DEFAULT_ERRORS } from './constants/api-error.constants';
import type { PublicExceptionBody } from './types/api-error.types';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const fallback = DEFAULT_ERRORS[statusCode] ?? DEFAULT_ERRORS[500];
    const exceptionBody = this.getPublicBody(exception);

    response.status(statusCode).json({
      statusCode,
      code: exceptionBody.code ?? fallback.code,
      message: exceptionBody.message ?? fallback.message,
      details: exceptionBody.details ?? [],
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  private getPublicBody(exception: unknown): PublicExceptionBody {
    if (!(exception instanceof HttpException)) {
      return {};
    }

    const response = exception.getResponse();
    if (typeof response !== 'object' || response === null) {
      return {};
    }

    const body = response as PublicExceptionBody;
    if (typeof body.code !== 'string') {
      return {};
    }

    return {
      code: body.code,
      message: typeof body.message === 'string' ? body.message : undefined,
      details: Array.isArray(body.details) ? body.details : undefined,
    };
  }
}
