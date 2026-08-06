import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('\n🌐 ========================================');
    console.log('🌐 INCOMING REQUEST');
    console.log('🌐 ========================================');
    console.log('Método:', req.method);
    console.log('Ruta:', req.url);
    console.log('Params:', JSON.stringify(req.params, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('Headers:', JSON.stringify({
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? '[REDACTED]' : undefined,
    }, null, 2));
    console.log('Body (primeros 5000 chars):');
    console.log(JSON.stringify(req.body, null, 2).substring(0, 5000));
    console.log('🌐 ========================================\n');
    next();
  }
}
