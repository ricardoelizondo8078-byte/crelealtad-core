import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { AccessScope, assertIntegranteAccess } from '../common/access-scope';
import { registrarAuditoria } from '../common/audit-log';
import { ExpedienteEstado } from '../expedientes/expediente.entity';
import { IntegranteEntity, IntegranteEstado } from '../integrantes/integrante.entity';
import {
  ArchivoEvidenciaEntrevistaRecibido,
  EntrevistaEvidenciaStorageService,
} from './entrevista-evidencia-storage.service';
import { GuardarEntrevistaDto } from './dto/guardar-entrevista.dto';
import { RegistrarEvidenciaEntrevistaDto } from './dto/registrar-evidencia-entrevista.dto';
import { VerificacionEntrevistaDesacuerdoMontoEntity } from './verificacion-entrevista-desacuerdo-monto.entity';
import {
  TipoEvidenciaEntrevista,
  VerificacionEntrevistaEvidenciaEntity,
} from './verificacion-entrevista-evidencia.entity';
import { VerificacionEntrevistaFamiliarEntity } from './verificacion-entrevista-familiar.entity';
import { VerificacionEntrevistaEntity } from './verificacion-entrevista.entity';

interface PostgresError {
  code?: string;
}

export interface EvidenciaEntrevistaPresentada {
  id: string;
  tipo: TipoEvidenciaEntrevista;
  archivo_url: string;
  mime_type: 'image/jpeg' | 'image/png';
  foto_capturada_at: Date | null;
  registrada_at: Date;
}

const esViolacionUnica = (error: unknown): error is PostgresError => (
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && (error as PostgresError).code === '23505'
);

const redondear = (valor: number, decimales: number): number => Number(valor.toFixed(decimales));

const textoONull = (valor: string | null | undefined): string | null => {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
};

const numeroONull = (valor: number | null | undefined): number | null => (
  valor == null ? null : valor
);

const numeroPresentado = (valor: number | null): number | null => (
  valor == null ? null : Number(valor)
);

const tieneValor = (valor: unknown): boolean => (
  valor !== null
  && valor !== undefined
  && (typeof valor !== 'string' || valor.trim().length > 0)
);

@Injectable()
export class VerificacionEntrevistaService {
  constructor(
    @InjectRepository(VerificacionEntrevistaEntity)
    private readonly entrevistaRepository: Repository<VerificacionEntrevistaEntity>,
    @InjectRepository(VerificacionEntrevistaFamiliarEntity)
    private readonly familiarRepository: Repository<VerificacionEntrevistaFamiliarEntity>,
    @InjectRepository(VerificacionEntrevistaDesacuerdoMontoEntity)
    private readonly desacuerdoRepository: Repository<VerificacionEntrevistaDesacuerdoMontoEntity>,
    @InjectRepository(VerificacionEntrevistaEvidenciaEntity)
    private readonly evidenciaRepository: Repository<VerificacionEntrevistaEvidenciaEntity>,
    @InjectRepository(IntegranteEntity)
    private readonly integranteRepository: Repository<IntegranteEntity>,
    private readonly dataSource: DataSource,
    private readonly storage: EntrevistaEvidenciaStorageService,
  ) {}

  async obtenerEntrevista(
    integranteId: string,
    scope: AccessScope,
  ): Promise<{ entrevista: Record<string, unknown> | null }> {
    await this.obtenerIntegrante(integranteId, scope);
    const entrevista = await this.entrevistaRepository.findOne({
      where: { integrante_id: integranteId },
    });
    if (!entrevista) return { entrevista: null };
    return {
      entrevista: await this.presentarEntrevista(
        entrevista,
        this.familiarRepository,
        this.desacuerdoRepository,
      ),
    };
  }

  async guardarEntrevista(
    integranteId: string,
    scope: AccessScope,
    input: GuardarEntrevistaDto,
  ): Promise<{ entrevista: Record<string, unknown> }> {
    const integrante = await this.obtenerIntegrante(integranteId, scope);
    this.validarIntegranteParaRegistro(integrante);
    const expedienteId = integrante.expediente_id;
    this.validarConsistenciaInput(integranteId, input);

    return this.dataSource.transaction(async (manager) => {
      await this.validarIntegrantesRelacionadas(manager, expedienteId, input);
      const repository = manager.getRepository(VerificacionEntrevistaEntity);
      const familiarRepository = manager.getRepository(VerificacionEntrevistaFamiliarEntity);
      const desacuerdoRepository = manager.getRepository(VerificacionEntrevistaDesacuerdoMontoEntity);
      const existente = await repository.findOne({
        where: { integrante_id: integranteId },
        lock: { mode: 'pessimistic_write' },
      });

      const revisionActual = existente?.revision ?? 0;
      if (input.expected_revision !== undefined && input.expected_revision !== revisionActual) {
        if (existente) {
          const presentada = await this.presentarEntrevista(
            existente,
            familiarRepository,
            desacuerdoRepository,
          );
          if (this.entrevistaCoincideConInput(presentada, input)) {
            return { entrevista: presentada };
          }
        }
        throw new ConflictException(
          'La entrevista cambió en el servidor. Revisa la versión actual antes de sincronizar.',
        );
      }

      const entrevista = await repository.save(repository.create({
        ...(existente ?? {}),
        ...this.mapearEntrevista(input),
        expediente_id: expedienteId,
        integrante_id: integranteId,
        entrevistada_por: existente?.entrevistada_por ?? scope.usuarioId,
        actualizada_por: scope.usuarioId,
        revision: (existente?.revision ?? 0) + 1,
      }));

      const familiaresCambiaron = await this.registrarHistorialFamiliares(
        familiarRepository,
        entrevista,
        input.familiares_grupo_ids ?? [],
        scope.usuarioId,
      );
      const desacuerdosCambiaron = await this.registrarHistorialDesacuerdos(
        desacuerdoRepository,
        entrevista,
        input.desacuerdos_montos ?? [],
        scope.usuarioId,
      );
      const camposModificados = this.obtenerCamposModificados(existente, entrevista);
      if (familiaresCambiaron) camposModificados.push('familiares_grupo_ids');
      if (desacuerdosCambiaron) camposModificados.push('desacuerdos_montos');

      await registrarAuditoria(manager, {
        tabla: 'verificacion_entrevistas',
        registroId: entrevista.id,
        accion: 'GUARDA_ENTREVISTA',
        usuarioId: scope.usuarioId,
        datosDespues: {
          integrante_id: integranteId,
          revision: entrevista.revision,
          campos_modificados: camposModificados,
        },
      });

      return {
        entrevista: await this.presentarEntrevista(
          entrevista,
          familiarRepository,
          desacuerdoRepository,
        ),
      };
    });
  }

  async obtenerEvidencias(
    integranteId: string,
    scope: AccessScope,
    tipo?: TipoEvidenciaEntrevista,
  ): Promise<{ evidencias: EvidenciaEntrevistaPresentada[] }> {
    await this.obtenerIntegrante(integranteId, scope);
    return { evidencias: await this.obtenerEvidenciasGuardadas(integranteId, tipo) };
  }

  async registrarEvidencia(
    integranteId: string,
    scope: AccessScope,
    input: RegistrarEvidenciaEntrevistaDto,
    foto: ArchivoEvidenciaEntrevistaRecibido | undefined,
  ): Promise<{
    evidencia: EvidenciaEntrevistaPresentada;
    evidencias: EvidenciaEntrevistaPresentada[];
  }> {
    const integrante = await this.obtenerIntegrante(integranteId, scope);
    this.validarIntegranteParaRegistro(integrante);
    if (!foto) throw new BadRequestException('Toma una fotografía para guardarla como evidencia');

    const archivo = await this.storage.guardar(integranteId, input.tipo, foto);
    let evidencia: VerificacionEntrevistaEvidenciaEntity;

    try {
      evidencia = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(VerificacionEntrevistaEvidenciaEntity);
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
          legado_sin_ubicacion: false,
        }));

        await registrarAuditoria(manager, {
          tabla: 'verificacion_entrevista_evidencias',
          registroId: guardada.id,
          accion: 'EVID_ENTREVISTA',
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
      await this.storage.descartar(integranteId, input.tipo, archivo.id);
      if (!esViolacionUnica(error)) throw error;
      const existente = await this.evidenciaRepository.findOne({
        where: { registrada_por: scope.usuarioId, idempotency_key: input.idempotency_key },
      });
      if (
        !existente
        || existente.integrante_id !== integranteId
        || existente.tipo !== input.tipo
        || existente.sha256 !== archivo.sha256
      ) {
        throw new ConflictException('La clave de la fotografía ya fue utilizada con otros datos');
      }
      evidencia = existente;
    }

    return {
      evidencia: this.presentarEvidencia(evidencia),
      evidencias: await this.obtenerEvidenciasGuardadas(integranteId, input.tipo),
    };
  }

  async obtenerArchivo(
    integranteId: string,
    evidenciaId: string,
    scope: AccessScope,
  ): Promise<{ contenido: Buffer; mimeType: string }> {
    await this.obtenerIntegrante(integranteId, scope);
    const evidencia = await this.evidenciaRepository.findOne({
      where: { id: evidenciaId, integrante_id: integranteId },
    });
    if (!evidencia) throw new NotFoundException('Evidencia de entrevista no encontrada');
    return {
      contenido: await this.storage.leer(
        integranteId,
        evidencia.tipo,
        evidenciaId,
        evidencia.mime_type,
      ),
      mimeType: evidencia.mime_type,
    };
  }

  private async obtenerIntegrante(
    integranteId: string,
    scope: AccessScope,
  ): Promise<IntegranteEntity> {
    await assertIntegranteAccess(this.integranteRepository.manager, integranteId, scope);
    const integrante = await this.integranteRepository.findOne({
      where: { id: integranteId },
      relations: { expediente: true },
    });
    if (!integrante) throw new NotFoundException('Integrante no encontrada');
    return integrante;
  }

  private validarIntegranteParaRegistro(integrante: IntegranteEntity): void {
    if (
      integrante.estado !== IntegranteEstado.SUJETA_CREDITO
      && integrante.estado !== IntegranteEstado.EN_VERIFICACION
    ) {
      throw new BadRequestException('La integrante no está lista para registrar la entrevista');
    }
    if (integrante.expediente?.estado !== ExpedienteEstado.EN_VERIFICACION) {
      throw new BadRequestException('El expediente no está en verificación');
    }
  }

  private validarConsistenciaInput(integranteId: string, input: GuardarEntrevistaDto): void {
    const familiares = input.familiares_grupo_ids ?? [];
    const desacuerdos = input.desacuerdos_montos ?? [];
    if (familiares.includes(integranteId)) {
      throw new BadRequestException('La entrevistada no puede declararse como su propia familiar');
    }
    if (desacuerdos.some((item) => item.integrante_id === integranteId)) {
      throw new BadRequestException('La entrevistada no puede discrepar de su propio monto');
    }
    if (input.tiene_familiares_grupo !== true && familiares.length > 0) {
      throw new BadRequestException('Los familiares sólo se registran cuando la respuesta es Sí');
    }
    if (input.acuerdo_montos_companeras !== false && desacuerdos.length > 0) {
      throw new BadRequestException('Los desacuerdos sólo se registran cuando la respuesta es No');
    }
    if (input.conoce_tesorera !== true && input.tesorera_reconocida_integrante_id) {
      throw new BadRequestException('La tesorera reconocida requiere una respuesta afirmativa');
    }
    if (
      input.desconoce_domicilio_recoleccion === true
      && input.domicilio_recoleccion_integrante_id
    ) {
      throw new BadRequestException('El domicilio de recolección no puede ser conocido y desconocido a la vez');
    }
    if (input.conoce_asesora !== true && tieneValor(input.como_conocio_asesora)) {
      throw new BadRequestException('Cómo conoció a la asesora requiere una respuesta afirmativa');
    }
    if (input.conoce_integrantes !== true && tieneValor(input.tiempo_conoce_integrantes)) {
      throw new BadRequestException('La antigüedad de conocer al grupo requiere una respuesta afirmativa');
    }
    const detallesCreditoExterno = [
      input.financiera_credito_grupal,
      input.credito_grupal_anterior_activo,
      input.valor_ficha_credito_grupal,
      input.semana_actual_credito_grupal,
      input.mes_desembolso_credito_grupal,
      input.mes_ultimo_pago_credito_grupal,
      input.anio_ultimo_pago_credito_grupal,
      input.numero_ciclos_credito_grupal,
      input.tasa_credito_grupal,
      input.nombre_asesora_credito_grupal,
      input.telefono_asesora_credito_grupal,
      input.motivo_no_renovacion_credito_grupal,
    ];
    if (
      input.tiene_otro_credito_grupal !== true
      && detallesCreditoExterno.some(tieneValor)
    ) {
      throw new BadRequestException('El detalle del crédito externo requiere una respuesta afirmativa');
    }
    if (input.vive_en_domicilio !== false && tieneValor(input.motivo_no_vive_domicilio)) {
      throw new BadRequestException('El motivo de no vivir en el domicilio requiere una respuesta negativa');
    }
    if (input.tipo_domicilio !== 'FAMILIAR' && tieneValor(input.familiar_domicilio)) {
      throw new BadRequestException('El parentesco del domicilio sólo aplica al tipo Familiar');
    }
    if (input.otro_ingreso_hogar !== true && tieneValor(input.otro_ingreso_semanal)) {
      throw new BadRequestException('La aportación semanal requiere otro ingreso en el hogar');
    }
    const fuentes = input.fuentes_ingreso ?? [];
    if (
      !fuentes.includes('SUELDO')
      && [input.sueldo_semanal, input.lugar_trabajo, input.antiguedad_laboral].some(tieneValor)
    ) {
      throw new BadRequestException('Los datos laborales requieren la fuente de ingreso Sueldo');
    }
    if (
      !fuentes.includes('NEGOCIO')
      && [input.tipo_negocio, input.ingreso_libre_semanal_negocio, input.ubicacion_negocio]
        .some(tieneValor)
    ) {
      throw new BadRequestException('Los datos del negocio requieren la fuente de ingreso Negocio');
    }
    if (input.tiene_control_pagos !== false && tieneValor(input.motivo_sin_control_pagos)) {
      throw new BadRequestException('El motivo del control de pagos requiere una respuesta negativa');
    }
  }

  private async validarIntegrantesRelacionadas(
    manager: EntityManager,
    expedienteId: string,
    input: GuardarEntrevistaDto,
  ): Promise<void> {
    const ids = Array.from(new Set([
      input.tesorera_reconocida_integrante_id,
      input.domicilio_recoleccion_integrante_id,
      ...(input.familiares_grupo_ids ?? []),
      ...(input.desacuerdos_montos ?? []).map((item) => item.integrante_id),
    ].filter((id): id is string => Boolean(id))));
    if (ids.length === 0) return;
    const relacionadas = await manager.getRepository(IntegranteEntity).find({
      select: { id: true },
      where: { expediente_id: expedienteId, id: In(ids) },
    });
    if (relacionadas.length !== ids.length) {
      throw new BadRequestException('Una integrante seleccionada no pertenece al expediente de la entrevista');
    }
  }

  private mapearEntrevista(input: GuardarEntrevistaDto): Partial<VerificacionEntrevistaEntity> {
    return {
      conoce_asesora: input.conoce_asesora ?? null,
      como_conocio_asesora: textoONull(input.como_conocio_asesora),
      conoce_integrantes: input.conoce_integrantes ?? null,
      tiempo_conoce_integrantes: textoONull(input.tiempo_conoce_integrantes),
      sabe_montos_companeras: input.sabe_montos_companeras ?? null,
      acuerdo_montos_companeras: input.acuerdo_montos_companeras ?? null,
      conoce_tesorera: input.conoce_tesorera ?? null,
      tesorera_reconocida_integrante_id: input.tesorera_reconocida_integrante_id ?? null,
      domicilio_recoleccion_integrante_id: input.domicilio_recoleccion_integrante_id ?? null,
      desconoce_domicilio_recoleccion: input.desconoce_domicilio_recoleccion ?? null,
      tiene_familiares_grupo: input.tiene_familiares_grupo ?? null,
      tiene_otro_credito_grupal: input.tiene_otro_credito_grupal ?? null,
      financiera_credito_grupal: textoONull(input.financiera_credito_grupal),
      credito_grupal_anterior_activo: input.credito_grupal_anterior_activo ?? null,
      valor_ficha_credito_grupal: numeroONull(input.valor_ficha_credito_grupal),
      semana_actual_credito_grupal: numeroONull(input.semana_actual_credito_grupal),
      mes_desembolso_credito_grupal: numeroONull(input.mes_desembolso_credito_grupal),
      mes_ultimo_pago_credito_grupal: numeroONull(input.mes_ultimo_pago_credito_grupal),
      anio_ultimo_pago_credito_grupal: numeroONull(input.anio_ultimo_pago_credito_grupal),
      numero_ciclos_credito_grupal: numeroONull(input.numero_ciclos_credito_grupal),
      tasa_credito_grupal: numeroONull(input.tasa_credito_grupal),
      nombre_asesora_credito_grupal: textoONull(input.nombre_asesora_credito_grupal),
      telefono_asesora_credito_grupal: textoONull(input.telefono_asesora_credito_grupal),
      motivo_no_renovacion_credito_grupal: textoONull(input.motivo_no_renovacion_credito_grupal),
      vive_en_domicilio: input.vive_en_domicilio ?? null,
      motivo_no_vive_domicilio: textoONull(input.motivo_no_vive_domicilio),
      tipo_domicilio: textoONull(input.tipo_domicilio),
      familiar_domicilio: textoONull(input.familiar_domicilio),
      antiguedad_domicilio: textoONull(input.antiguedad_domicilio),
      personas_viven_casa: textoONull(input.personas_viven_casa),
      convivientes: input.convivientes ?? [],
      saben_del_credito: input.saben_del_credito ?? null,
      otro_ingreso_hogar: input.otro_ingreso_hogar ?? null,
      otro_ingreso_semanal: numeroONull(input.otro_ingreso_semanal),
      capacidad_pago_semanal: numeroONull(input.capacidad_pago_semanal),
      uso_credito: textoONull(input.uso_credito),
      fuentes_ingreso: input.fuentes_ingreso ?? [],
      sueldo_semanal: numeroONull(input.sueldo_semanal),
      lugar_trabajo: textoONull(input.lugar_trabajo),
      antiguedad_laboral: textoONull(input.antiguedad_laboral),
      tipo_negocio: textoONull(input.tipo_negocio),
      ingreso_libre_semanal_negocio: numeroONull(input.ingreso_libre_semanal_negocio),
      ubicacion_negocio: textoONull(input.ubicacion_negocio),
      tiene_control_pagos: input.tiene_control_pagos ?? null,
      motivo_sin_control_pagos: textoONull(input.motivo_sin_control_pagos),
      asesora_acudio_semanalmente: textoONull(input.asesora_acudio_semanalmente),
      firmaban_control_semanalmente: textoONull(input.firmaban_control_semanalmente),
      trato_asesora_tesorera: textoONull(input.trato_asesora_tesorera),
      conoce_premio_tesorera: input.conoce_premio_tesorera ?? null,
      opinion_credito: textoONull(input.opinion_credito),
      trato_desembolso: textoONull(input.trato_desembolso),
      rapidez_desembolso: textoONull(input.rapidez_desembolso),
      informacion_credito_clara: input.informacion_credito_clara ?? null,
      recomendaria: input.recomendaria ?? null,
      motivo_recomendacion: textoONull(input.motivo_recomendacion),
      oportunidad_mejora: textoONull(input.oportunidad_mejora),
    };
  }

  private entrevistaCoincideConInput(
    presentada: Record<string, unknown>,
    input: GuardarEntrevistaDto,
  ): boolean {
    const esperada = this.mapearEntrevista(input) as Record<string, unknown>;
    const escalaresCoinciden = Object.entries(esperada).every(([campo, valor]) => (
      this.valoresEntrevistaEquivalentes(presentada[campo], valor)
    ));
    if (!escalaresCoinciden) return false;

    const familiaresActuales = [...((presentada.familiares_grupo_ids as string[] | undefined) ?? [])]
      .sort();
    const familiaresEsperados = [...(input.familiares_grupo_ids ?? [])].sort();
    if (JSON.stringify(familiaresActuales) !== JSON.stringify(familiaresEsperados)) return false;

    const ordenarDesacuerdos = (items: Array<{ integrante_id: string; motivo: string }>) => (
      [...items].sort((left, right) => (
        `${left.integrante_id}:${left.motivo}`.localeCompare(`${right.integrante_id}:${right.motivo}`)
      ))
    );
    const desacuerdosActuales = ordenarDesacuerdos(
      (presentada.desacuerdos_montos as Array<{ integrante_id: string; motivo: string }> | undefined) ?? [],
    );
    const desacuerdosEsperados = ordenarDesacuerdos(input.desacuerdos_montos ?? []);
    return JSON.stringify(desacuerdosActuales) === JSON.stringify(desacuerdosEsperados);
  }

  private valoresEntrevistaEquivalentes(actual: unknown, esperado: unknown): boolean {
    if (Array.isArray(actual) && Array.isArray(esperado)) {
      return JSON.stringify([...actual].sort()) === JSON.stringify([...esperado].sort());
    }
    if (typeof esperado === 'number') return Number(actual) === esperado;
    return actual === esperado;
  }

  private async registrarHistorialFamiliares(
    repository: Repository<VerificacionEntrevistaFamiliarEntity>,
    entrevista: VerificacionEntrevistaEntity,
    deseados: string[],
    usuarioId: string,
  ): Promise<boolean> {
    const actuales = this.ultimosFamiliares(await repository.find({
      where: { entrevista_id: entrevista.id },
      order: { created_at: 'DESC', id: 'DESC' },
    }));
    const objetivo = new Set(deseados);
    const ids = new Set([...actuales.keys(), ...objetivo]);
    const eventos: VerificacionEntrevistaFamiliarEntity[] = [];
    ids.forEach((id) => {
      const activo = objetivo.has(id);
      if ((actuales.get(id)?.activo ?? false) === activo) return;
      eventos.push(repository.create({
        entrevista_id: entrevista.id,
        expediente_id: entrevista.expediente_id,
        familiar_integrante_id: id,
        activo,
        registrada_por: usuarioId,
      }));
    });
    if (eventos.length > 0) await repository.save(eventos);
    return eventos.length > 0;
  }

  private async registrarHistorialDesacuerdos(
    repository: Repository<VerificacionEntrevistaDesacuerdoMontoEntity>,
    entrevista: VerificacionEntrevistaEntity,
    deseados: Array<{ integrante_id: string; motivo: string }>,
    usuarioId: string,
  ): Promise<boolean> {
    const actuales = this.ultimosDesacuerdos(await repository.find({
      where: { entrevista_id: entrevista.id },
      order: { created_at: 'DESC', id: 'DESC' },
    }));
    const objetivo = new Map(deseados.map((item) => [item.integrante_id, item.motivo.trim()]));
    const ids = new Set([...actuales.keys(), ...objetivo.keys()]);
    const eventos: VerificacionEntrevistaDesacuerdoMontoEntity[] = [];
    ids.forEach((id) => {
      const motivo = objetivo.get(id) ?? null;
      const actual = actuales.get(id);
      const activo = motivo != null;
      if ((actual?.activo ?? false) === activo && (actual?.motivo ?? null) === motivo) return;
      eventos.push(repository.create({
        entrevista_id: entrevista.id,
        expediente_id: entrevista.expediente_id,
        integrante_objetivo_id: id,
        motivo,
        activo,
        registrada_por: usuarioId,
      }));
    });
    if (eventos.length > 0) await repository.save(eventos);
    return eventos.length > 0;
  }

  private ultimosFamiliares(
    filas: VerificacionEntrevistaFamiliarEntity[],
  ): Map<string, VerificacionEntrevistaFamiliarEntity> {
    const mapa = new Map<string, VerificacionEntrevistaFamiliarEntity>();
    filas.forEach((fila) => {
      if (!mapa.has(fila.familiar_integrante_id)) mapa.set(fila.familiar_integrante_id, fila);
    });
    return mapa;
  }

  private ultimosDesacuerdos(
    filas: VerificacionEntrevistaDesacuerdoMontoEntity[],
  ): Map<string, VerificacionEntrevistaDesacuerdoMontoEntity> {
    const mapa = new Map<string, VerificacionEntrevistaDesacuerdoMontoEntity>();
    filas.forEach((fila) => {
      if (!mapa.has(fila.integrante_objetivo_id)) mapa.set(fila.integrante_objetivo_id, fila);
    });
    return mapa;
  }

  private async presentarEntrevista(
    entrevista: VerificacionEntrevistaEntity,
    familiarRepository: Repository<VerificacionEntrevistaFamiliarEntity>,
    desacuerdoRepository: Repository<VerificacionEntrevistaDesacuerdoMontoEntity>,
  ): Promise<Record<string, unknown>> {
    const [familiaresHistorial, desacuerdosHistorial] = await Promise.all([
      familiarRepository.find({
        where: { entrevista_id: entrevista.id },
        order: { created_at: 'DESC', id: 'DESC' },
      }),
      desacuerdoRepository.find({
        where: { entrevista_id: entrevista.id },
        order: { created_at: 'DESC', id: 'DESC' },
      }),
    ]);
    const familiares = Array.from(this.ultimosFamiliares(familiaresHistorial).values())
      .filter((fila) => fila.activo)
      .map((fila) => fila.familiar_integrante_id);
    const desacuerdos = Array.from(this.ultimosDesacuerdos(desacuerdosHistorial).values())
      .filter((fila) => fila.activo)
      .map((fila) => ({ integrante_id: fila.integrante_objetivo_id, motivo: fila.motivo }));

    const presentada: Record<string, unknown> = { ...entrevista };
    delete presentada.expediente_id;
    delete presentada.entrevistada_por;
    delete presentada.actualizada_por;
    return {
      ...presentada,
      valor_ficha_credito_grupal: numeroPresentado(entrevista.valor_ficha_credito_grupal),
      otro_ingreso_semanal: numeroPresentado(entrevista.otro_ingreso_semanal),
      capacidad_pago_semanal: numeroPresentado(entrevista.capacidad_pago_semanal),
      sueldo_semanal: numeroPresentado(entrevista.sueldo_semanal),
      ingreso_libre_semanal_negocio: numeroPresentado(entrevista.ingreso_libre_semanal_negocio),
      familiares_grupo_ids: familiares,
      desacuerdos_montos: desacuerdos,
    };
  }

  private obtenerCamposModificados(
    anterior: VerificacionEntrevistaEntity | null,
    actual: VerificacionEntrevistaEntity,
  ): string[] {
    if (!anterior) return ['entrevista_creada'];
    const ignorados = new Set([
      'id', 'expediente_id', 'integrante_id', 'entrevistada_por', 'actualizada_por',
      'revision', 'created_at', 'updated_at',
    ]);
    return Object.keys(actual).filter((campo) => (
      !ignorados.has(campo)
      && JSON.stringify(anterior[campo as keyof VerificacionEntrevistaEntity])
        !== JSON.stringify(actual[campo as keyof VerificacionEntrevistaEntity])
    ));
  }

  private async obtenerEvidenciasGuardadas(
    integranteId: string,
    tipo?: TipoEvidenciaEntrevista,
  ): Promise<EvidenciaEntrevistaPresentada[]> {
    const evidencias = await this.evidenciaRepository.find({
      where: tipo ? { integrante_id: integranteId, tipo } : { integrante_id: integranteId },
      order: { created_at: 'ASC', id: 'ASC' },
    });
    return evidencias.map((evidencia) => this.presentarEvidencia(evidencia));
  }

  private presentarEvidencia(
    evidencia: VerificacionEntrevistaEvidenciaEntity,
  ): EvidenciaEntrevistaPresentada {
    return {
      id: evidencia.id,
      tipo: evidencia.tipo,
      archivo_url: evidencia.ruta,
      mime_type: evidencia.mime_type,
      foto_capturada_at: evidencia.foto_capturada_at,
      registrada_at: evidencia.created_at,
    };
  }
}
