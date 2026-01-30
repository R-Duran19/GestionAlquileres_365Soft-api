import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('property_types')
export class PropertyType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // 'Residencial' or 'Comercial'

  @Column({ unique: true })
  code: string; // 'RESIDENTIAL' or 'COMMERCIAL'

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
