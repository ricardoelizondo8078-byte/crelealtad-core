import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
        console.error('\n');
        console.error('========================================');
        console.error('❌ VALIDACIÓN FALLIDA - HTTP 400');
        console.error('========================================');
        console.error('');
        console.error('PROPIEDADES RECHAZADAS:');
        errors.forEach((error, index) => {
          console.error(`\n[${index + 1}] Campo: "${error.property}"`);
          console.error(`    Valor: ${JSON.stringify(error.value)}`);
          console.error(`    Tipo recibido: ${typeof error.value}`);
          console.error(`    Constraints:`);
          if (error.constraints) {
            Object.entries(error.constraints).forEach(([key, msg]) => {
              console.error(`      - ${key}: ${msg}`);
            });
          }
        });
        console.error('\n========================================\n');

        const messages = errors.map((error) => {
          return Object.values(error.constraints || {}).join(', ');
        });

        return {
          statusCode: 400,
          message: messages,
          error: 'Bad Request',
          validationErrors: errors,
        };
      },
    }),
  );

  // Configurar CORS con orígenes permitidos
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8081', 'http://192.168.1.*'];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (mobile apps, Postman)
      if (!origin) return callback(null, true);

      // Verificar si el origin está en la lista de permitidos
      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed.includes('*')) {
          const pattern = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
          return pattern.test(origin);
        }
        return allowed === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3100;

  // Escuchar en todas las interfaces de red para permitir conexiones desde dispositivos móviles
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API iniciada en el puerto ${port} (todas las interfaces)`);
}

bootstrap();