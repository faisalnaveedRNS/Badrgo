import { Global, Module } from '@nestjs/common';
import { LoggerModule } from '@utils/logger/logger.module';
import { ClickhouseService } from './clickhouse.service';

/** Analytics store, fed directly by Kafka. Query-only from the application. */
@Global()
@Module({
  imports: [LoggerModule],
  providers: [ClickhouseService],
  exports: [ClickhouseService],
})
export class ClickhouseModule {}
