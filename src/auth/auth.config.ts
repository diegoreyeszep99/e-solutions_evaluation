import 'dotenv/config';
import { Provider } from '@nestjs/common';
import { requiredEnvironmentValue } from '../common/required-environment-value';

export interface ExternalJwtConfig {
  secret: string;
  issuer: string;
  audience: string;
}

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

export const authConfigProvider: Provider<ExternalJwtConfig> = {
  provide: AUTH_CONFIG,
  useFactory: () => ({
    secret: requiredEnvironmentValue('INTEGRATION_JWT_SECRET'),
    issuer: requiredEnvironmentValue('INTEGRATION_JWT_ISSUER'),
    audience: requiredEnvironmentValue('INTEGRATION_JWT_AUDIENCE'),
  }),
};
