import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();
    this.logger.logRequest(req);
    res.once('finish', () => {
      this.logger.logResponse(req, res, Date.now() - startedAt);
    });
    next();
  }
}
