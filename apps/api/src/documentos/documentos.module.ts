import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoEntity } from './documento.entity';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { IntegrantesModule } from '../integrantes/integrantes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentoEntity]),
    forwardRef(() => IntegrantesModule),
  ],
  controllers: [DocumentosController],
  providers: [DocumentosService],
  exports: [DocumentosService],
})
export class DocumentosModule {}