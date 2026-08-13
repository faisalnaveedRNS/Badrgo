import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { LoggerService } from '@utils/logger/logger.service';

/**
 * Redis is used for three things (and nothing that must survive a restart):
 * response cache, rate limit counters, and fast lookups of hot rows.
 */
@Injectable()
export class RedisService implements OnApplicationShutdown {
  private readonly client: Redis;

  constructor(private readonly logger: LoggerService) {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: +(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      keyPrefix: process.env.REDIS_PREFIX || 'badrgo:',
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });

    this.client.on('error', (error) => this.logger.error(error));
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds = +(process.env.REDIS_TTL || 60)): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await this.client.del(...keys);
  }

  /**
   * Increments a counter and returns its value, setting the window TTL on the
   * first hit. Backs the rate limit guard.
   */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, ttlSeconds);
    return count;
  }

  /**
   * Reads through the cache: returns the cached value or computes, stores and
   * returns a fresh one.
   */
  async remember<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}
