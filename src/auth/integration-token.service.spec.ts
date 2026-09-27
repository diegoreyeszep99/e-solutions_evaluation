import { UnauthorizedException } from '@nestjs/common';
import { IntegrationTokenService } from './integration-token.service';

describe('IntegrationTokenService', () => {
  it('allows a token to be redeemed exactly once', () => {
    const service = new IntegrationTokenService();
    const issued = service.issue();

    expect(() => service.redeem(issued.integrationToken)).not.toThrow();
    expect(() => service.redeem(issued.integrationToken)).toThrow(
      UnauthorizedException,
    );
  });
});
