import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CashflowType } from '../enums/cashflow-type.enum';
import { CashflowCategory } from '../enums/cashflow-category.enum';
import { CashflowReferenceType } from '../enums/cashflow-reference-type.enum';

@Entity('cashflow')
export class Cashflow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: CashflowType,
  })
  type: CashflowType;

  @Column({
    type: 'enum',
    enum: CashflowCategory,
  })
  category: CashflowCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: CashflowReferenceType,
    nullable: true,
  })
  reference_type: CashflowReferenceType;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: number | null;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
