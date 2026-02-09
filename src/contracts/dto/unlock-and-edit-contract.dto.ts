import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UnlockAndEditContractDto {
  @IsString()
  @IsNotEmpty()
  justification: string;

  @IsOptional()
  @IsNumber()
  monthly_rent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  payment_day?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  grace_days?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  late_fee_percentage?: number;

  @IsOptional()
  start_date?: Date;

  @IsOptional()
  end_date?: Date;

  @IsOptional()
  @IsNumber()
  duration_months?: number;
}
