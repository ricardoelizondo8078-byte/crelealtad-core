import { NestFactory } from '@nestjs/core';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import helmet from 'helmet';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

const bootstrapLogger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();

  // Los expedientes y solicitudes cambian durante la operación. Evitar ETag/304
  // impide que el dispositivo reutilice respuestas anteriores con datos obsoletos.
  expressApp.disable('etag');
  app.use((_request: Request, response: Response, next: NextFunction) => {
    response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');
    next();
  });

  // Habilitar Helmet para security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
      transform: true, // Transforma payloads a instancias de DTO
      transformOptions: {
        enableImplicitConversion: true, // Convierte tipos automáticamente
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          return Object.values(error.constraints || {}).join(', ');
        });
        bootstrapLogger.warn(`Validación rechazada en campos: ${errors.map((error) => error.property).join(', ')}`);
        return new BadRequestException({
          statusCode: 400,
          message: messages,
          error: 'Bad Request',
          validationErrors: errors.map((error) => ({
            property: error.property,
            constraints: error.constraints || {},
          })),
        });
      },
    }),
  );

  // React Native nativo no envía Origin. En desarrollo, permitir también
  // cualquier origen web local evita acoplar CORS a una subred específica.
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || !isProduction || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  };
  app.enableCors(corsOptions);

  const port = process.env.PORT || 3100;

  // Escuchar en todas las interfaces de red para permitir conexiones desde dispositivos móviles
  await app.listen(port, '0.0.0.0');

  bootstrapLogger.log(`API iniciada en el puerto ${port}`);
}

bootstrap();
