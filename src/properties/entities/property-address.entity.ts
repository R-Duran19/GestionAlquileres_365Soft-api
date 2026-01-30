import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Property } from './property.entity';

@Entity('property_addresses')
export class PropertyAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  property_id: number;

  @Column({ type: 'enum', enum: ['address_1', 'address_2', 'address_3'] })
  address_type: 'address_1' | 'address_2' | 'address_3';

  @Column()
  street_address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zip_code: string;

  @Column()
  country: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @CreateDateColumn()
  created_at: Date;
}
