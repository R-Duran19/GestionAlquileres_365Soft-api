import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface DatabaseInfo {
  connected: boolean;
  database?: string;
  host?: string;
  port?: number;
  version?: string;
  error?: string;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  database: DatabaseInfo | null;
}

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const dbConnected = this.dataSource.isInitialized;

    let dbInfo: DatabaseInfo | null = null;
    if (dbConnected) {
      try {
        const result = await this.dataSource.query('SELECT version()');
        dbInfo = {
          connected: true,
          database: this.dataSource.options.database as string,
          host: (this.dataSource.options as any).host,
          port: (this.dataSource.options as any).port,
          version: result[0].version,
        };
      } catch (error: any) {
        dbInfo = {
          connected: false,
          error: error.message,
        };
      }
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbInfo,
    };
  }
}
