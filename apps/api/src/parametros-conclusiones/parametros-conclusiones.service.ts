import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { registrarAuditoria } from '../common/audit-log';
import { exigirAdministradorParametros } from '../parametros-financieras/parametros-financieras.policy';
import { ActualizarCiclosCreditoDto } from './dto/actualizar-ciclos-credito.dto';
import { ActualizarSemanaCreditoDto } from './dto/actualizar-semana-credito.dto';
import { ActualizarToleranciaSemanaDesembolsoDto } from './dto/actualizar-tolerancia-semana-desembolso.dto';
import { ActualizarConcordanciaPorcentajeDto } from './dto/actualizar-concordancia-porcentaje.dto';
import {
  ParametroConclusionesCiclosCredito,
  ParametroConclusionesConcordanciaFicha,
  ParametroConclusionesConcordanciaPrestamo,
  ParametroConclusionesPromedioEvidencias,
  ParametroConclusionesSemanaCredito,
  ParametroConclusionesToleranciaSemanaDesembolso,
} from './parametros-conclusiones.types';

const SELECT_SEMANA_CREDITO = `
  SELECT id, audit_id, verde_desde, verde_hasta, amarillo_desde, amarillo_hasta,
         rojo_desde, rojo_hasta, updated_at
  FROM parametros_conclusiones_semana_credito
  WHERE id = 1`;

const SELECT_CICLOS_CREDITO = `
  SELECT id, audit_id, verde_desde, verde_hasta, amarillo_desde, amarillo_hasta,
         rojo_desde, rojo_hasta, updated_at
  FROM parametros_conclusiones_ciclos_credito
  WHERE id = 1`;

const SELECT_TOLERANCIA_SEMANA_DESEMBOLSO = `
  SELECT id, audit_id, verde_desde, verde_hasta, amarillo_desde, amarillo_hasta,
         rojo_desde, rojo_hasta, updated_at
  FROM parametros_conclusiones_tolerancia_semana_desembolso
  WHERE id = 1`;

const SELECT_CONCORDANCIA_FICHA = `
  SELECT id, audit_id, verde_desde, verde_hasta, amarillo_desde, amarillo_hasta,
         rojo_desde, rojo_hasta, updated_at
  FROM parametros_conclusiones_concordancia_ficha
  WHERE id = 1`;

const SELECT_CONCORDANCIA_PRESTAMO = `
  SELECT id, audit_id, verde_desde, verde_hasta, amarillo_desde, amarillo_hasta,
         rojo_desde, rojo_hasta, updated_at
  FROM parametros_conclusiones_concordancia_prestamo
  WHERE id = 1`;

const SELECT_PROMEDIO_EVIDENCIAS = `
  SELECT id, audit_id, verde_desde, verde_hasta, amarillo_desde, amarillo_hasta,
         rojo_desde, rojo_hasta, updated_at
  FROM parametros_conclusiones_promedio_evidencias
  WHERE id = 1`;

interface RangoConclusionesDto {
  verde_desde: number;
  verde_hasta: number;
  amarillo_desde: number;
  amarillo_hasta: number;
  rojo_desde: number;
  rojo_hasta: number;
}

interface ConfiguracionParametroRangos {
  tabla:
    | 'parametros_conclusiones_semana_credito'
    | 'parametros_conclusiones_ciclos_credito'
    | 'parametros_conclusiones_tolerancia_semana_desembolso'
    | 'parametros_conclusiones_concordancia_ficha'
    | 'parametros_conclusiones_concordancia_prestamo'
    | 'parametros_conclusiones_promedio_evidencias';
  tablaAuditoria:
    | 'parametros_conclusiones_semana_credito'
    | 'parametros_conclusiones_ciclos_credito'
    | 'param_conclusiones_tolerancia_desembolso'
    | 'parametros_conclusiones_concordancia_ficha'
    | 'parametros_conclusiones_concordancia_prestamo'
    | 'parametros_conclusiones_promedio_evidencias';
  select: string;
  etiqueta: string;
  accionAuditoria:
    | 'PAR_CON_SEMANA'
    | 'PAR_CON_CICLOS'
    | 'PAR_TOL_DESEMBOLSO'
    | 'PAR_CON_FICHA'
    | 'PAR_CON_PRESTAMO'
    | 'PAR_PROM_EVIDENCIAS';
}

const extraerFilasMutacion = <T>(resultado: unknown): T[] => {
  if (!Array.isArray(resultado)) return [];
  return Array.isArray(resultado[0]) ? resultado[0] as T[] : resultado as T[];
};

const noSeTraslapan = (
  desdeA: number,
  hastaA: number,
  desdeB: number,
  hastaB: number,
): boolean => hastaA < desdeB || hastaB < desdeA;

const sonRangosValidosSinTraslapes = (dto: RangoConclusionesDto): boolean => (
  dto.verde_desde <= dto.verde_hasta
  && dto.amarillo_desde <= dto.amarillo_hasta
  && dto.rojo_desde <= dto.rojo_hasta
  && noSeTraslapan(
    dto.verde_desde,
    dto.verde_hasta,
    dto.amarillo_desde,
    dto.amarillo_hasta,
  )
  && noSeTraslapan(
    dto.verde_desde,
    dto.verde_hasta,
    dto.rojo_desde,
    dto.rojo_hasta,
  )
  && noSeTraslapan(
    dto.amarillo_desde,
    dto.amarillo_hasta,
    dto.rojo_desde,
    dto.rojo_hasta,
  )
);

const datosAuditoria = (
  parametro: ParametroConclusionesSemanaCredito,
): Record<string, unknown> => ({
  id: parametro.id,
  verde_desde: parametro.verde_desde,
  verde_hasta: parametro.verde_hasta,
  amarillo_desde: parametro.amarillo_desde,
  amarillo_hasta: parametro.amarillo_hasta,
  rojo_desde: parametro.rojo_desde,
  rojo_hasta: parametro.rojo_hasta,
  updated_at: parametro.updated_at,
});

@Injectable()
export class ParametrosConclusionesService {
  constructor(private readonly dataSource: DataSource) {}

  async obtenerSemanaCredito(): Promise<{ parametro: ParametroConclusionesSemanaCredito }> {
    return this.obtenerParametro<ParametroConclusionesSemanaCredito>(
      SELECT_SEMANA_CREDITO,
      'semana',
    );
  }

  async obtenerCiclosCredito(): Promise<{ parametro: ParametroConclusionesCiclosCredito }> {
    return this.obtenerParametro<ParametroConclusionesCiclosCredito>(
      SELECT_CICLOS_CREDITO,
      'número de ciclos',
    );
  }

  async obtenerToleranciaSemanaDesembolso(): Promise<{
    parametro: ParametroConclusionesToleranciaSemanaDesembolso;
  }> {
    return this.obtenerParametro<ParametroConclusionesToleranciaSemanaDesembolso>(
      SELECT_TOLERANCIA_SEMANA_DESEMBOLSO,
      'tolerancia de semana de desembolso',
    );
  }

  async obtenerConcordanciaFicha(): Promise<{
    parametro: ParametroConclusionesConcordanciaFicha;
  }> {
    return this.obtenerParametro<ParametroConclusionesConcordanciaFicha>(
      SELECT_CONCORDANCIA_FICHA,
      'concordancia en ficha',
    );
  }

  async obtenerConcordanciaPrestamo(): Promise<{
    parametro: ParametroConclusionesConcordanciaPrestamo;
  }> {
    return this.obtenerParametro<ParametroConclusionesConcordanciaPrestamo>(
      SELECT_CONCORDANCIA_PRESTAMO,
      'concordancia en préstamo',
    );
  }

  async obtenerPromedioEvidencias(): Promise<{
    parametro: ParametroConclusionesPromedioEvidencias;
  }> {
    return this.obtenerParametro<ParametroConclusionesPromedioEvidencias>(
      SELECT_PROMEDIO_EVIDENCIAS,
      'promedio de fotografías',
    );
  }

  async actualizarSemanaCredito(
    dto: ActualizarSemanaCreditoDto,
    usuario: Usuario,
  ): Promise<{ parametro: ParametroConclusionesSemanaCredito }> {
    return this.actualizarParametro(dto, usuario, {
      tabla: 'parametros_conclusiones_semana_credito',
      tablaAuditoria: 'parametros_conclusiones_semana_credito',
      select: SELECT_SEMANA_CREDITO,
      etiqueta: 'semana',
      accionAuditoria: 'PAR_CON_SEMANA',
    });
  }

  async actualizarCiclosCredito(
    dto: ActualizarCiclosCreditoDto,
    usuario: Usuario,
  ): Promise<{ parametro: ParametroConclusionesCiclosCredito }> {
    return this.actualizarParametro(dto, usuario, {
      tabla: 'parametros_conclusiones_ciclos_credito',
      tablaAuditoria: 'parametros_conclusiones_ciclos_credito',
      select: SELECT_CICLOS_CREDITO,
      etiqueta: 'número de ciclos',
      accionAuditoria: 'PAR_CON_CICLOS',
    });
  }

  async actualizarToleranciaSemanaDesembolso(
    dto: ActualizarToleranciaSemanaDesembolsoDto,
    usuario: Usuario,
  ): Promise<{ parametro: ParametroConclusionesToleranciaSemanaDesembolso }> {
    return this.actualizarParametro(dto, usuario, {
      tabla: 'parametros_conclusiones_tolerancia_semana_desembolso',
      tablaAuditoria: 'param_conclusiones_tolerancia_desembolso',
      select: SELECT_TOLERANCIA_SEMANA_DESEMBOLSO,
      etiqueta: 'tolerancia de semana de desembolso',
      accionAuditoria: 'PAR_TOL_DESEMBOLSO',
    });
  }

  async actualizarConcordanciaFicha(
    dto: ActualizarConcordanciaPorcentajeDto,
    usuario: Usuario,
  ): Promise<{ parametro: ParametroConclusionesConcordanciaFicha }> {
    return this.actualizarParametro(dto, usuario, {
      tabla: 'parametros_conclusiones_concordancia_ficha',
      tablaAuditoria: 'parametros_conclusiones_concordancia_ficha',
      select: SELECT_CONCORDANCIA_FICHA,
      etiqueta: 'porcentaje de concordancia en ficha',
      accionAuditoria: 'PAR_CON_FICHA',
    });
  }

  async actualizarConcordanciaPrestamo(
    dto: ActualizarConcordanciaPorcentajeDto,
    usuario: Usuario,
  ): Promise<{ parametro: ParametroConclusionesConcordanciaPrestamo }> {
    return this.actualizarParametro(dto, usuario, {
      tabla: 'parametros_conclusiones_concordancia_prestamo',
      tablaAuditoria: 'parametros_conclusiones_concordancia_prestamo',
      select: SELECT_CONCORDANCIA_PRESTAMO,
      etiqueta: 'porcentaje de concordancia en préstamo',
      accionAuditoria: 'PAR_CON_PRESTAMO',
    });
  }

  async actualizarPromedioEvidencias(
    dto: ActualizarConcordanciaPorcentajeDto,
    usuario: Usuario,
  ): Promise<{ parametro: ParametroConclusionesPromedioEvidencias }> {
    return this.actualizarParametro(dto, usuario, {
      tabla: 'parametros_conclusiones_promedio_evidencias',
      tablaAuditoria: 'parametros_conclusiones_promedio_evidencias',
      select: SELECT_PROMEDIO_EVIDENCIAS,
      etiqueta: 'promedio de fotografías',
      accionAuditoria: 'PAR_PROM_EVIDENCIAS',
    });
  }

  private async obtenerParametro<T>(
    select: string,
    etiqueta: ConfiguracionParametroRangos['etiqueta'],
  ): Promise<{ parametro: T }> {
    const rows = await this.dataSource.query(select) as T[];
    if (!rows[0]) {
      throw new NotFoundException(`El parámetro de ${etiqueta} del crédito no está configurado`);
    }
    return { parametro: rows[0] };
  }

  private async actualizarParametro<T extends ParametroConclusionesSemanaCredito>(
    dto: RangoConclusionesDto,
    usuario: Usuario,
    config: ConfiguracionParametroRangos,
  ): Promise<{ parametro: T }> {
    exigirAdministradorParametros(usuario);
    if (!sonRangosValidosSinTraslapes(dto)) {
      throw new BadRequestException(
        `Cada rango debe iniciar antes de terminar y un mismo ${config.etiqueta} no puede pertenecer a dos colores`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const anteriores = await manager.query(
        `${config.select} FOR UPDATE`,
      ) as T[];
      const anterior = anteriores[0];
      if (!anterior) {
        throw new NotFoundException(
          `El parámetro de ${config.etiqueta} del crédito no está configurado`,
        );
      }

      const sinCambios = (
        anterior.verde_desde === dto.verde_desde
        && anterior.verde_hasta === dto.verde_hasta
        && anterior.amarillo_desde === dto.amarillo_desde
        && anterior.amarillo_hasta === dto.amarillo_hasta
        && anterior.rojo_desde === dto.rojo_desde
        && anterior.rojo_hasta === dto.rojo_hasta
      );
      if (sinCambios) return { parametro: anterior };

      const actualizadas = extraerFilasMutacion<T>(
        await manager.query(
        `UPDATE ${config.tabla}
         SET verde_desde = $1, verde_hasta = $2,
             amarillo_desde = $3, amarillo_hasta = $4,
             rojo_desde = $5, rojo_hasta = $6,
             updated_by = $7, updated_at = NOW()
         WHERE id = 1
         RETURNING id, audit_id, verde_desde, verde_hasta, amarillo_desde, amarillo_hasta,
                   rojo_desde, rojo_hasta, updated_at`,
        [
          dto.verde_desde,
          dto.verde_hasta,
          dto.amarillo_desde,
          dto.amarillo_hasta,
          dto.rojo_desde,
          dto.rojo_hasta,
          usuario.id,
        ],
      ));
      const parametro = actualizadas[0];
      if (!parametro) {
        throw new NotFoundException(
          `El parámetro de ${config.etiqueta} del crédito no está configurado`,
        );
      }

      await registrarAuditoria(manager, {
        tabla: config.tablaAuditoria,
        registroId: parametro.audit_id,
        accion: config.accionAuditoria,
        usuarioId: usuario.id,
        datosAntes: datosAuditoria(anterior),
        datosDespues: datosAuditoria(parametro),
      });
      return { parametro };
    });
  }
}
