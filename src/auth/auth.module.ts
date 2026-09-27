import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { authConfigProvider } from './auth.config';
import { ExternalJwtValidator } from './external-jwt.validator';
import { IntegrationTokenService } from './integration-token.service';

@Module({
  controllers: [AuthController],
  providers: [
    authConfigProvider,
    ExternalJwtValidator,
    IntegrationTokenService,
  ],
})
export class AuthModule {}
