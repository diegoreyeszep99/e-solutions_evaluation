import { sign } from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';
import { ExternalJwtValidator } from './external-jwt.validator';

describe('Validador de JWT externos', () => {
  const config = {
    secret: 'test-secret-that-is-long-enough',
    issuer: 'trusted-integration',
    audience: 'payment-service',
  };
  const validator = new ExternalJwtValidator(config);

  it('acepta un token HS256 válido para el emisor y la audiencia configurados', async () => {
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

  it('rechaza un token vencido', () => {
    const token = sign({ sub: 'integration-client' }, config.secret, {
      algorithm: 'HS256',
      issuer: config.issuer,
      audience: config.audience,
      expiresIn: -1,
    });

    expect(() => validator.validate(token)).toThrow(UnauthorizedException);
  });

  it('rechaza un token con firma inválida', () => {
    const token = sign({ sub: 'integration-client' }, 'different-secret', {
      algorithm: 'HS256',
      issuer: config.issuer,
      audience: config.audience,
      expiresIn: '5m',
    });

    expect(() => validator.validate(token)).toThrow(UnauthorizedException);
  });
});
