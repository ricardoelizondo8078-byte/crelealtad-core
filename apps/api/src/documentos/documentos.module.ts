import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoEntity } from './documento.entity';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { SolicitantesModule } from '../solicitantes/solicitantes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentoEntity]),
    forwardRef(() => SolicitantesModule),
  ],
  controllers: [DocumentosController],
  providers: [DocumentosService],
  exports: [DocumentosService],
})
export class DocumentosModule {}