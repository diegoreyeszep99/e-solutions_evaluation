import { UnauthorizedException } from '@nestjs/common';
import { IntegrationTokenService } from './integration-token.service';

describe('Servicio de tokens de integración', () => {
  it('permite consumir un token exactamente una vez', () => {
    const service = new IntegrationTokenService();
    const issued = service.issue();

    expect(() => service.redeem(issued.integrationToken)).not.toThrow();
    expect(() => service.redeem(issued.integrationToken)).toThrow(
      UnauthorizedException,
    );
  });
});
