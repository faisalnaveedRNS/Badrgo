import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_KEY } from './rate-limit.guard';

/** Overrides the default budget for one controller or handler. */
export const Throttle = (limit: number, windowSeconds = 60) => SetMetadata(RATE_LIMIT_KEY, { limit, windowSeconds });
