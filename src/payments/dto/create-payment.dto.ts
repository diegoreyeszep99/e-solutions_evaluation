import { IsIn, IsInt, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  amountInMinorUnits!: number;

  @IsIn(['GTQ'])
  currency!: 'GTQ';
}
