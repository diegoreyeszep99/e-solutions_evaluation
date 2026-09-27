import 'dotenv/config';
import { sign } from 'jsonwebtoken';

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const token = sign(
  { sub: process.env.TEST_TOKEN_SUBJECT ?? 'test-integration' },
  requiredEnvironmentValue('INTEGRATION_JWT_SECRET'),
  {
    algorithm: 'HS256',
    issuer: requiredEnvironmentValue('INTEGRATION_JWT_ISSUER'),
    audience: requiredEnvironmentValue('INTEGRATION_JWT_AUDIENCE'),
    expiresIn: '5m',
  },
);

process.stdout.write(`${token}\n`);
