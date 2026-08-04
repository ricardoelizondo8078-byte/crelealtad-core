import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const port = process.env.PORT || 3100;

  // Escuchar en todas las interfaces de red para permitir conexiones desde dispositivos móviles
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API iniciada en el puerto ${port} (todas las interfaces)`);
}

bootstrap();