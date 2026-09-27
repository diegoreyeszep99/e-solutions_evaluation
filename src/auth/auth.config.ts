import 'dotenv/config';
import type { Provider } from '@nestjs/common';
import { requiredEnvironmentValue } from '../common/required-environment-value';
import { AUTH_CONFIG } from './constants/auth.constants';
import type { ExternalJwtConfig } from './types/auth.types';

export const authConfigProvider: Provider<ExternalJwtConfig> = {
  provide: AUTH_CONFIG,
  useFactory: () => ({
    secret: requiredEnvironmentValue('INTEGRATION_JWT_SECRET'),
    issuer: requiredEnvironmentValue('INTEGRATION_JWT_ISSUER'),
    audience: requiredEnvironmentValue('INTEGRATION_JWT_AUDIENCE'),
  }),
};
