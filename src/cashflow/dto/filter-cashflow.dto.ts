import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CashflowType } from '../enums/cashflow-type.enum';
import { CashflowCategory } from '../enums/cashflow-category.enum';

export class FilterCashflowDto {
  @IsOptional()
  @IsEnum(CashflowType)
  type?: CashflowType;

  @IsOptional()
  @IsEnum(CashflowCategory)
  category?: CashflowCategory;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
