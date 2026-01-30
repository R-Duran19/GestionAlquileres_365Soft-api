import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rental_owners')
export class RentalOwner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  company_name: string;

  @Column({ nullable: true })
  is_company: boolean;

  @Column()
  primary_email: string;

  @Column()
  phone_number: string;

  @Column({ nullable: true })
  secondary_email: string;

  @Column({ nullable: true })
  secondary_phone: string;

  @Column({ default: '' })
  notes: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
