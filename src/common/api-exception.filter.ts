import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface PublicExceptionBody {
  code?: string;
  message?: string;
  details?: unknown[];
}

const defaultErrors: Record<number, { code: string; message: string }> = {
  [HttpStatus.BAD_REQUEST]: {
    code: 'BAD_REQUEST',
    message: 'Request is invalid',
  },
  [HttpStatus.UNAUTHORIZED]: {
    code: 'UNAUTHORIZED',
    message: 'Authentication failed',
  },
  [HttpStatus.CONFLICT]: {
    code: 'CONFLICT',
    message: 'Request conflicts with existing state',
  },
  [HttpStatus.INTERNAL_SERVER_ERROR]: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  },
};

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
    const fallback = defaultErrors[statusCode] ?? defaultErrors[500];
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
    return {
      code: typeof body.code === 'string' ? body.code : undefined,
      message: typeof body.message === 'string' ? body.message : undefined,
      details: Array.isArray(body.details) ? body.details : undefined,
    };
  }
}
