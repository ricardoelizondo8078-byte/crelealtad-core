import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  AccessScope,
  assertIntegranteAccess,
} from '../common/access-scope';
import { registrarAuditoria } from '../common/audit-log';
import { ExpedienteEstado } from '../expedientes/expediente.entity';
import { IntegranteEntity, IntegranteEstado } from '../integrantes/integrante.entity';
import { RegistrarVisitaVecinoDto } from './dto/registrar-visita-vecino.dto';
import { RegistrarFachadaVisitaVecinoDto } from './dto/registrar-fachada-visita-vecino.dto';
import { RegistrarEvidenciaVisitaVecinoDto } from './dto/registrar-evidencia-visita-vecino.dto';
import { VerificacionVisitaVecinoEvidenciaEntity } from './verificacion-visita-vecino-evidencia.entity';
import { VerificacionVisitaVecinoFachadaEntity } from './verificacion-visita-vecino-fachada.entity';
import { VerificacionVisitaVecinoEntity } from './verificacion-visita-vecino.entity';
import {
  ArchivoFachadaRecibido,
  VisitaVecinoFachadaStorageService,
} from './visita-vecino-fachada-storage.service';

interface PostgresError {
  code?: string;
}

export interface ResumenVisitaVecino {
  resultado: {
    conoce_y_sabe_donde_vive: boolean;
    visita_id: string;
    fachada_id: string | null;
    registrada_at: Date;
  } | null;
}

export interface ResumenEvidenciaVisitaVecino {
  evidencia: {
    id: string;
    visita_id: string;
    archivo_url: string;
    mime_type: 'image/jpeg' | 'image/png';
    foto_capturada_at: Date;
    registrada_at: Date;
  } | null;
}

export interface ResumenFachadaVisitaVecino {
  fachada: {
    id: string;
    archivo_url: string;
    mime_type: 'image/jpeg' | 'image/png';
    foto_capturada_at: Date;
    registrada_at: Date;
  } | null;
}

const esViolacionUnica = (error: unknown): error is PostgresError => (
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && (error as PostgresError).code === '23505'
);

const redondear = (valor: number, decimales: number): number => (
  Number(valor.toFixed(decimales))
);

@Injectable()
export class VerificacionVisitasVecinoService {
  constructor(
    @InjectRepository(VerificacionVisitaVecinoEntity)
    private readonly visitaRepository: Repository<VerificacionVisitaVecinoEntity>,
    @InjectRepository(VerificacionVisitaVecinoFachadaEntity)
    private readonly fachadaRepository: Repository<VerificacionVisitaVecinoFachadaEntity>,
    @InjectRepository(VerificacionVisitaVecinoEvidenciaEntity)
    private readonly evidenciaRepository: Repository<VerificacionVisitaVecinoEvidenciaEntity>,
    @InjectRepository(IntegranteEntity)
    private readonly integranteRepository: Repository<IntegranteEntity>,
    private readonly dataSource: DataSource,
    private readonly fachadaStorage: VisitaVecinoFachadaStorageService,
  ) {}

  async obtenerResumen(
    integranteId: string,
    scope: AccessScope,
  ): Promise<ResumenVisitaVecino> {
    await this.obtenerIntegrante(integranteId, scope);
    return this.obtenerResumenGuardado(integranteId);
  }

  async obtenerResumenFachada(
    integranteId: string,
    scope: AccessScope,
  ): Promise<ResumenFachadaVisitaVecino> {
    await this.obtenerIntegrante(integranteId, scope);
    return this.obtenerResumenFachadaGuardada(integranteId);
  }

  async registrarFachada(
    integranteId: string,
    scope: AccessScope,
    input: RegistrarFachadaVisitaVecinoDto,
    foto: ArchivoFachadaRecibido | undefined,
  ): Promise<{
    fachada: ResumenFachadaVisitaVecino['fachada'];
  }> {
    const integrante = await this.obtenerIntegrante(integranteId, scope);
    this.validarIntegranteParaRegistro(integrante);
    if (!foto) {
      throw new BadRequestException('La fotografía de fachada es obligatoria');
    }

    const archivo = await this.fachadaStorage.guardar(integranteId, foto);
    let fachada: VerificacionVisitaVecinoFachadaEntity;

    try {
      fachada = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(VerificacionVisitaVecinoFachadaEntity);
        const guardada = await repository.save(repository.create({
          id: archivo.id,
          integrante_id: integranteId,
          ruta: archivo.ruta,
          mime_type: archivo.mime_type,
          tamano_bytes: archivo.tamano_bytes,
          sha256: archivo.sha256,
          captura_fuente: 'CAMARA',
          foto_capturada_at: new Date(input.foto_capturada_at),
          idempotency_key: input.idempotency_key,
          registrada_por: scope.usuarioId,
          ubicacion_latitud: redondear(input.ubicacion_latitud, 7),
          ubicacion_longitud: redondear(input.ubicacion_longitud, 7),
          ubicacion_precision_metros: input.ubicacion_precision_metros == null
            ? null
            : redondear(input.ubicacion_precision_metros, 2),
          ubicacion_capturada_at: new Date(input.ubicacion_capturada_at),
          ubicacion_fuente: 'DISPOSITIVO',
        }));

        await registrarAuditoria(manager, {
          tabla: 'verificacion_visita_vecino_fachadas',
          registroId: guardada.id,
          accion: 'FACHADA_VECINO',
          usuarioId: scope.usuarioId,
          datosDespues: {
            integrante_id: integranteId,
            captura_fuente: guardada.captura_fuente,
            ubicacion_fuente: guardada.ubicacion_fuente,
            mime_type: guardada.mime_type,
            tamano_bytes: guardada.tamano_bytes,
          },
        });

        return guardada;
      });
    } catch (error) {
      await this.fachadaStorage.descartar(integranteId, archivo.id);

      if (!esViolacionUnica(error)) {
        throw error;
      }

      const existente = await this.fachadaRepository.findOne({
        where: {
          registrada_por: scope.usuarioId,
          idempotency_key: input.idempotency_key,
        },
      });

      if (
        !existente
        || existente.integrante_id !== integranteId
        || existente.sha256 !== archivo.sha256
      ) {
        throw new ConflictException('La clave de la fotografía ya fue utilizada con otros datos');
      }

      fachada = existente;
    }

    return {
      fachada: this.presentarFachada(fachada),
    };
  }

  async obtenerArchivoFachada(
    integranteId: string,
    fachadaId: string,
    scope: AccessScope,
  ): Promise<{ contenido: Buffer; mimeType: string }> {
    await this.obtenerIntegrante(integranteId, scope);
    const fachada = await this.fachadaRepository.findOne({
      where: { id: fachadaId, integrante_id: integranteId },
    });
    if (!fachada) {
      throw new NotFoundException('Fotografía de fachada no encontrada');
    }

    return {
      contenido: await this.fachadaStorage.leer(
        integranteId,
        fachadaId,
        fachada.mime_type,
      ),
      mimeType: fachada.mime_type,
    };
  }

  async obtenerResumenEvidencia(
    integranteId: string,
    visitaId: string,
    scope: AccessScope,
  ): Promise<ResumenEvidenciaVisitaVecino> {
    await this.obtenerIntegrante(integranteId, scope);
    await this.obtenerVisita(integranteId, visitaId);
    return this.obtenerResumenEvidenciaGuardada(visitaId);
  }

  async registrarEvidencia(
    integranteId: string,
    visitaId: string,
    scope: AccessScope,
    input: RegistrarEvidenciaVisitaVecinoDto,
    foto: ArchivoFachadaRecibido | undefined,
  ): Promise<{ evidencia: ResumenEvidenciaVisitaVecino['evidencia'] }> {
    const integrante = await this.obtenerIntegrante(integranteId, scope);
    this.validarIntegranteParaRegistro(integrante);
    await this.obtenerVisita(integranteId, visitaId, true);
    if (!foto) {
      throw new BadRequestException('La fotografía de evidencia es obligatoria');
    }

    const archivo = await this.fachadaStorage.guardarEvidencia(
      integranteId,
      visitaId,
      foto,
    );
    let evidencia: VerificacionVisitaVecinoEvidenciaEntity;

    try {
      evidencia = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(VerificacionVisitaVecinoEvidenciaEntity);
        const guardada = await repository.save(repository.create({
          id: archivo.id,
          visita_id: visitaId,
          ruta: archivo.ruta,
          mime_type: archivo.mime_type,
          tamano_bytes: archivo.tamano_bytes,
          sha256: archivo.sha256,
          captura_fuente: 'CAMARA',
          foto_capturada_at: new Date(input.foto_capturada_at),
          idempotency_key: input.idempotency_key,
          registrada_por: scope.usuarioId,
          ubicacion_latitud: redondear(input.ubicacion_latitud, 7),
          ubicacion_longitud: redondear(input.ubicacion_longitud, 7),
          ubicacion_precision_metros: input.ubicacion_precision_metros == null
            ? null
            : redondear(input.ubicacion_precision_metros, 2),
          ubicacion_capturada_at: new Date(input.ubicacion_capturada_at),
          ubicacion_fuente: 'DISPOSITIVO',
        }));

        await registrarAuditoria(manager, {
          tabla: 'verificacion_visita_vecino_evidencias',
          registroId: guardada.id,
          accion: 'EVIDENCIA_VECINO',
          usuarioId: scope.usuarioId,
          datosDespues: {
            visita_id: visitaId,
            captura_fuente: guardada.captura_fuente,
            ubicacion_fuente: guardada.ubicacion_fuente,
            mime_type: guardada.mime_type,
            tamano_bytes: guardada.tamano_bytes,
          },
        });

        return guardada;
      });
    } catch (error) {
      await this.fachadaStorage.descartarEvidencia(integranteId, visitaId, archivo.id);

      if (!esViolacionUnica(error)) {
        throw error;
      }

      const existente = await this.evidenciaRepository.findOne({
        where: {
          registrada_por: scope.usuarioId,
          idempotency_key: input.idempotency_key,
        },
      });
      if (
        !existente
        || existente.visita_id !== visitaId
        || existente.sha256 !== archivo.sha256
      ) {
        throw new ConflictException('La clave de la evidencia ya fue utilizada con otros datos');
      }
      evidencia = existente;
    }

    return { evidencia: this.presentarEvidencia(evidencia) };
  }

  async obtenerArchivoEvidencia(
    integranteId: string,
    visitaId: string,
    evidenciaId: string,
    scope: AccessScope,
  ): Promise<{ contenido: Buffer; mimeType: string }> {
    await this.obtenerIntegrante(integranteId, scope);
    await this.obtenerVisita(integranteId, visitaId);
    const evidencia = await this.evidenciaRepository.findOne({
      where: { id: evidenciaId, visita_id: visitaId },
    });
    if (!evidencia) {
      throw new NotFoundException('Fotografía de evidencia no encontrada');
    }

    return {
      contenido: await this.fachadaStorage.leerEvidencia(
        integranteId,
        visitaId,
        evidenciaId,
        evidencia.mime_type,
      ),
      mimeType: evidencia.mime_type,
    };
  }

  async registrar(
    integranteId: string,
    scope: AccessScope,
    input: RegistrarVisitaVecinoDto,
  ): Promise<{
    visita: Pick<
      VerificacionVisitaVecinoEntity,
      'id' | 'conoce_y_sabe_donde_vive' | 'created_at'
    >;
    resumen: ResumenVisitaVecino;
  }> {
    const integrante = await this.obtenerIntegrante(integranteId, scope);
    this.validarIntegranteParaRegistro(integrante);

    const fachadaActual = await this.fachadaRepository.findOne({
      where: { integrante_id: integranteId },
      order: { created_at: 'DESC', id: 'DESC' },
    });
    if (!fachadaActual || fachadaActual.id !== input.fachada_id) {
      throw new BadRequestException(
        'Primero captura y guarda la fotografía actual de la fachada',
      );
    }

    let visita: VerificacionVisitaVecinoEntity;

    try {
      visita = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(VerificacionVisitaVecinoEntity);
        const guardada = await repository.save(repository.create({
          integrante_id: integranteId,
          conoce_y_sabe_donde_vive: input.conoce_y_sabe_donde_vive,
          fachada_id: fachadaActual.id,
          idempotency_key: input.idempotency_key,
          registrada_por: scope.usuarioId,
          ubicacion_latitud: redondear(input.ubicacion_latitud, 7),
          ubicacion_longitud: redondear(input.ubicacion_longitud, 7),
          ubicacion_precision_metros: input.ubicacion_precision_metros == null
            ? null
            : redondear(input.ubicacion_precision_metros, 2),
          ubicacion_capturada_at: new Date(input.ubicacion_capturada_at),
          ubicacion_fuente: 'DISPOSITIVO',
        }));

        await registrarAuditoria(manager, {
          tabla: 'verificacion_visitas_vecino',
          registroId: guardada.id,
          accion: 'VISITA_VECINO',
          usuarioId: scope.usuarioId,
          datosDespues: {
            integrante_id: integranteId,
            conoce_y_sabe_donde_vive: guardada.conoce_y_sabe_donde_vive,
            fachada_id: guardada.fachada_id,
            ubicacion_fuente: guardada.ubicacion_fuente,
          },
        });

        return guardada;
      });
    } catch (error) {
      if (!esViolacionUnica(error)) {
        throw error;
      }

      const existente = await this.visitaRepository.findOne({
        where: {
          registrada_por: scope.usuarioId,
          idempotency_key: input.idempotency_key,
        },
      });

      if (
        !existente
        || existente.integrante_id !== integranteId
        || existente.conoce_y_sabe_donde_vive !== input.conoce_y_sabe_donde_vive
        || existente.fachada_id !== input.fachada_id
      ) {
        throw new ConflictException('La clave del intento ya fue utilizada con otros datos');
      }

      visita = existente;
    }

    return {
      visita: {
        id: visita.id,
        conoce_y_sabe_donde_vive: visita.conoce_y_sabe_donde_vive,
        created_at: visita.created_at,
      },
      resumen: await this.obtenerResumenGuardado(integranteId),
    };
  }

  private async obtenerIntegrante(
    integranteId: string,
    scope: AccessScope,
  ): Promise<IntegranteEntity> {
    await assertIntegranteAccess(
      this.integranteRepository.manager,
      integranteId,
      scope,
    );

    const integrante = await this.integranteRepository.findOne({
      where: { id: integranteId },
      relations: { expediente: true },
    });

    if (!integrante) {
      throw new NotFoundException('Integrante no encontrada');
    }

    return integrante;
  }

  private validarIntegranteParaRegistro(integrante: IntegranteEntity): void {
    if (
      integrante.estado !== IntegranteEstado.SUJETA_CREDITO
      && integrante.estado !== IntegranteEstado.EN_VERIFICACION
    ) {
      throw new BadRequestException('La integrante no está lista para registrar una visita al vecino');
    }

    if (integrante.expediente?.estado !== ExpedienteEstado.EN_VERIFICACION) {
      throw new BadRequestException('El expediente no está en verificación');
    }
  }

  private async obtenerResumenGuardado(
    integranteId: string,
  ): Promise<ResumenVisitaVecino> {
    const visita = await this.visitaRepository.findOne({
      where: { integrante_id: integranteId },
      order: { created_at: 'DESC', id: 'DESC' },
    });

    return {
      resultado: visita
        ? {
            conoce_y_sabe_donde_vive: visita.conoce_y_sabe_donde_vive,
            visita_id: visita.id,
            fachada_id: visita.fachada_id,
            registrada_at: visita.created_at,
          }
        : null,
    };
  }

  private async obtenerResumenFachadaGuardada(
    integranteId: string,
  ): Promise<ResumenFachadaVisitaVecino> {
    const fachada = await this.fachadaRepository.findOne({
      where: { integrante_id: integranteId },
      order: { created_at: 'DESC', id: 'DESC' },
    });

    return { fachada: fachada ? this.presentarFachada(fachada) : null };
  }

  private async obtenerVisita(
    integranteId: string,
    visitaId: string,
    exigirActual = false,
  ): Promise<VerificacionVisitaVecinoEntity> {
    const visita = await this.visitaRepository.findOne({
      where: { id: visitaId, integrante_id: integranteId },
    });
    if (!visita) {
      throw new NotFoundException('Respuesta de visita al vecino no encontrada');
    }

    if (exigirActual) {
      const actual = await this.visitaRepository.findOne({
        where: { integrante_id: integranteId },
        order: { created_at: 'DESC', id: 'DESC' },
      });
      if (!actual || actual.id !== visitaId) {
        throw new BadRequestException(
          'La evidencia debe corresponder a la respuesta más reciente del vecino',
        );
      }
    }

    return visita;
  }

  private async obtenerResumenEvidenciaGuardada(
    visitaId: string,
  ): Promise<ResumenEvidenciaVisitaVecino> {
    const evidencia = await this.evidenciaRepository.findOne({
      where: { visita_id: visitaId },
      order: { created_at: 'DESC', id: 'DESC' },
    });
    return { evidencia: evidencia ? this.presentarEvidencia(evidencia) : null };
  }

  private presentarFachada(
    fachada: VerificacionVisitaVecinoFachadaEntity,
  ): NonNullable<ResumenFachadaVisitaVecino['fachada']> {
    return {
      id: fachada.id,
      archivo_url: fachada.ruta,
      mime_type: fachada.mime_type,
      foto_capturada_at: fachada.foto_capturada_at,
      registrada_at: fachada.created_at,
    };
  }

  private presentarEvidencia(
    evidencia: VerificacionVisitaVecinoEvidenciaEntity,
  ): NonNullable<ResumenEvidenciaVisitaVecino['evidencia']> {
    return {
      id: evidencia.id,
      visita_id: evidencia.visita_id,
      archivo_url: evidencia.ruta,
      mime_type: evidencia.mime_type,
      foto_capturada_at: evidencia.foto_capturada_at,
      registrada_at: evidencia.created_at,
    };
  }
}
