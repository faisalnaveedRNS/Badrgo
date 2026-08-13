import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { LoggerService } from './logger.service';

/**
 * Logs every request/response pair and stamps a correlation id so a single
 * call can be traced across the log stream.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly loggerService: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const startTime = Date.now();
    const correlationId = req.headers['x-correlation-id'] || randomUUID();
    res.setHeader('X-Correlation-ID', correlationId);

    this.loggerService.log(`Request: ${correlationId} ${method} ${originalUrl}`);

    res.on('finish', () => {
      this.loggerService.log(`Response: ${correlationId} ${method} ${originalUrl} - ${res.statusCode} - ${Date.now() - startTime}ms`);
    });

    next();
  }
}
