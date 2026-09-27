import 'dotenv/config';
import { Provider } from '@nestjs/common';

export interface ExternalJwtConfig {
  secret: string;
  issuer: string;
  audience: string;
}

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const authConfigProvider: Provider<ExternalJwtConfig> = {
  provide: AUTH_CONFIG,
  useFactory: () => ({
    secret: requiredEnvironmentValue('INTEGRATION_JWT_SECRET'),
    issuer: requiredEnvironmentValue('INTEGRATION_JWT_ISSUER'),
    audience: requiredEnvironmentValue('INTEGRATION_JWT_AUDIENCE'),
  }),
};
