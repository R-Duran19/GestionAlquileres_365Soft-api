import { Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  phone?: string;

  @Expose()
  role: string;

  @Expose()
  is_active: boolean;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
