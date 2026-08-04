import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const nodeEnv = process.env.NODE_ENV || 'development';

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'crelealtad-api',
        environment: nodeEnv,
      },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...metadata }) => {
              let msg = `${timestamp} [${level}]: ${message}`;
              if (Object.keys(metadata).length > 0) {
                msg += ` ${JSON.stringify(metadata)}`;
              }
              return msg;
            }),
          ),
        }),
      ],
    });

    // Add file transport in production
    if (nodeEnv === 'production') {
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );

      this.logger.add(
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      );
    }
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom methods for structured logging
  logRequest(req: any) {
    this.logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  logResponse(req: any, res: any, responseTime: number) {
    this.logger.info('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });
  }

  logError(error: Error, context?: string) {
    this.logger.error(error.message, {
      context,
      stack: error.stack,
      name: error.name,
    });
  }
}
