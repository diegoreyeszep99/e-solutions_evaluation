import { sign } from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';
import { ExternalJwtValidator } from './external-jwt.validator';

describe('ExternalJwtValidator', () => {
  const config = {
    secret: 'test-secret-that-is-long-enough',
    issuer: 'trusted-integration',
    audience: 'payment-service',
  };
  const validator = new ExternalJwtValidator(config);

  it('accepts a valid HS256 token for the configured issuer and audience', async () => {
    const token = sign(
      { sub: 'integration-client' },
      config.secret,
      {
        algorithm: 'HS256',
        issuer: config.issuer,
        audience: config.audience,
        expiresIn: '5m',
      },
    );

    expect(validator.validate(token)).toMatchObject({
      sub: 'integration-client',
      iss: config.issuer,
      aud: config.audience,
    });
  });

  it('rejects an expired token', () => {
    const token = sign({ sub: 'integration-client' }, config.secret, {
      algorithm: 'HS256',
      issuer: config.issuer,
      audience: config.audience,
      expiresIn: -1,
    });

    expect(() => validator.validate(token)).toThrow(UnauthorizedException);
  });

  it('rejects a token with an invalid signature', () => {
    const token = sign({ sub: 'integration-client' }, 'different-secret', {
      algorithm: 'HS256',
      issuer: config.issuer,
      audience: config.audience,
      expiresIn: '5m',
    });

    expect(() => validator.validate(token)).toThrow(UnauthorizedException);
  });
});
