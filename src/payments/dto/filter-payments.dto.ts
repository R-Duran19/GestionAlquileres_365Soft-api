import { IsOptional, IsEnum, IsInt, IsDateString, IsString, Min } from 'class-validator';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Type } from 'class-transformer';

export class FilterPaymentsDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tenantId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  propertyId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  contractNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
