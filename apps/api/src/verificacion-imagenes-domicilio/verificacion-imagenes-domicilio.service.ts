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
import { RegistrarImagenDomicilioDto } from './dto/registrar-imagen-domicilio.dto';
import { RegistrarMedidorLuzRespuestaDto } from './dto/registrar-medidor-luz-respuesta.dto';
import {
  ArchivoImagenDomicilioRecibido,
  ImagenesDomicilioStorageService,
} from './imagenes-domicilio-storage.service';
import {
  TIPOS_IMAGEN_DOMICILIO,
  TipoImagenDomicilio,
  VerificacionImagenDomicilioEntity,
} from './verificacion-imagen-domicilio.entity';
import {
  MotivoSinMedidorLuz,
  VerificacionMedidorLuzRespuestaEntity,
} from './verificacion-medidor-luz-respuesta.entity';

interface PostgresError {
  code?: string;
}

export interface ImagenDomicilioPresentada {
  id: string;
  tipo: TipoImagenDomicilio;
  archivo_url: string;
  mime_type: 'image/jpeg' | 'image/png';
  foto_capturada_at: Date;
  registrada_at: Date;
}

export interface ResumenImagenesDomicilio {
  imagenes: Record<TipoImagenDomicilio, ImagenDomicilioPresentada | null>;
  medidor_luz: {
    respuesta_id: string | null;
    fachada_id: string;
    tiene_medidor: boolean;
    motivo: MotivoSinMedidorLuz | null;
    fuente: 'RESPUESTA' | 'IMAGEN_EXISTENTE';
    registrada_at: Date;
  } | null;
  proceso: {
    puede_terminar: boolean;
  };
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
export class VerificacionImagenesDomicilioService {
  constructor(
    @InjectRepository(VerificacionImagenDomicilioEntity)
    private readonly imagenRepository: Repository<VerificacionImagenDomicilioEntity>,
    @InjectRepository(VerificacionMedidorLuzRespuestaEntity)
    private readonly respuestaMedidorRepository: Repository<VerificacionMedidorLuzRespuestaEntity>,
    @InjectRepository(IntegranteEntity)
    private readonly integranteRepository: Repository<IntegranteEntity>,
    private readonly dataSource: DataSource,
    private readonly storage: ImagenesDomicilioStorageService,
  ) {}

  async obtenerResumen(
    integranteId: string,
    scope: AccessScope,
  ): Promise<ResumenImagenesDomicilio> {
    await this.obtenerIntegrante(integranteId, scope);
    return this.obtenerResumenGuardado(integranteId);
  }

  async registrar(
    integranteId: string,
    scope: AccessScope,
    input: RegistrarImagenDomicilioDto,
    foto: ArchivoImagenDomicilioRecibido | undefined,
  ): Promise<{
    imagen: ImagenDomicilioPresentada;
    resumen: ResumenImagenesDomicilio;
  }> {
    const integrante = await this.obtenerIntegrante(integranteId, scope);
    this.validarIntegranteParaRegistro(integrante);
    if (!foto) {
      throw new BadRequestException('La imagen del domicilio es obligatoria');
    }
    if (input.tipo === 'MEDIDOR_LUZ') {
      await this.validarCapturaMedidorHabilitada(integranteId);
    }

    const archivo = await this.storage.guardar(integranteId, foto);
    let imagen: VerificacionImagenDomicilioEntity;

    try {
      imagen = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(VerificacionImagenDomicilioEntity);
        const guardada = await repository.save(repository.create({
          id: archivo.id,
          integrante_id: integranteId,
          tipo: input.tipo,
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
          tabla: 'verificacion_imagenes_domicilio',
          registroId: guardada.id,
          accion: 'IMAGEN_DOMICILIO',
          usuarioId: scope.usuarioId,
          datosDespues: {
            integrante_id: integranteId,
            tipo: guardada.tipo,
            captura_fuente: guardada.captura_fuente,
            ubicacion_fuente: guardada.ubicacion_fuente,
            mime_type: guardada.mime_type,
            tamano_bytes: guardada.tamano_bytes,
          },
        });

        return guardada;
      });
    } catch (error) {
      await this.storage.descartar(integranteId, archivo.id);

      if (!esViolacionUnica(error)) {
        throw error;
      }

      const existente = await this.imagenRepository.findOne({
        where: {
          registrada_por: scope.usuarioId,
          idempotency_key: input.idempotency_key,
        },
      });
      if (
        !existente
        || existente.integrante_id !== integranteId
        || existente.tipo !== input.tipo
        || existente.sha256 !== archivo.sha256
      ) {
        throw new ConflictException('La clave de la imagen ya fue utilizada con otros datos');
      }
      imagen = existente;
    }

    return {
      imagen: this.presentar(imagen),
      resumen: await this.obtenerResumenGuardado(integranteId),
    };
  }

  async registrarRespuestaMedidor(
    integranteId: string,
    scope: AccessScope,
    input: RegistrarMedidorLuzRespuestaDto,
  ): Promise<{
    respuesta: NonNullable<ResumenImagenesDomicilio['medidor_luz']>;
    resumen: ResumenImagenesDomicilio;
  }> {
    const integrante = await this.obtenerIntegrante(integranteId, scope);
    this.validarIntegranteParaRegistro(integrante);

    const fachadaActual = await this.obtenerFachadaActual(integranteId);
    if (!fachadaActual || fachadaActual.id !== input.fachada_id) {
      throw new BadRequestException(
        'Primero captura y guarda la fotografía actual de la fachada',
      );
    }

    const motivo = input.tiene_medidor ? null : input.motivo ?? null;
    if (!input.tiene_medidor && !motivo) {
      throw new BadRequestException(
        'Selecciona el motivo por el que el domicilio no tiene medidor de luz',
      );
    }
    if (input.tiene_medidor && input.motivo) {
      throw new BadRequestException(
        'No debe registrarse un motivo cuando el domicilio sí tiene medidor de luz',
      );
    }

    let respuesta: VerificacionMedidorLuzRespuestaEntity;
    try {
      respuesta = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(VerificacionMedidorLuzRespuestaEntity);
        const guardada = await repository.save(repository.create({
          integrante_id: integranteId,
          fachada_id: fachadaActual.id,
          tiene_medidor: input.tiene_medidor,
          motivo,
          idempotency_key: input.idempotency_key,
          registrada_por: scope.usuarioId,
        }));

        await registrarAuditoria(manager, {
          tabla: 'verificacion_medidor_luz_respuestas',
          registroId: guardada.id,
          accion: 'RESP_MEDIDOR_LUZ',
          usuarioId: scope.usuarioId,
          datosDespues: {
            integrante_id: integranteId,
            fachada_id: fachadaActual.id,
            tiene_medidor: guardada.tiene_medidor,
            motivo: guardada.motivo,
          },
        });

        return guardada;
      });
    } catch (error) {
      if (!esViolacionUnica(error)) {
        throw error;
      }

      const existente = await this.respuestaMedidorRepository.findOne({
        where: {
          registrada_por: scope.usuarioId,
          idempotency_key: input.idempotency_key,
        },
      });
      if (
        !existente
        || existente.integrante_id !== integranteId
        || existente.fachada_id !== input.fachada_id
        || existente.tiene_medidor !== input.tiene_medidor
        || existente.motivo !== motivo
      ) {
        throw new ConflictException(
          'La clave de la respuesta ya fue utilizada con otros datos',
        );
      }
      respuesta = existente;
    }

    return {
      respuesta: this.presentarRespuestaMedidor(respuesta),
      resumen: await this.obtenerResumenGuardado(integranteId),
    };
  }

  async obtenerArchivo(
    integranteId: string,
    imagenId: string,
    scope: AccessScope,
  ): Promise<{ contenido: Buffer; mimeType: string }> {
    await this.obtenerIntegrante(integranteId, scope);
    const imagen = await this.imagenRepository.findOne({
      where: { id: imagenId, integrante_id: integranteId },
    });
    if (!imagen) {
      throw new NotFoundException('Imagen del domicilio no encontrada');
    }

    return {
      contenido: await this.storage.leer(integranteId, imagenId, imagen.mime_type),
      mimeType: imagen.mime_type,
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
      throw new BadRequestException('La integrante no está lista para registrar imágenes del domicilio');
    }
    if (integrante.expediente?.estado !== ExpedienteEstado.EN_VERIFICACION) {
      throw new BadRequestException('El expediente no está en verificación');
    }
  }

  private async obtenerFachadaActual(
    integranteId: string,
  ): Promise<VerificacionImagenDomicilioEntity | null> {
    return this.imagenRepository.findOne({
      where: { integrante_id: integranteId, tipo: 'FACHADA' },
      order: { created_at: 'DESC', id: 'DESC' },
    });
  }

  private async validarCapturaMedidorHabilitada(integranteId: string): Promise<void> {
    const fachadaActual = await this.obtenerFachadaActual(integranteId);
    if (!fachadaActual) {
      throw new BadRequestException(
        'Primero captura y guarda la fotografía de la fachada',
      );
    }

    const respuesta = await this.respuestaMedidorRepository.findOne({
      where: { integrante_id: integranteId },
      order: { created_at: 'DESC', id: 'DESC' },
    });
    if (
      !respuesta
      || respuesta.fachada_id !== fachadaActual.id
      || !respuesta.tiene_medidor
    ) {
      throw new BadRequestException(
        'Confirma que el domicilio tiene medidor de luz antes de tomar la fotografía',
      );
    }
  }

  private async obtenerResumenGuardado(
    integranteId: string,
  ): Promise<ResumenImagenesDomicilio> {
    const filas = await this.imagenRepository.find({
      where: { integrante_id: integranteId },
      order: { created_at: 'DESC', id: 'DESC' },
    });
    const imagenes = Object.fromEntries(
      TIPOS_IMAGEN_DOMICILIO.map(
        (tipo): [TipoImagenDomicilio, ImagenDomicilioPresentada | null] => [tipo, null],
      ),
    ) as Record<TipoImagenDomicilio, ImagenDomicilioPresentada | null>;

    for (const fila of filas) {
      if (imagenes[fila.tipo] === null) {
        imagenes[fila.tipo] = this.presentar(fila);
      }
    }

    const fachada = filas.find((fila) => fila.tipo === 'FACHADA') ?? null;
    const medidor = filas.find((fila) => fila.tipo === 'MEDIDOR_LUZ') ?? null;
    const ultimaRespuesta = await this.respuestaMedidorRepository.findOne({
      where: { integrante_id: integranteId },
      order: { created_at: 'DESC', id: 'DESC' },
    });
    const respuestaActual = fachada && ultimaRespuesta?.fachada_id === fachada.id
      ? ultimaRespuesta
      : null;
    const medidorPosteriorA = (
      fecha: Date,
    ): boolean => Boolean(medidor && medidor.created_at.getTime() >= fecha.getTime());

    const estadoMedidor: ResumenImagenesDomicilio['medidor_luz'] = respuestaActual
      ? this.presentarRespuestaMedidor(respuestaActual)
      : fachada && medidorPosteriorA(fachada.created_at)
        ? {
            respuesta_id: null,
            fachada_id: fachada.id,
            tiene_medidor: true,
            motivo: null,
            fuente: 'IMAGEN_EXISTENTE',
            registrada_at: medidor!.created_at,
          }
        : null;
    const medidorCumpleRespuesta = Boolean(
      respuestaActual?.tiene_medidor
      && medidorPosteriorA(respuestaActual.created_at),
    );
    const respuestaSinMedidorCompleta = Boolean(
      respuestaActual
      && !respuestaActual.tiene_medidor
      && respuestaActual.motivo,
    );
    const imagenExistenteCompatible = estadoMedidor?.fuente === 'IMAGEN_EXISTENTE';

    return {
      imagenes,
      medidor_luz: estadoMedidor,
      proceso: {
        puede_terminar: Boolean(
          fachada
          && (
            medidorCumpleRespuesta
            || respuestaSinMedidorCompleta
            || imagenExistenteCompatible
          )
        ),
      },
    };
  }

  private presentarRespuestaMedidor(
    respuesta: VerificacionMedidorLuzRespuestaEntity,
  ): NonNullable<ResumenImagenesDomicilio['medidor_luz']> {
    return {
      respuesta_id: respuesta.id,
      fachada_id: respuesta.fachada_id,
      tiene_medidor: respuesta.tiene_medidor,
      motivo: respuesta.motivo,
      fuente: 'RESPUESTA',
      registrada_at: respuesta.created_at,
    };
  }

  private presentar(imagen: VerificacionImagenDomicilioEntity): ImagenDomicilioPresentada {
    return {
      id: imagen.id,
      tipo: imagen.tipo,
      archivo_url: imagen.ruta,
      mime_type: imagen.mime_type,
      foto_capturada_at: imagen.foto_capturada_at,
      registrada_at: imagen.created_at,
    };
  }
}
