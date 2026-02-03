import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MaintenanceRequest } from './entities/maintenance-request.entity';
import { MaintenanceMessage } from './entities/maintenance-message.entity';
import { MaintenanceAttachment } from './entities/maintenance-attachment.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRequest)
    private maintenanceRepository: Repository<MaintenanceRequest>,
    @InjectRepository(MaintenanceMessage)
    private messageRepository: Repository<MaintenanceMessage>,
    @InjectRepository(MaintenanceAttachment)
    private attachmentRepository: Repository<MaintenanceAttachment>,
    private dataSource: DataSource,
  ) {}

  /**
   * Genera un número de ticket único y aleatorio
   * Formato: MNT-AAAA-XXXXXX
   */
  private generateTicketNumber(): string {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos (0, O, I, 1)
    let random = '';
    for (let i = 0; i < 6; i++) {
      random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `MNT-${year}-${random}`;
  }

  /**
   * Crea una nueva solicitud de mantenimiento
   */
  async create(
    createMaintenanceDto: CreateMaintenanceDto,
    tenantId: number,
    propertyId: number,
    assignedTo: number,
  ): Promise<MaintenanceRequest> {
    const ticketNumber = this.generateTicketNumber();

    // Validar: si es GENERAL, category debe ser null
    let category: string | undefined = createMaintenanceDto.category;
    if (createMaintenanceDto.request_type === 'GENERAL') {
      category = undefined;
    }

    // Usar query directa que respeta el search_path del tenant
    const result = await this.dataSource.query(
      `INSERT INTO maintenance_requests(
        ticket_number, request_type, category, title, description,
        permission_to_enter, has_pets, entry_notes,
        tenant_id, property_id, assigned_to
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        ticketNumber,
        createMaintenanceDto.request_type,
        category,
        createMaintenanceDto.title,
        createMaintenanceDto.description,
        createMaintenanceDto.permission_to_enter || 'NOT_APPLICABLE',
        createMaintenanceDto.has_pets || false,
        createMaintenanceDto.entry_notes || null,
        tenantId,
        propertyId,
        assignedTo,
      ],
    );

    const savedRequest = result[0];

    // Guardar archivos adjuntos si existen
    if (createMaintenanceDto.files && createMaintenanceDto.files.length > 0) {
      for (const fileUrl of createMaintenanceDto.files) {
        await this.dataSource.query(
          `INSERT INTO maintenance_attachments(
            maintenance_request_id, file_url, file_name, file_type, file_size, uploaded_by
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            savedRequest.id,
            fileUrl,
            fileUrl.split('/').pop() || 'unknown',
            this.getFileType(fileUrl),
            0,
            tenantId,
          ],
        );
      }
    }

    return this.findOne(savedRequest.id);
  }

  /**
   * Obtiene todas las solicitudes (admin) con filtros
   */
  async findAll(filters?: {
    status?: string;
    priority?: string;
    request_type?: string;
    tenant_id?: number;
    property_id?: number;
  }): Promise<any[]> {
    let query = `
      SELECT
        mr.*,
        json_build_object('id', p.id, 'title', p.title) as property
      FROM maintenance_requests mr
      LEFT JOIN properties p ON p.id = mr.property_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND mr.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.priority) {
      query += ` AND mr.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    if (filters?.request_type) {
      query += ` AND mr.request_type = $${paramIndex++}`;
      params.push(filters.request_type);
    }

    if (filters?.tenant_id) {
      query += ` AND mr.tenant_id = $${paramIndex++}`;
      params.push(filters.tenant_id);
    }

    if (filters?.property_id) {
      query += ` AND mr.property_id = $${paramIndex++}`;
      params.push(filters.property_id);
    }

    query += ` ORDER BY mr.updated_at DESC`;

    return this.dataSource.query(query, params);
  }

  /**
   * Obtiene las solicitudes de un inquilino específico
   */
  async findByTenant(tenantId: number): Promise<any[]> {
    return this.dataSource.query(
      `SELECT
        mr.*,
        json_build_object('id', p.id, 'title', p.title) as property
      FROM maintenance_requests mr
      LEFT JOIN properties p ON p.id = mr.property_id
      WHERE mr.tenant_id = $1
      ORDER BY mr.updated_at DESC`,
      [tenantId],
    );
  }

  /**
   * Obtiene una solicitud por ID con todos sus detalles
   */
  async findOne(id: number): Promise<any> {
    const requests = await this.dataSource.query(
      `SELECT * FROM maintenance_requests WHERE id = $1`,
      [id],
    );

    if (!requests || requests.length === 0) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const maintenance = requests[0];

    // Obtener mensajes con sus attachments
    const messages = await this.dataSource.query(
      `SELECT
        mm.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ma.id,
              'file_url', ma.file_url,
              'file_name', ma.file_name,
              'file_type', ma.file_type,
              'created_at', ma.created_at
            )
          ) FILTER (WHERE ma.id IS NOT NULL),
          '[]'
        ) as attachments
      FROM maintenance_messages mm
      LEFT JOIN maintenance_attachments ma ON ma.message_id = mm.id
      WHERE mm.maintenance_request_id = $1
      GROUP BY mm.id
      ORDER BY mm.created_at ASC`,
      [id],
    );

    (maintenance as any).messages = messages;

    // Obtener attachments directos de la solicitud
    const attachments = await this.dataSource.query(
      `SELECT * FROM maintenance_attachments
      WHERE maintenance_request_id = $1 AND message_id IS NULL`,
      [id],
    );

    (maintenance as any).attachments = attachments;

    return maintenance;
  }

  /**
   * Actualiza una solicitud
   */
  async update(id: number, updateMaintenanceDto: UpdateMaintenanceDto): Promise<any> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(updateMaintenanceDto).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert camelCase to snake_case
        const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${columnName} = $${paramIndex++}`);
        params.push(value);
      }
    });

    if (updates.length === 0) {
      return this.findOne(id);
    }

    params.push(id);

    await this.dataSource.query(
      `UPDATE maintenance_requests
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}`,
      params,
    );

    return this.findOne(id);
  }

  /**
   * Elimina una solicitud
   */
  async remove(id: number): Promise<void> {
    await this.dataSource.query(`DELETE FROM maintenance_requests WHERE id = $1`, [id]);
  }

  /**
   * Agrega un mensaje a una solicitud
   */
  async addMessage(
    requestId: number,
    createMessageDto: CreateMessageDto,
    userId: number,
  ): Promise<any> {
    const request = await this.findOne(requestId);

    // Verificar si el inquilino puede enviar mensajes
    const isTenant = request.tenant_id === userId;
    if (isTenant && ['COMPLETED', 'CLOSED'].includes(request.status)) {
      throw new ForbiddenException('No puedes enviar mensajes en solicitudes terminadas o cerradas');
    }

    // Insertar mensaje
    const messageResult = await this.dataSource.query(
      `INSERT INTO maintenance_messages (maintenance_request_id, user_id, message, send_to_resident)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        requestId,
        userId,
        createMessageDto.message,
        createMessageDto.send_to_resident !== false,
      ],
    );

    const savedMessage = messageResult[0];

    // Guardar archivos adjuntos si existen
    if (createMessageDto.files && createMessageDto.files.length > 0) {
      for (const fileUrl of createMessageDto.files) {
        await this.dataSource.query(
          `INSERT INTO maintenance_attachments(
            message_id, file_url, file_name, file_type, file_size, uploaded_by
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            savedMessage.id,
            fileUrl,
            fileUrl.split('/').pop() || 'unknown',
            this.getFileType(fileUrl),
            0,
            userId,
          ],
        );
      }
    }

    // Retornar mensaje con sus attachments
    const messages = await this.dataSource.query(
      `SELECT
        mm.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ma.id,
              'file_url', ma.file_url,
              'file_name', ma.file_name,
              'file_type', ma.file_type,
              'created_at', ma.created_at
            )
          ) FILTER (WHERE ma.id IS NOT NULL),
          '[]'
        ) as attachments
      FROM maintenance_messages mm
      LEFT JOIN maintenance_attachments ma ON ma.message_id = mm.id
      WHERE mm.id = $1
      GROUP BY mm.id`,
      [savedMessage.id],
    );

    if (!messages || messages.length === 0) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    return messages[0];
  }

  /**
   * Obtiene los mensajes de una solicitud
   */
  async getMessages(requestId: number, userId?: number): Promise<any[]> {
    const messages = await this.dataSource.query(
      `SELECT
        mm.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ma.id,
              'file_url', ma.file_url,
              'file_name', ma.file_name,
              'file_type', ma.file_type,
              'created_at', ma.created_at
            )
          ) FILTER (WHERE ma.id IS NOT NULL),
          '[]'
        ) as attachments
      FROM maintenance_messages mm
      LEFT JOIN maintenance_attachments ma ON ma.message_id = mm.id
      WHERE mm.maintenance_request_id = $1
      GROUP BY mm.id
      ORDER BY mm.created_at ASC`,
      [requestId],
    );

    // Si se proporciona userId y es un inquilino, filtrar mensajes no enviados al residente
    const request = await this.findOne(requestId);
    if (userId && request.tenant_id === userId) {
      return messages.filter((msg) => msg.send_to_resident);
    }

    return messages;
  }

  /**
   * Obtiene estadísticas para el dashboard del admin
   */
  async getAdminStats(): Promise<any> {
    const [totalResult, byStatusResult, byPriorityResult, newResult, urgentResult] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) as count FROM maintenance_requests`),
      this.dataSource.query(
        `SELECT status, COUNT(*) as count FROM maintenance_requests GROUP BY status`,
      ),
      this.dataSource.query(
        `SELECT priority, COUNT(*) as count FROM maintenance_requests GROUP BY priority`,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) as count FROM maintenance_requests WHERE status = 'NEW'`,
      ),
      this.dataSource.query(
        `SELECT COUNT(*) as count FROM maintenance_requests WHERE priority = 'HIGH' AND status = 'IN_PROGRESS'`,
      ),
    ]);

    const total = parseInt(totalResult[0].count);
    const newRequests = parseInt(newResult[0].count);
    const urgentRequests = parseInt(urgentResult[0].count);

    const byStatus = byStatusResult.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {} as any);

    const byPriority = byPriorityResult.reduce((acc, item) => {
      acc[item.priority] = parseInt(item.count);
      return acc;
    }, {} as any);

    return {
      total,
      byStatus,
      byPriority,
      newRequests,
      urgentRequests,
    };
  }

  /**
   * Obtiene estadísticas para el dashboard del inquilino
   */
  async getTenantStats(tenantId: number): Promise<any> {
    const [totalResult, activeResult, completedResult] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(*) as count FROM maintenance_requests WHERE tenant_id = $1`,
        [tenantId],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) as count FROM maintenance_requests WHERE tenant_id = $1 AND status = 'IN_PROGRESS'`,
        [tenantId],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) as count FROM maintenance_requests WHERE tenant_id = $1 AND status = 'COMPLETED'`,
        [tenantId],
      ),
    ]);

    return {
      total: parseInt(totalResult[0].count),
      active: parseInt(activeResult[0].count),
      completed: parseInt(completedResult[0].count),
    };
  }

  /**
   * Helper para obtener el tipo de archivo
   */
  private getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const pdfExts = ['pdf'];

    if (imageExts.includes(ext)) return 'image';
    if (pdfExts.includes(ext)) return 'pdf';
    return 'unknown';
  }
}
