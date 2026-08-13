import { Injectable } from '@nestjs/common';
import { RedisService } from '@cache/redis.service';

/** How long a key stays reserved. A retry after this window is a new transaction. */
const TTL_SECONDS = +(process.env.IDEMPOTENCY_TTL || 86400);

/**
 * Idempotency keys live in Redis, not Postgres.
 *
 * Every money movement carries a key. The first request to present it wins the
 * `SET NX` and owns the transaction; anyone presenting the same key again is
 * rejected outright — the operation is not replayed, because the caller already
 * has (or can read) the transaction the first request produced.
 *
 * Redis is the right store here: the claim is short-lived, checked on the hot
 * path, and must not cost a write to the ledger database.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly redis: RedisService) {}

  private static redisKey(scope: string, key: string): string {
    return `idempotency:${scope}:${key}`;
  }

  /**
   * Reserves the key for this request. `false` means it was already taken and
   * the caller must reject the transaction.
   */
  async claim(key: string, scope: string): Promise<boolean> {
    return this.redis.setIfAbsent(IdempotencyService.redisKey(scope, key), { claimedAt: new Date().toISOString() }, TTL_SECONDS);
  }

  /**
   * Releases a claim whose operation never completed.
   *
   * A failed transaction did not move money, so holding its key would block a
   * legitimate retry. Only successful operations keep the reservation.
   */
  async release(key: string, scope: string): Promise<void> {
    await this.redis.del(IdempotencyService.redisKey(scope, key));
  }

  async isClaimed(key: string, scope: string): Promise<boolean> {
    return this.redis.exists(IdempotencyService.redisKey(scope, key));
  }
}
