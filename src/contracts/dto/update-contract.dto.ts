import { PartialType } from '@nestjs/mapped-types';
import { CreateContractDto } from './create-contract.dto';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ContractStatus } from '../enums/contract-status.enum';

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsString()
  update_reason?: string;
}
