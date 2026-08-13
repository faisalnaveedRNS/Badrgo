import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@common/common.module';
import { AppConfig } from '@utils/config';
import { LoggerModule } from '@utils/logger/logger.module';
import { Report } from './modules/report/entities/report.entity';
import { WalletProjection } from './modules/report/entities/wallet-projection.entity';
import { ReportModule } from './modules/report/report.module';

/** Tables owned by the report service: its own read models, nothing shared. */
export const entities = [Report, WalletProjection];

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: [AppConfig.envConfiguration()], isGlobal: true }),
    TypeOrmModule.forRoot(AppConfig.typeorm(process.env.REPORT_DB_DATABASE || 'badrgo_report', entities)),
    LoggerModule,
    CommonModule,
    ReportModule,
  ],
})
export class ReportServiceModule {}
