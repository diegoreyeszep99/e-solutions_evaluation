import { IsIn, IsInt, Min } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsInt()
  @Min(1)
  amountInMinorUnits!: number;

  @IsIn(['GTQ'])
  currency!: 'GTQ';
}
