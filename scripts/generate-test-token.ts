import 'dotenv/config';
import { sign } from 'jsonwebtoken';
import { requiredEnvironmentValue } from '../src/common/required-environment-value';

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
