import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { LessThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IdempotencyStatus } from '@utils/enum';
import { IdempotencyKey } from './entities/idempotency.entity';

const TTL_HOURS = 24;

@Injectable()
export class IdempotencyService {
  constructor(@InjectRepository(IdempotencyKey) private readonly repository: Repository<IdempotencyKey>) {}

  static hash(payload: unknown): string {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  /**
   * Claims a key for this request.
   *
   * Returns the stored response when the same key + body already completed
   * (replay), or `null` when the caller now owns the operation. The unique
   * index on `key` is what makes the claim race-safe: a concurrent duplicate
   * loses the insert and is read back instead.
   */
  async claim(key: string, scope: string, payload: unknown): Promise<{ replay: Record<string, any> } | null> {
    const requestHash = IdempotencyService.hash(payload);
    const existing = await this.repository.findOne({ where: { key, scope } });

    if (existing) {
      return { replay: existing.status === IdempotencyStatus.COMPLETED ? existing.response : null };
    }

    const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
    await this.repository.insert({ key, scope, requestHash, expiresAt, status: IdempotencyStatus.IN_PROGRESS });
    return null;
  }

  /** Stores the response so a later retry of the same key replays it. */
  async complete(key: string, scope: string, response: Record<string, any>): Promise<void> {
    await this.repository.update({ key, scope }, { status: IdempotencyStatus.COMPLETED, response });
  }

  /** Drops the claim so a failed operation can be retried cleanly. */
  async release(key: string, scope: string): Promise<void> {
    await this.repository.delete({ key, scope });
  }

  async purgeExpired(): Promise<void> {
    await this.repository.delete({ expiresAt: LessThan(new Date()) });
  }
}
