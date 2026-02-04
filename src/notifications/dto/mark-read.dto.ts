import { IsOptional, IsBoolean } from 'class-validator';

export class MarkAsReadDto {
  @IsBoolean()
  @IsOptional()
  is_read?: boolean;
}
