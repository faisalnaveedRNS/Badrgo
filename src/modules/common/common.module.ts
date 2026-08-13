import { Global, Module } from '@nestjs/common';
import { LoggerModule } from '@utils/logger/logger.module';

/**
 * Cross-cutting providers every feature module can rely on.
 */
@Global()
@Module({
  imports: [LoggerModule],
  exports: [LoggerModule],
})
export class CommonModule {}
