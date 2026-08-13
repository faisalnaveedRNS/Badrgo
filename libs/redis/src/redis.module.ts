import { Global, Module } from '@nestjs/common';
import { LoggerModule } from '@utils/logger/logger.module';
import { RateLimitGuard } from './rate-limit.guard';
import { RedisService } from './redis.service';

/** Cache, rate limit counters and fast lookups, available app-wide. */
@Global()
@Module({
  imports: [LoggerModule],
  providers: [RedisService, RateLimitGuard],
  exports: [RedisService, RateLimitGuard],
})
export class RedisModule {}
