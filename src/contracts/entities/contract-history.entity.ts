import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contract } from './contract.entity';

@Entity('contract_history')
export class ContractHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contract_id: number;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column()
  field_modified: string;

  @Column({ type: 'text', nullable: true })
  old_value: string | null;

  @Column({ type: 'text', nullable: true })
  new_value: string | null;

  @Column()
  modified_by: number; // User ID

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn()
  change_date: Date;
}
