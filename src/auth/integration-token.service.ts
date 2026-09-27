import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

interface StoredIntegrationToken {
  expiresAt: number;
}

export interface IssuedIntegrationToken {
  integrationToken: string;
  expiresAt: string;
}

@Injectable()
export class IntegrationTokenService {
  private readonly tokens = new Map<string, StoredIntegrationToken>();

  issue(): IssuedIntegrationToken {
    const integrationToken = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + TOKEN_LIFETIME_MS;

    this.tokens.set(this.hash(integrationToken), { expiresAt });

    return {
      integrationToken,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  redeem(integrationToken: string): void {
    const tokenHash = this.hash(integrationToken);
    const storedToken = this.tokens.get(tokenHash);

    if (!storedToken || storedToken.expiresAt <= Date.now()) {
      this.tokens.delete(tokenHash);
      throw this.invalidToken();
    }

    this.tokens.delete(tokenHash);
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private invalidToken(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_INTEGRATION_TOKEN',
      message: 'Integration token is invalid',
    });
  }
}
