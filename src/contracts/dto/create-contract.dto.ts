import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateContractDto {
  @IsNotEmpty()
  @IsNumber()
  tenant_id: number;

  @IsNotEmpty()
  @IsNumber()
  property_id: number;

  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @IsNotEmpty()
  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsDateString()
  key_delivery_date?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  monthly_rent: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  payment_day?: number;

  @IsOptional()
  @IsNumber()
  deposit_amount?: number;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsNumber()
  late_fee_percentage?: number;

  @IsOptional()
  @IsNumber()
  grace_days?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  included_services?: string[];

  @IsOptional()
  @IsString()
  tenant_responsibilities?: string;

  @IsOptional()
  @IsString()
  owner_responsibilities?: string;

  @IsOptional()
  @IsString()
  prohibitions?: string;

  @IsOptional()
  @IsString()
  coexistence_rules?: string;

  @IsOptional()
  @IsString()
  renewal_terms?: string;

  @IsOptional()
  @IsString()
  termination_terms?: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;

  @IsOptional()
  @IsNumber()
  renewal_notice_days?: number;

  @IsOptional()
  @IsNumber()
  auto_increase_percentage?: number;

  @IsOptional()
  @IsString()
  bank_account_number?: string;

  @IsOptional()
  @IsString()
  bank_account_type?: string;

  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  bank_account_holder?: string;
}
