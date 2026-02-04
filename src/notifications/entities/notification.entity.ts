import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notifications')
@Index(['user_id', 'is_read'])
@Index(['event_type'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  user_id: number;

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
  })
  event_type: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ default: false })
  is_read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
