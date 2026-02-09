import { IsEnum, IsNumber, IsString, IsDateString, Min, IsOptional } from 'class-validator';
import { CashflowType } from '../enums/cashflow-type.enum';
import { CashflowCategory } from '../enums/cashflow-category.enum';

export class CreateCashflowDto {
  @IsEnum(CashflowType)
  type: CashflowType;

  @IsEnum(CashflowCategory)
  category: CashflowCategory;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsString()
  description: string;

  @IsDateString()
  transactionDate: string;
}
