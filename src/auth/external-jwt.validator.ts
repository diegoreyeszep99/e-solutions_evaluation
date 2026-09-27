import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload, verify, VerifyOptions } from 'jsonwebtoken';
import { AUTH_CONFIG, ExternalJwtConfig } from './auth.config';

export interface ExternalJwtPayload {
  sub?: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat?: number;
}

@Injectable()
export class ExternalJwtValidator {
  constructor(
    @Inject(AUTH_CONFIG)
    private readonly config: ExternalJwtConfig,
  ) {}

  validate(token: string): ExternalJwtPayload {
    const options: VerifyOptions = {
      algorithms: ['HS256'],
      issuer: this.config.issuer,
      audience: this.config.audience,
    };

    try {
      const payload = verify(token, this.config.secret, options);

      if (typeof payload === 'string') {
        throw new Error('Invalid payload');
      }

      const claims = payload as JwtPayload;
      if (typeof claims.exp !== 'number') {
        throw new Error('Missing expiration');
      }

      return claims as ExternalJwtPayload;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_EXTERNAL_TOKEN',
        message: 'External token is invalid',
      });
    }
  }
}
