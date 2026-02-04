import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: [
      // Mantenimiento
      'maintenance.request.created',
      'maintenance.status.changed',
      'maintenance.message.received',
      'maintenance.assigned',
      'maintenance.completed',
      // Propiedades
      'property.status.changed',
      'property.available',
      // Usuarios
      'user.registered',
      'user.password.changed',
    ],
    unique: true,
  })
  event_type: string;

  @Column()
  title_template: string;

  @Column('text')
  message_template: string;

  @Column({ type: 'jsonb', default: [] })
  variables: string[];

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
