import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from '@common/health.controller';
import { Report } from './entities/report.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportView } from './views/report.view';

@Module({
  imports: [TypeOrmModule.forFeature([Report, ReportView])],
  controllers: [ReportController, HealthController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
