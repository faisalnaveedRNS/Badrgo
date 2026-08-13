import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Liveness + readiness for every app. Readiness is "can I reach my database",
 * which is what an orchestrator needs to know before routing traffic.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok', service: process.env.SERVICE_NAME || 'badrgo', uptime: Math.round(process.uptime()) };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — verifies the database connection' })
  async ready() {
    const database = this.dataSource.isInitialized
      ? await this.dataSource
          .query('SELECT 1')
          .then(() => 'up')
          .catch(() => 'down')
      : 'down';
    return { status: database === 'up' ? 'ok' : 'degraded', database };
  }
}
