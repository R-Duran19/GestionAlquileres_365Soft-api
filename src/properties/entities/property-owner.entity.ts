import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { RentalOwner } from './rental-owner.entity';

@Entity('property_owners')
export class PropertyOwner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  property_id: number;

  @Column()
  rental_owner_id: number;

  @Column({ default: 0 })
  ownership_percentage: number; // Porcentaje de propiedad

  @Column({ default: true })
  is_primary: boolean; // Si es el dueño principal

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => RentalOwner)
  @JoinColumn({ name: 'rental_owner_id' })
  rental_owner: RentalOwner;

  @CreateDateColumn()
  created_at: Date;
}
