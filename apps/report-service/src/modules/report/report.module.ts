import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from '@common/health.controller';
import { WalletConsumer } from '@report/modules/consumer/wallet.consumer';
import { Report } from './entities/report.entity';
import { WalletProjection } from './entities/wallet-projection.entity';
import { ProjectionService } from './projection.service';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportView } from './views/report.view';

@Module({
  imports: [TypeOrmModule.forFeature([Report, WalletProjection, ReportView])],
  controllers: [ReportController, WalletConsumer, HealthController],
  providers: [ReportService, ProjectionService],
  exports: [ReportService],
})
export class ReportModule {}
