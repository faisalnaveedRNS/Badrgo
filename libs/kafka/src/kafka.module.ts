import { Global, Module } from '@nestjs/common';
import { LoggerModule } from '@utils/logger/logger.module';
import { KafkaProducerService } from './kafka.producer';

/** Provides the Kafka producer to any service that drains an outbox. */
@Global()
@Module({
  imports: [LoggerModule],
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
