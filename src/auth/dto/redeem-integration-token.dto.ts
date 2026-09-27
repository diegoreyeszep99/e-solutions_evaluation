import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemIntegrationTokenDto {
  @IsString()
  @IsNotEmpty()
  integrationToken!: string;
}
