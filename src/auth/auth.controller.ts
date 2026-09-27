import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginIntegrationDto } from './dto/login-integration.dto';
import { RedeemIntegrationTokenDto } from './dto/redeem-integration-token.dto';
import { ExternalJwtValidator } from './external-jwt.validator';
import { IntegrationTokenService } from './integration-token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly externalJwtValidator: ExternalJwtValidator,
    private readonly integrationTokenService: IntegrationTokenService,
  ) {}

  @Post('login-integration')
  loginIntegration(@Body() body: LoginIntegrationDto) {
    this.externalJwtValidator.validate(body.jwt);
    return this.integrationTokenService.issue();
  }

  @Post('redeem')
  @HttpCode(HttpStatus.NO_CONTENT)
  redeem(@Body() body: RedeemIntegrationTokenDto): void {
    this.integrationTokenService.redeem(body.integrationToken);
  }
}
