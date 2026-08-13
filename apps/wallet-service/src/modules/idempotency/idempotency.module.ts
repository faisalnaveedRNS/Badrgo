import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';

/** No TypeORM feature here: the claim store is Redis (see `RedisModule`). */
@Module({
  providers: [IdempotencyService],
  exports: [IdempotencyService],
})
export class IdempotencyModule {}
