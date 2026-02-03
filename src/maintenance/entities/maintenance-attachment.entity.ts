import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaintenanceRequest } from './maintenance-request.entity';
import { MaintenanceMessage } from './maintenance-message.entity';

@Entity('maintenance_attachments')
export class MaintenanceAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  maintenance_request_id: number;

  @Column({ nullable: true })
  message_id: number;

  @Column()
  file_url: string;

  @Column()
  file_name: string;

  @Column()
  file_type: string;

  @Column({ type: 'bigint' })
  file_size: number;

  @Column()
  uploaded_by: number;

  // Relations
  @ManyToOne(() => MaintenanceRequest, (request) => request.attachments)
  @JoinColumn({ name: 'maintenance_request_id' })
  maintenance_request: MaintenanceRequest;

  @ManyToOne(() => MaintenanceMessage, (message) => message.attachments)
  @JoinColumn({ name: 'message_id' })
  message: MaintenanceMessage;

  @CreateDateColumn()
  created_at: Date;
}
