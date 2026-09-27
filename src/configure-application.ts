import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ApiExceptionFilter } from './common/api-exception.filter';

interface ValidationDetail {
  field: string;
  message: string;
}

function validationDetails(
  errors: ValidationError[],
  parent = '',
): ValidationDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const ownDetails = Object.values(error.constraints ?? {}).map((message) => ({
      field,
      message,
    }));

    return [
      ...ownDetails,
      ...validationDetails(error.children ?? [], field),
    ];
  });
}

export function configureApplication(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: validationDetails(errors),
        }),
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
}
