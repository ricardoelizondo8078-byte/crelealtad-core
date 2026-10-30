import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { registrarAuditoria } from '../common/audit-log';
import { Usuario } from '../catalogos/entities/usuario.entity';
import { exigirAdministradorParametros } from '../parametros-financieras/parametros-financieras.policy';
import { ActualizarMatrizVerificacionDto } from './dto/actualizar-matriz-verificacion.dto';
import {
  PASOS_VERIFICACION,
  TIPOS_INTEGRANTE_VERIFICACION,
  type MatrizPasosVerificacion,
  type ReglaPasoVerificacion,
  type TipoIntegranteVerificacion,
} from './parametros-verificacion-pasos.types';

type VersionRow = {
  version_id: string;
  revision: number;
  publicada_at: Date | string;
};

@Injectable()
export class ParametrosVerificacionPasosService {
  constructor(private readonly dataSource: DataSource) {}

  async obtenerMatrizVigente(): Promise<MatrizPasosVerificacion> {
    return this.obtenerMatrizCon(this.dataSource);
  }

  async obtenerReglasParaTipo(
    tipoIntegrante: TipoIntegranteVerificacion,
  ): Promise<ReglaPasoVerificacion[]> {
    const matriz = await this.obtenerMatrizVigente();
    return matriz.reglas.filter((regla) => regla.tipo_integrante === tipoIntegrante);
  }

  async actualizarMatriz(
    dto: ActualizarMatrizVerificacionDto,
    usuario: Usuario,
  ): Promise<{ matriz: MatrizPasosVerificacion }> {
    exigirAdministradorParametros(usuario);
    this.validarMatrizCompleta(dto.reglas);

    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT pg_advisory_xact_lock(hashtext('parametros_verificacion_pasos'))`,
      );
      const actual = await this.obtenerMatrizCon(manager, true);
      if (actual.revision !== dto.expected_revision) {
        throw new ConflictException(
          'La matriz cambió mientras estaba abierta. Actualiza la pantalla antes de publicar.',
        );
      }

      const reglasOrdenadas = this.ordenarReglas(dto.reglas);
      const actualesOrdenadas = this.ordenarReglas(actual.reglas);
      if (JSON.stringify(reglasOrdenadas) === JSON.stringify(actualesOrdenadas)) {
        return { matriz: actual };
      }

      const versionRows = await manager.query(
        `INSERT INTO parametros_verificacion_pasos_versiones (revision, publicada_por)
         VALUES ($1, $2)
         RETURNING id AS version_id, revision, publicada_at`,
        [actual.revision + 1, usuario.id],
      ) as VersionRow[];
      const version = versionRows[0];
      if (!version) throw new ConflictException('No fue posible publicar la matriz');

      for (const regla of reglasOrdenadas) {
        await manager.query(
          `INSERT INTO parametros_verificacion_pasos_reglas
             (version_id, tipo_integrante, paso, obligatorio, modalidad, dias_para_obligatorio)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            version.version_id,
            regla.tipo_integrante,
            regla.paso,
            regla.modalidad === 'OBLIGATORIO',
            regla.modalidad,
            regla.modalidad === 'OBLIGATORIO_DESPUES_DIAS'
              ? regla.dias_para_obligatorio
              : null,
          ],
        );
      }

      const matriz: MatrizPasosVerificacion = {
        version_id: version.version_id,
        revision: version.revision,
        publicada_at: new Date(version.publicada_at).toISOString(),
        reglas: reglasOrdenadas,
      };

      await registrarAuditoria(manager, {
        tabla: 'parametros_verificacion_pasos_versiones',
        registroId: version.version_id,
        accion: 'PAR_VER_PASOS_PUBLICAR',
        usuarioId: usuario.id,
        datosAntes: { revision: actual.revision, reglas: actualesOrdenadas },
        datosDespues: { revision: matriz.revision, reglas: matriz.reglas },
      });

      return { matriz };
    });
  }

  private async obtenerMatrizCon(
    executor: Pick<DataSource, 'query'> | { query: DataSource['query'] },
    bloquear = false,
  ): Promise<MatrizPasosVerificacion> {
    const versions = await executor.query(
      `SELECT id AS version_id, revision, publicada_at
         FROM parametros_verificacion_pasos_versiones
        ORDER BY revision DESC
        LIMIT 1${bloquear ? ' FOR UPDATE' : ''}`,
    ) as VersionRow[];
    const version = versions[0];
    if (!version) {
      throw new NotFoundException('La matriz de pasos de Verificación no está configurada');
    }

    const reglas = await executor.query(
      `SELECT tipo_integrante, paso, modalidad, dias_para_obligatorio
         FROM parametros_verificacion_pasos_reglas
        WHERE version_id = $1
        ORDER BY tipo_integrante, paso`,
      [version.version_id],
    ) as ReglaPasoVerificacion[];
    this.validarMatrizCompleta(reglas);

    return {
      version_id: version.version_id,
      revision: Number(version.revision),
      publicada_at: new Date(version.publicada_at).toISOString(),
      reglas: this.ordenarReglas(reglas),
    };
  }

  private validarMatrizCompleta(reglas: readonly ReglaPasoVerificacion[]): void {
    const esperadas = new Set(
      TIPOS_INTEGRANTE_VERIFICACION.flatMap((tipo) => (
        PASOS_VERIFICACION.map((paso) => `${tipo}:${paso}`)
      )),
    );
    const recibidas = new Set(reglas.map((regla) => `${regla.tipo_integrante}:${regla.paso}`));
    if (recibidas.size !== esperadas.size || [...esperadas].some((clave) => !recibidas.has(clave))) {
      throw new BadRequestException(
        'La publicación debe incluir una decisión para cada paso de los cuatro tipos de integrante',
      );
    }

    const reglaInvalida = reglas.find((regla) => (
      regla.modalidad === 'OBLIGATORIO_DESPUES_DIAS'
        ? !Number.isInteger(regla.dias_para_obligatorio)
          || Number(regla.dias_para_obligatorio) < 1
          || Number(regla.dias_para_obligatorio) > 3650
        : regla.dias_para_obligatorio !== null
    ));
    if (reglaInvalida) {
      throw new BadRequestException(
        'Los días son obligatorios sólo para la modalidad condicional y deben estar entre 1 y 3650',
      );
    }
  }

  private ordenarReglas<T extends ReglaPasoVerificacion>(reglas: readonly T[]): T[] {
    return [...reglas].sort((a, b) => (
      TIPOS_INTEGRANTE_VERIFICACION.indexOf(a.tipo_integrante)
      - TIPOS_INTEGRANTE_VERIFICACION.indexOf(b.tipo_integrante)
      || PASOS_VERIFICACION.indexOf(a.paso) - PASOS_VERIFICACION.indexOf(b.paso)
    ));
  }
}
