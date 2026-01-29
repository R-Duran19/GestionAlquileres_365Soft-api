import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string; // "inmuebles-bolivia"

  @Column({ unique: true })
  schema_name: string; // "tenant_inmuebles_bolivia"

  @Column()
  company_name: string; // "Inmuebles Bolivia SRL"

  @Column({ nullable: true })
  logo_url: string;

  @Column({ default: 'BOB' })
  currency: string;

  @Column({ default: 'es-BO' })
  locale: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
