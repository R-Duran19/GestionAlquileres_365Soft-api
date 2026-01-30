import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PropertyType } from './property-type.entity';

@Entity('property_subtypes')
export class PropertySubtype {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  property_type_id: number;

  @Column()
  name: string; // 'condo/townhome', 'multi-family', 'single-family', etc.

  @Column({ unique: true })
  code: string; // 'CONDO_TOWNHOME', 'MULTI_FAMILY', etc.

  @ManyToOne(() => PropertyType)
  @JoinColumn({ name: 'property_type_id' })
  property_type: PropertyType;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
