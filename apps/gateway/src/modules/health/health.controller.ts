import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * The gateway owns no database, so its probe is process-level only. Each
 * service reports its own readiness on its own /health/ready.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok', service: 'gateway', uptime: Math.round(process.uptime()) };
  }
}
