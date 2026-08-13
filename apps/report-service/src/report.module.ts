import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClickhouseModule } from '@analytics/clickhouse.module';
import { CommonModule } from '@common/common.module';
import { AppConfig } from '@utils/config';
import { LoggerModule } from '@utils/logger/logger.module';
import { Report } from './modules/report/entities/report.entity';
import { ReportModule } from './modules/report/report.module';
import { ReportView } from './modules/report/views/report.view';

/**
 * Postgres holds the reports themselves. The event-derived read model lives in
 * ClickHouse, which subscribes to Kafka directly — this service has no consumer.
 */
export const entities = [Report, ReportView];

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: [AppConfig.envConfiguration()], isGlobal: true }),
    TypeOrmModule.forRoot(AppConfig.typeorm(process.env.REPORT_DB_DATABASE || 'badrgo_report', entities)),
    LoggerModule,
    CommonModule,
    ClickhouseModule,
    ReportModule,
  ],
})
export class ReportServiceModule {}
