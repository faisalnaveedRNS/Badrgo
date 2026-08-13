import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserPayload } from '@models';
import { RedisService } from './redis.service';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimit {
  limit: number;
  windowSeconds: number;
}

/**
 * Fixed window rate limit, counted in Redis so every gateway replica shares
 * one budget. Keyed by user id when authenticated, by IP otherwise.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<RateLimit>(RATE_LIMIT_KEY, [context.getHandler(), context.getClass()]) || {
      limit: +(process.env.RATE_LIMIT || 100),
      windowSeconds: +(process.env.RATE_LIMIT_WINDOW || 60),
    };

    const request: Request & { user?: UserPayload } = context.switchToHttp().getRequest();
    const identity = request.user?.id || request.ip;
    const count = await this.redis.increment(`ratelimit:${identity}:${request.method}:${request.path}`, config.windowSeconds);

    if (count > config.limit) throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    return true;
  }
}
