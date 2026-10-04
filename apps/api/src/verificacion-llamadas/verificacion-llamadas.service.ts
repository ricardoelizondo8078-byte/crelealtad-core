import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { registrarAuditoria } from '../common/audit-log';
import { ExpedienteEstado } from '../expedientes/expediente.entity';
import { IntegranteEntity, IntegranteEstado } from '../integrantes/integrante.entity';
import { PersonaEntity } from '../personas/persona.entity';
import {
  RegistrarEncuestaLlamadaDto,
  RespuestaCoincidenciaLlamada,
} from './dto/registrar-encuesta-llamada.dto';
import { RegistrarConfirmacionTelefonoDto } from './dto/registrar-confirmacion-telefono.dto';
import {
  ArchivoEvidenciaLlamadaRecibido,
  LlamadaEvidenciaStorageService,
} from './llamada-evidencia-storage.service';
import {
  CaracteristicaLlamadaVerificacion,
  VerificacionLlamadaCaracteristicaEntity,
} from './verificacion-llamada-caracteristica.entity';
import {
  AccionPosteriorLlamadaVerificacion,
  VerificacionLlamadaEncuestaEntity,
} from './verificacion-llamada-encuesta.entity';
import {
  PropositoEvidenciaLlamada,
  VerificacionLlamadaEvidenciaEntity,
} from './verificacion-llamada-evidencia.entity';
import {
  CanalLlamadaVerificacion,
  ResultadoLlamadaVerificacion,
  VerificacionLlamadaEntity,
} from './verificacion-llamada.entity';
import {
  TipoTelefonoEntrevista,
  VerificacionEntrevistaTelefonoConfirmacionEntity,
} from './verificacion-entrevista-telefono-confirmacion.entity';

interface ConteoLlamadas {
  no_contestadas: number;
  contestadas: number;
}

export interface ResumenLlamadasVerificacion {
  telefonica: ConteoLlamadas;
  whatsapp: ConteoLlamadas;
  proceso: {
    completado: boolean;
    completado_at: Date | null;
  };
  telefonos_confirmados: Record<TipoTelefonoEntrevista, {
    telefono: string;
    confirmada_at: Date;
    llamada_id: string;
    evidencia_url: string;
  } | null>;
}

export interface RegistrarLlamadaInput {
  canal: CanalLlamadaVerificacion;
  resultado: ResultadoLlamadaVerificacion;
  tipo_telefono?: TipoTelefonoEntrevista;
  telefono?: string;
  idempotency_key: string;
  ubicacion_latitud: number;
  ubicacion_longitud: number;
  ubicacion_precision_metros?: number;
  ubicacion_capturada_at: string;
}

interface ConteoLlamadasRow {
  canal: CanalLlamadaVerificacion;
  resultado: ResultadoLlamadaVerificacion;
  cantidad: string | number;
}

interface EncuestaCompletadaRow {
  completado_at: Date | string;
}

interface TelefonoConfirmadoPorLlamadaRow {
  llamada_id: string;
  tipo_telefono: TipoTelefonoEntrevista;
  telefono: string;
  confirmada_at: Date | string;
}

interface PostgresError {
  code?: string;
}

const CARACTERISTICAS_DTO: ReadonlyArray<{
  clave: CaracteristicaLlamadaVerificacion;
  campo: keyof Pick<
    RegistrarEncuestaLlamadaDto,
    | 'numero_plantas'
    | 'color_domicilio'
    | 'cochera_entrada'
    | 'banqueta_frente'
    | 'objeto_visible'
    | 'referencia_exterior'
  >;
}> = [
  { clave: CaracteristicaLlamadaVerificacion.NUMERO_PLANTAS, campo: 'numero_plantas' },
  { clave: CaracteristicaLlamadaVerificacion.COLOR_DOMICILIO, campo: 'color_domicilio' },
  { clave: CaracteristicaLlamadaVerificacion.COCHERA_ENTRADA, campo: 'cochera_entrada' },
  { clave: CaracteristicaLlamadaVerificacion.BANQUETA_FRENTE, campo: 'banqueta_frente' },
  { clave: CaracteristicaLlamadaVerificacion.OBJETO_VISIBLE, campo: 'objeto_visible' },
  { clave: CaracteristicaLlamadaVerificacion.REFERENCIA_EXTERIOR, campo: 'referencia_exterior' },
];

const crearResumenVacio = (): ResumenLlamadasVerificacion => ({
  telefonica: { no_contestadas: 0, contestadas: 0 },
  whatsapp: { no_contestadas: 0, contestadas: 0 },
  proceso: { completado: false, completado_at: null },
  telefonos_confirmados: {
    [TipoTelefonoEntrevista.PRINCIPAL]: null,
    [TipoTelefonoEntrevista.SECUNDARIO]: null,
  },
});

const esViolacionUnica = (error: unknown): error is PostgresError => (
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && (error as PostgresError).code === '23505'
);

const coincide = (respuesta: RespuestaCoincidenciaLlamada): boolean => (
  respuesta === RespuestaCoincidenciaLlamada.SI
);

const redondear = (valor: number, decimales: number): number => (
  Number(valor.toFixed(decimales))
);

@Injectable()
export class VerificacionLlamadasService {
  constructor(
    @InjectRepository(VerificacionLlamadaEntity)
    private readonly llamadaRepository: Repository<VerificacionLlamadaEntity>,
    @InjectRepository(VerificacionLlamadaEncuestaEntity)
    private readonly encuestaRepository: Repository<VerificacionLlamadaEncuestaEntity>,
    @InjectRepository(VerificacionLlamadaEvidenciaEntity)
    private readonly evidenciaRepository: Repository<VerificacionLlamadaEvidenciaEntity>,
    @InjectRepository(VerificacionEntrevistaTelefonoConfirmacionEntity)
    private readonly confirmacionTelefonoRepository: Repository<VerificacionEntrevistaTelefonoConfirmacionEntity>,
    @InjectRepository(IntegranteEntity)
    private readonly integranteRepository: Repository<IntegranteEntity>,
    private readonly dataSource: DataSource,
    private readonly evidenciaStorage: LlamadaEvidenciaStorageService,
  ) {}

  async obtenerResumen(integranteId: string): Promise<ResumenLlamadasVerificacion> {
    await this.obtenerIntegrante(integranteId);
    return this.obtenerResumenGuardado(integranteId);
  }

  async registrar(
    integranteId: string,
    usuarioId: string,
    input: RegistrarLlamadaInput,
  ): Promise<{
    llamada: Pick<VerificacionLlamadaEntity, 'id' | 'canal' | 'resultado' | 'created_at'>;
    resumen: ResumenLlamadasVerificacion;
  }> {
    const integrante = await this.obtenerIntegrante(integranteId);
    this.validarIntegranteParaRegistro(integrante);
    this.validarTelefonoUtilizado(input);

    if (input.canal === CanalLlamadaVerificacion.WHATSAPP) {
      const llamadasTelefonicasRegistradas = await this.llamadaRepository.count({
        where: {
          integrante_id: integranteId,
          canal: CanalLlamadaVerificacion.TELEFONICA,
        },
      });
      if (llamadasTelefonicasRegistradas === 0) {
        throw new BadRequestException(
          'Primero registra el resultado de una llamada por teléfono para habilitar WhatsApp',
        );
      }
    }

    let llamada: VerificacionLlamadaEntity;

    try {
      llamada = await this.llamadaRepository.save(this.llamadaRepository.create({
        integrante_id: integranteId,
        registrada_por: usuarioId,
        canal: input.canal,
        resultado: input.resultado,
        tipo_telefono: input.tipo_telefono ?? null,
        telefono: input.telefono ?? null,
        idempotency_key: input.idempotency_key,
        ubicacion_latitud: redondear(input.ubicacion_latitud, 7),
        ubicacion_longitud: redondear(input.ubicacion_longitud, 7),
        ubicacion_precision_metros: input.ubicacion_precision_metros == null
          ? null
          : redondear(input.ubicacion_precision_metros, 2),
        ubicacion_capturada_at: new Date(input.ubicacion_capturada_at),
        ubicacion_fuente: 'DISPOSITIVO',
      }));
    } catch (error) {
      if (!esViolacionUnica(error)) {
        throw error;
      }

      const existente = await this.llamadaRepository.findOne({
        where: {
          registrada_por: usuarioId,
          idempotency_key: input.idempotency_key,
        },
      });

      if (
        !existente
        || existente.integrante_id !== integranteId
        || existente.canal !== input.canal
        || existente.resultado !== input.resultado
        || (existente.tipo_telefono ?? null) !== (input.tipo_telefono ?? null)
        || (existente.telefono ?? null) !== (input.telefono ?? null)
      ) {
        throw new ConflictException('La clave del intento ya fue utilizada con otros datos');
      }

      llamada = existente;
    }

    return {
      llamada: {
        id: llamada.id,
        canal: llamada.canal,
        resultado: llamada.resultado,
        created_at: llamada.created_at,
      },
      resumen: await this.obtenerResumenGuardado(integranteId),
    };
  }

  async registrarEncuesta(
    integranteId: string,
    llamadaId: string,
    usuarioId: string,
    input: RegistrarEncuestaLlamadaDto,
    archivo: ArchivoEvidenciaLlamadaRecibido | undefined,
  ) {
    const integrante = await this.obtenerIntegrante(integranteId);
    this.validarIntegranteParaRegistro(integrante);

    const llamada = await this.llamadaRepository.findOne({
      where: { id: llamadaId, integrante_id: integranteId },
    });
    if (!llamada) {
      throw new NotFoundException('Intento de llamada no encontrado');
    }
    if (llamada.resultado !== ResultadoLlamadaVerificacion.CONTESTADA) {
      throw new BadRequestException('Solo una llamada contestada puede registrar encuesta y evidencia');
    }

    const encuestaExistente = await this.encuestaRepository.findOne({
      where: { llamada_id: llamadaId },
    });
    if (encuestaExistente) {
      return this.crearRespuestaEncuesta(integranteId, encuestaExistente);
    }
    if (!archivo) {
      throw new BadRequestException('La fotografía de evidencia es obligatoria');
    }

    const caracteristicas = CARACTERISTICAS_DTO.map(({ clave, campo }) => ({
      clave,
      coincide: coincide(input[campo]),
    }));
    const todasCoinciden = coincide(input.identidad_coincide)
      && coincide(input.domicilio_coincide)
      && caracteristicas.every((caracteristica) => caracteristica.coincide);
    const llamadaCompletada = todasCoinciden
      && input.accion_posterior !== AccionPosteriorLlamadaVerificacion.LLAMAR_MAS_TARDE;

    const evidenciaGuardada = await this.evidenciaStorage.guardar(
      integranteId,
      llamadaId,
      archivo,
    );

    let encuestaGuardada: VerificacionLlamadaEncuestaEntity;
    try {
      encuestaGuardada = await this.dataSource.transaction(async (manager) => {
        const encuesta = await manager.save(
          VerificacionLlamadaEncuestaEntity,
          manager.create(VerificacionLlamadaEncuestaEntity, {
            llamada_id: llamadaId,
            identidad_coincide: coincide(input.identidad_coincide),
            domicilio_coincide: coincide(input.domicilio_coincide),
            accion_posterior: input.accion_posterior,
            registrada_por: usuarioId,
            completada_at: llamadaCompletada ? new Date() : null,
          }),
        );

        await manager.save(
          VerificacionLlamadaCaracteristicaEntity,
          caracteristicas.map((caracteristica) => manager.create(
            VerificacionLlamadaCaracteristicaEntity,
            { encuesta_id: encuesta.id, ...caracteristica },
          )),
        );

        await manager.save(
          VerificacionLlamadaEvidenciaEntity,
          manager.create(VerificacionLlamadaEvidenciaEntity, {
            ...evidenciaGuardada,
            encuesta_id: encuesta.id,
            llamada_id: llamadaId,
            proposito: PropositoEvidenciaLlamada.ENCUESTA,
            version: 1,
            tipo_telefono: null,
            telefono: null,
            registrada_por: usuarioId,
          }),
        );

        await manager.query(
          `INSERT INTO audit_log (tabla, registro_id, accion, datos_despues, usuario_id)
           VALUES ('verificacion_llamada_encuestas', $1, 'ENCUESTA_LLAMADA', $2::jsonb, $3)`,
          [
            encuesta.id,
            JSON.stringify({
              llamada_id: llamadaId,
              accion_posterior: input.accion_posterior,
              todas_coinciden: todasCoinciden,
              completada: llamadaCompletada,
              evidencia_id: evidenciaGuardada.id,
            }),
            usuarioId,
          ],
        );

        return encuesta;
      });
    } catch (error) {
      await this.evidenciaStorage.descartar(
        integranteId,
        llamadaId,
        evidenciaGuardada.id,
      );

      if (esViolacionUnica(error)) {
        const existente = await this.encuestaRepository.findOne({
          where: { llamada_id: llamadaId },
        });
        if (existente) {
          return this.crearRespuestaEncuesta(integranteId, existente);
        }
      }
      throw error;
    }

    return this.crearRespuestaEncuesta(integranteId, encuestaGuardada);
  }

  async obtenerEvidencia(integranteId: string, llamadaId: string) {
    await this.obtenerIntegrante(integranteId);
    const llamada = await this.llamadaRepository.findOne({
      where: { id: llamadaId, integrante_id: integranteId },
    });
    if (!llamada) {
      throw new NotFoundException('Intento de llamada no encontrado');
    }

    const encuesta = await this.encuestaRepository.findOne({
      where: { llamada_id: llamadaId },
    });
    if (!encuesta) {
      throw new NotFoundException('Encuesta de llamada no encontrada');
    }
    const evidencia = await this.evidenciaRepository.findOne({
      where: { encuesta_id: encuesta.id },
    });
    if (!evidencia) {
      throw new NotFoundException('Evidencia de llamada no encontrada');
    }

    return {
      contenido: await this.evidenciaStorage.leer(
        integranteId,
        llamadaId,
        evidencia.id,
        evidencia.mime_type,
      ),
      mimeType: evidencia.mime_type,
    };
  }

  async registrarConfirmacionTelefono(
    integranteId: string,
    llamadaId: string,
    usuarioId: string,
    input: RegistrarConfirmacionTelefonoDto,
    archivo: ArchivoEvidenciaLlamadaRecibido | undefined,
  ) {
    const integrante = await this.obtenerIntegrante(integranteId);
    this.validarIntegranteParaRegistro(integrante);

    const llamada = await this.llamadaRepository.findOne({
      where: { id: llamadaId, integrante_id: integranteId },
    });
    if (!llamada) {
      throw new NotFoundException('Intento de llamada no encontrado');
    }
    if (llamada.resultado !== ResultadoLlamadaVerificacion.CONTESTADA) {
      throw new BadRequestException('Solo una llamada contestada puede confirmar un teléfono');
    }

    const existente = await this.confirmacionTelefonoRepository.findOne({
      where: { llamada_id: llamadaId },
    });
    if (existente) {
      if (
        existente.tipo_telefono !== input.tipo_telefono
        || existente.telefono !== input.telefono
      ) {
        throw new ConflictException('La llamada ya confirmó otro teléfono');
      }
      await this.dataSource.transaction(async (manager) => {
        await this.actualizarTelefonoMaestro(
          manager,
          integrante,
          llamadaId,
          existente.evidencia_id,
          input.tipo_telefono,
          input.telefono,
          usuarioId,
        );
      });
      return {
        confirmacion: existente,
        resumen: await this.obtenerResumenGuardado(integranteId),
      };
    }
    if (!archivo) {
      throw new BadRequestException('La fotografía de evidencia es obligatoria');
    }

    const evidenciaGuardada = await this.evidenciaStorage.guardar(
      integranteId,
      llamadaId,
      archivo,
      `/verificacion/integrantes/${integranteId}/llamadas/${llamadaId}/confirmacion-telefono/evidencia-actual`,
    );

    let confirmacionGuardada: VerificacionEntrevistaTelefonoConfirmacionEntity;
    try {
      confirmacionGuardada = await this.dataSource.transaction(async (manager) => {
        await manager.save(
          VerificacionLlamadaEvidenciaEntity,
          manager.create(VerificacionLlamadaEvidenciaEntity, {
            ...evidenciaGuardada,
            encuesta_id: null,
            llamada_id: llamadaId,
            proposito: PropositoEvidenciaLlamada.CONFIRMACION_TELEFONO,
            version: 1,
            tipo_telefono: input.tipo_telefono,
            telefono: input.telefono,
            registrada_por: usuarioId,
          }),
        );
        const confirmacion = await manager.save(
          VerificacionEntrevistaTelefonoConfirmacionEntity,
          manager.create(VerificacionEntrevistaTelefonoConfirmacionEntity, {
            ...evidenciaGuardada,
            integrante_id: integranteId,
            llamada_id: llamadaId,
            evidencia_id: evidenciaGuardada.id,
            tipo_telefono: input.tipo_telefono,
            telefono: input.telefono,
            registrada_por: usuarioId,
          }),
        );
        await this.actualizarTelefonoMaestro(
          manager,
          integrante,
          llamadaId,
          evidenciaGuardada.id,
          input.tipo_telefono,
          input.telefono,
          usuarioId,
        );
        await manager.query(
          `INSERT INTO audit_log (tabla, registro_id, accion, datos_despues, usuario_id)
           VALUES ('verificacion_entrevista_telefono_confirmaciones', $1, 'TELEFONO_CONFIRMADO', $2::jsonb, $3)`,
          [
            confirmacion.id,
            JSON.stringify({
              integrante_id: integranteId,
              llamada_id: llamadaId,
              tipo_telefono: input.tipo_telefono,
              evidencia_id: evidenciaGuardada.id,
            }),
            usuarioId,
          ],
        );
        return confirmacion;
      });
    } catch (error) {
      await this.evidenciaStorage.descartar(integranteId, llamadaId, evidenciaGuardada.id);
      if (esViolacionUnica(error)) {
        const repetida = await this.confirmacionTelefonoRepository.findOne({
          where: { llamada_id: llamadaId },
        });
        if (repetida) {
          return {
            confirmacion: repetida,
            resumen: await this.obtenerResumenGuardado(integranteId),
          };
        }
      }
      throw error;
    }

    return {
      confirmacion: confirmacionGuardada,
      resumen: await this.obtenerResumenGuardado(integranteId),
    };
  }

  private async actualizarTelefonoMaestro(
    manager: EntityManager,
    integrante: IntegranteEntity,
    llamadaId: string,
    evidenciaId: string,
    tipoTelefono: TipoTelefonoEntrevista,
    telefono: string,
    usuarioId: string,
  ): Promise<void> {
    if (!integrante.persona_id) {
      throw new ConflictException(
        'La integrante no tiene una persona asociada para guardar el teléfono confirmado',
      );
    }

    const personaRepository = manager.getRepository(PersonaEntity);
    const persona = await personaRepository.findOne({
      where: { id: integrante.persona_id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!persona) {
      throw new ConflictException('La persona asociada a la integrante no fue encontrada');
    }

    const campo = tipoTelefono === TipoTelefonoEntrevista.PRINCIPAL
      ? 'telefono'
      : 'telefono_secundario';
    const telefonoAnterior = persona[campo];
    if (telefonoAnterior === telefono) return;

    await personaRepository.update(persona.id, { [campo]: telefono });
    await registrarAuditoria(manager, {
      tabla: 'personas',
      registroId: persona.id,
      accion: 'TELEFONO_VERIFICADO',
      usuarioId,
      datosAntes: {
        campo,
        tenia_valor: Boolean(telefonoAnterior?.trim()),
      },
      datosDespues: {
        campo,
        fuente: 'CONFIRMACION_LLAMADA',
        integrante_id: integrante.id,
        llamada_id: llamadaId,
        evidencia_id: evidenciaId,
      },
    });
  }

  async obtenerEvidenciaConfirmacionTelefono(integranteId: string, llamadaId: string) {
    await this.obtenerIntegrante(integranteId);
    const confirmacion = await this.confirmacionTelefonoRepository.findOne({
      where: { integrante_id: integranteId, llamada_id: llamadaId },
    });
    if (!confirmacion) {
      throw new NotFoundException('Confirmación telefónica no encontrada');
    }
    return {
      contenido: await this.evidenciaStorage.leer(
        integranteId,
        llamadaId,
        confirmacion.id,
        confirmacion.mime_type,
      ),
      mimeType: confirmacion.mime_type,
    };
  }

  async obtenerEvidenciaTelefonoActual(integranteId: string, llamadaId: string) {
    await this.obtenerContextoTelefonoConfirmado(integranteId, llamadaId);
    const evidencia = await this.obtenerEvidenciaTelefonoVigente(llamadaId);
    return {
      contenido: await this.evidenciaStorage.leer(
        integranteId,
        llamadaId,
        evidencia.id,
        evidencia.mime_type,
      ),
      mimeType: evidencia.mime_type,
    };
  }

  async reemplazarEvidenciaTelefono(
    integranteId: string,
    llamadaId: string,
    usuarioId: string,
    input: RegistrarConfirmacionTelefonoDto,
    archivo: ArchivoEvidenciaLlamadaRecibido | undefined,
  ) {
    const contexto = await this.obtenerContextoTelefonoConfirmado(integranteId, llamadaId);
    if (contexto.tipo_telefono !== input.tipo_telefono || contexto.telefono !== input.telefono) {
      throw new ConflictException('La evidencia no corresponde al teléfono confirmado');
    }
    if (!archivo) {
      throw new BadRequestException('La fotografía de evidencia es obligatoria');
    }

    const ultimaVersion = await this.evidenciaRepository.findOne({
      where: {
        llamada_id: llamadaId,
        proposito: PropositoEvidenciaLlamada.CONFIRMACION_TELEFONO,
      },
      order: { version: 'DESC' },
    });
    const evidenciaGuardada = await this.evidenciaStorage.guardar(
      integranteId,
      llamadaId,
      archivo,
      `/verificacion/integrantes/${integranteId}/llamadas/${llamadaId}/confirmacion-telefono/evidencia-actual`,
    );

    try {
      const reemplazo = await this.dataSource.transaction(async (manager) => {
        const evidencia = await manager.save(
          VerificacionLlamadaEvidenciaEntity,
          manager.create(VerificacionLlamadaEvidenciaEntity, {
            ...evidenciaGuardada,
            encuesta_id: null,
            llamada_id: llamadaId,
            proposito: PropositoEvidenciaLlamada.CONFIRMACION_TELEFONO,
            version: (ultimaVersion?.version ?? 0) + 1,
            tipo_telefono: input.tipo_telefono,
            telefono: input.telefono,
            registrada_por: usuarioId,
          }),
        );
        await manager.query(
          `INSERT INTO audit_log (tabla, registro_id, accion, datos_despues, usuario_id)
           VALUES ('verificacion_llamada_evidencias', $1, 'EVID_TEL_REEMPLAZADA', $2::jsonb, $3)`,
          [
            evidencia.id,
            JSON.stringify({
              llamada_id: llamadaId,
              tipo_telefono: input.tipo_telefono,
              version: evidencia.version,
            }),
            usuarioId,
          ],
        );
        return evidencia;
      });
      return {
        evidencia: reemplazo,
        resumen: await this.obtenerResumenGuardado(integranteId),
      };
    } catch (error) {
      await this.evidenciaStorage.descartar(integranteId, llamadaId, evidenciaGuardada.id);
      throw error;
    }
  }

  private async obtenerContextoTelefonoConfirmado(
    integranteId: string,
    llamadaId: string,
  ): Promise<{ tipo_telefono: TipoTelefonoEntrevista; telefono: string }> {
    await this.obtenerIntegrante(integranteId);
    const confirmacionEntrevista = await this.confirmacionTelefonoRepository.findOne({
      where: { integrante_id: integranteId, llamada_id: llamadaId },
    });
    if (confirmacionEntrevista) {
      return {
        tipo_telefono: confirmacionEntrevista.tipo_telefono,
        telefono: confirmacionEntrevista.telefono,
      };
    }

    const llamada = await this.llamadaRepository.findOne({
      where: {
        id: llamadaId,
        integrante_id: integranteId,
        resultado: ResultadoLlamadaVerificacion.CONTESTADA,
      },
    });
    if (!llamada?.tipo_telefono || !llamada.telefono) {
      throw new NotFoundException('Teléfono confirmado no encontrado');
    }
    const evidencia = await this.evidenciaRepository.findOne({
      where: { llamada_id: llamadaId },
    });
    if (!evidencia) {
      throw new NotFoundException('Evidencia del teléfono no encontrada');
    }
    return {
      tipo_telefono: llamada.tipo_telefono,
      telefono: llamada.telefono,
    };
  }

  private async obtenerEvidenciaTelefonoVigente(
    llamadaId: string,
  ): Promise<VerificacionLlamadaEvidenciaEntity> {
    const confirmacion = await this.evidenciaRepository.findOne({
      where: {
        llamada_id: llamadaId,
        proposito: PropositoEvidenciaLlamada.CONFIRMACION_TELEFONO,
      },
      order: { version: 'DESC' },
    });
    if (confirmacion) return confirmacion;

    const encuesta = await this.evidenciaRepository.findOne({
      where: {
        llamada_id: llamadaId,
        proposito: PropositoEvidenciaLlamada.ENCUESTA,
      },
      order: { version: 'DESC' },
    });
    if (!encuesta) {
      throw new NotFoundException('Evidencia del teléfono no encontrada');
    }
    return encuesta;
  }

  private async crearRespuestaEncuesta(
    integranteId: string,
    encuesta: VerificacionLlamadaEncuestaEntity,
  ) {
    const evidencia = await this.evidenciaRepository.findOne({
      where: { encuesta_id: encuesta.id },
    });
    if (!evidencia) {
      throw new ConflictException('La encuesta existe, pero su evidencia no está disponible');
    }

    return {
      encuesta: {
        id: encuesta.id,
        llamada_id: encuesta.llamada_id,
        accion_posterior: encuesta.accion_posterior,
        completada: encuesta.completada_at !== null,
        completada_at: encuesta.completada_at,
        evidencia: {
          id: evidencia.id,
          ruta: evidencia.ruta,
          mime_type: evidencia.mime_type,
          tamano_bytes: evidencia.tamano_bytes,
        },
      },
      resumen: await this.obtenerResumenGuardado(integranteId),
    };
  }

  private validarIntegranteParaRegistro(integrante: IntegranteEntity): void {
    if (
      integrante.estado !== IntegranteEstado.SUJETA_CREDITO
      && integrante.estado !== IntegranteEstado.EN_VERIFICACION
    ) {
      throw new BadRequestException('La integrante no está lista para recibir llamadas de verificación');
    }

    if (integrante.expediente?.estado !== ExpedienteEstado.EN_VERIFICACION) {
      throw new BadRequestException('El expediente no está en verificación');
    }
  }

  private validarTelefonoUtilizado(input: RegistrarLlamadaInput): void {
    const tieneTipo = input.tipo_telefono !== undefined;
    const tieneTelefono = input.telefono !== undefined;
    if (tieneTipo !== tieneTelefono) {
      throw new BadRequestException(
        'El tipo y el número utilizado deben enviarse juntos',
      );
    }
    if (tieneTelefono && !/^[0-9]{10}$/.test(input.telefono as string)) {
      throw new BadRequestException('El teléfono utilizado debe contener diez dígitos');
    }
  }

  private async obtenerIntegrante(integranteId: string): Promise<IntegranteEntity> {
    const integrante = await this.integranteRepository.findOne({
      where: { id: integranteId },
      relations: { expediente: true },
    });

    if (!integrante) {
      throw new NotFoundException('Integrante no encontrada');
    }

    return integrante;
  }

  private async obtenerResumenGuardado(
    integranteId: string,
  ): Promise<ResumenLlamadasVerificacion> {
    const rows = await this.llamadaRepository
      .createQueryBuilder('llamada')
      .select('llamada.canal', 'canal')
      .addSelect('llamada.resultado', 'resultado')
      .addSelect('COUNT(*)', 'cantidad')
      .where('llamada.integrante_id = :integranteId', { integranteId })
      .groupBy('llamada.canal')
      .addGroupBy('llamada.resultado')
      .getRawMany<ConteoLlamadasRow>();

    const encuestaCompletada = await this.encuestaRepository
      .createQueryBuilder('encuesta')
      .innerJoin(
        VerificacionLlamadaEntity,
        'llamada',
        'llamada.id = encuesta.llamada_id',
      )
      .select('encuesta.completada_at', 'completado_at')
      .where('llamada.integrante_id = :integranteId', { integranteId })
      .andWhere('encuesta.completada_at IS NOT NULL')
      .orderBy('encuesta.completada_at', 'DESC')
      .limit(1)
      .getRawOne<EncuestaCompletadaRow>();

    const confirmacionesTelefono = await this.confirmacionTelefonoRepository.find({
      where: { integrante_id: integranteId },
      order: { created_at: 'DESC' },
    });
    const confirmacionesPorLlamada = await this.dataSource.query<TelefonoConfirmadoPorLlamadaRow[]>(
      `SELECT
         llamada.id AS llamada_id,
         llamada.tipo_telefono,
         llamada.telefono,
         evidencia.created_at AS confirmada_at
       FROM verificacion_llamada_evidencias evidencia
       JOIN verificacion_llamada_encuestas encuesta
         ON encuesta.id = evidencia.encuesta_id
       JOIN verificacion_llamadas llamada
         ON llamada.id = encuesta.llamada_id
       WHERE llamada.integrante_id = $1
         AND llamada.resultado = 'CONTESTADA'
         AND llamada.tipo_telefono IS NOT NULL
         AND llamada.telefono IS NOT NULL
       ORDER BY evidencia.created_at DESC`,
      [integranteId],
    );

    const resumen = crearResumenVacio();

    for (const row of rows) {
      const canal = row.canal === CanalLlamadaVerificacion.TELEFONICA
        ? resumen.telefonica
        : resumen.whatsapp;
      const cantidad = Number(row.cantidad);

      if (row.resultado === ResultadoLlamadaVerificacion.CONTESTADA) {
        canal.contestadas = cantidad;
      } else {
        canal.no_contestadas = cantidad;
      }
    }

    const confirmacionDesdeEntrevista = confirmacionesTelefono[0];
    const fechasConclusion = [
      encuestaCompletada?.completado_at,
      confirmacionDesdeEntrevista?.created_at,
    ]
      .filter((fecha): fecha is Date | string => fecha != null)
      .map((fecha) => new Date(fecha))
      .sort((a, b) => b.getTime() - a.getTime());

    if (fechasConclusion[0]) {
      resumen.proceso = {
        completado: true,
        completado_at: fechasConclusion[0],
      };
    }

    const telefonosConEvidencia = [
      ...confirmacionesTelefono.map((confirmacion) => ({
        llamada_id: confirmacion.llamada_id,
        tipo_telefono: confirmacion.tipo_telefono,
        telefono: confirmacion.telefono,
        confirmada_at: confirmacion.created_at,
      })),
      ...confirmacionesPorLlamada,
    ].sort(
      (a, b) => new Date(b.confirmada_at).getTime() - new Date(a.confirmada_at).getTime(),
    );

    for (const confirmacion of telefonosConEvidencia) {
      if (!resumen.telefonos_confirmados[confirmacion.tipo_telefono]) {
        resumen.telefonos_confirmados[confirmacion.tipo_telefono] = {
          telefono: confirmacion.telefono,
          confirmada_at: new Date(confirmacion.confirmada_at),
          llamada_id: confirmacion.llamada_id,
          evidencia_url:
            `/verificacion/integrantes/${integranteId}/llamadas/${confirmacion.llamada_id}/confirmacion-telefono/evidencia-actual`,
        };
      }
    }

    return resumen;
  }
}
