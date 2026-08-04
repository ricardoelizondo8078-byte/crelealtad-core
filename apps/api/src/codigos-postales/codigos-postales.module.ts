import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodigosPostalesController } from './codigos-postales.controller';
import { CodigosPostalesService } from './codigos-postales.service';
import { CodigoPostalEntity } from './codigo-postal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CodigoPostalEntity])],
  controllers: [CodigosPostalesController],
  providers: [CodigosPostalesService],
  exports: [CodigosPostalesService],
})
export class CodigosPostalesModule {}
