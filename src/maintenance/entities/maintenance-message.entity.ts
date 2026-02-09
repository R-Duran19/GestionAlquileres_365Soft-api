import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MaintenanceRequest } from './maintenance-request.entity';
import { MaintenanceAttachment } from './maintenance-attachment.entity';

@Entity('maintenance_messages')
export class MaintenanceMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  maintenance_request_id: number;

  @Column()
  user_id: number;

  @Column('text')
  message: string;

  @Column({ default: true })
  send_to_resident: boolean;

  // Relations
  @ManyToOne(() => MaintenanceRequest, (request) => request.messages)
  @JoinColumn({ name: 'maintenance_request_id' })
  maintenance_request: MaintenanceRequest;

  @OneToMany(() => MaintenanceAttachment, (attachment) => attachment.message, {
    cascade: true,
  })
  attachments: MaintenanceAttachment[];

  @CreateDateColumn()
  created_at: Date;
}
