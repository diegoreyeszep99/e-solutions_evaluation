import { HttpStatus } from '@nestjs/common';
import type { PublicErrorDefinition } from '../types/api-error.types';

export const DEFAULT_ERRORS: Record<number, PublicErrorDefinition> = {
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
