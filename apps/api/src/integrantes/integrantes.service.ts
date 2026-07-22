import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegranteEntity, IntegranteEstado } from './integrante.entity';
import { PersonaEntity } from '../personas/persona.entity';

@Injectable()
export class IntegrantesService {
  constructor(
    @InjectRepository(IntegranteEntity)
    private readonly integranteRepository: Repository<IntegranteEntity>,
    @InjectRepository(PersonaEntity)
    private readonly personaRepository: Repository<PersonaEntity>,
  ) {}

  async listByExpediente(expedienteId: string): Promise<any[]> {
    try {
      // Consulta simple sin relations ni JOIN
      const integrantes = await this.integranteRepository.find({
        where: { expediente_id: expedienteId },
      });

      const result = await Promise.all(
        integrantes.map(async (integrante) => {
          let nombre = '';
          let telefono = null;
          let montoSolicitado = 0;

          // Buscar persona asociada para obtener el nombre, telefono y monto
          if (integrante.persona_id) {
            const persona = await this.personaRepository.findOne({
              where: { id: integrante.persona_id },
            });

            if (persona) {
              nombre = `${persona.primer_nombre} ${persona.apellido_pat} ${persona.apellido_mat || ''}`.trim();
              telefono = persona.telefono ?? null;
              montoSolicitado = persona.monto_solicitado ?? 0;
            }
          }

          return {
            id: integrante.id,
            expediente_id: integrante.expediente_id,
            persona_id: integrante.persona_id,
            estado: integrante.estado,
            created_at: integrante.created_at,
            updated_at: integrante.updated_at,
            nombre,
            telefono,
            montoSolicitado,
          };
        })
      );

      return result;
    } catch (error) {
      console.error('Error en listByExpediente:', error);
      // Devuelve array vacío en lugar de 500
      return [];
    }
  }

  async getById(id: string): Promise<any> {
    try {
      const integrante = await this.integranteRepository.findOne({
        where: { id },
      });

      if (!integrante) {
        return null;
      }

      let personaData: any = {
        nombre: '',
        telefono: null,
        montoSolicitado: 0,
      };

      if (integrante.persona_id) {
        const persona = await this.personaRepository.findOne({
          where: { id: integrante.persona_id },
        });
        if (persona) {
          personaData = {
            nombres: persona.primer_nombre,
            apellido_pat: persona.apellido_pat,
            apellido_mat: persona.apellido_mat,
            nombre: `${persona.primer_nombre} ${persona.apellido_pat} ${persona.apellido_mat ?? ''}`.trim(),
            telefono: persona.telefono ?? null,
            montoSolicitado: persona.monto_solicitado ?? 0,
          };
        }
      }

      return {
        id: integrante.id,
        expediente_id: integrante.expediente_id,
        persona_id: integrante.persona_id,
        estado: integrante.estado,
        created_at: integrante.created_at,
        updated_at: integrante.updated_at,
        ...personaData,
      };
    } catch (error) {
      console.error('Error en getById:', error);
      return null;
    }
  }

  async createForExpediente(dto: {
    expedienteId?: string;
    expediente_id?: string;
    nombre?: string;
    nombres?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    telefono?: string;
    montoSolicitado?: number;
    persona_id?: string;
  }): Promise<any> {
    try {
      const expediente_id = dto.expediente_id ?? dto.expedienteId;

      if (!expediente_id) {
        throw new Error('expediente_id o expedienteId es requerido');
      }

      let persona_id = dto.persona_id;

      // Crear persona si se proporcionan datos
      if (!persona_id && (dto.nombres || dto.nombre)) {
        const nombreCompleto = dto.nombre ||
          `${dto.nombres ?? ''} ${dto.apellidoPaterno ?? ''} ${dto.apellidoMaterno ?? ''}`.trim();

        const partesNombre = nombreCompleto.split(' ');
        const nombres = dto.nombres || partesNombre[0] || '';
        const apellido_pat = dto.apellidoPaterno?.trim().toUpperCase() ?? '';
        const apellido_mat = dto.apellidoMaterno?.trim().toUpperCase() ?? '';

        const persona = this.personaRepository.create({
          primer_nombre: nombres,
          apellido_pat: apellido_pat,
          apellido_mat: apellido_mat,
          telefono: dto.telefono ?? null,
          monto_solicitado: dto.montoSolicitado ?? null,
        });

        const personaGuardada = await this.personaRepository.save(persona);
        persona_id = personaGuardada.id;
      }

      const integrante = this.integranteRepository.create({
        expediente_id,
        persona_id,
        estado: IntegranteEstado.DOCUMENTANDO,
      });

      const integranteSaved = await this.integranteRepository.save(integrante);

      // Devolver con campos adicionales para el frontend
      return {
        id: integranteSaved.id,
        nombre: dto.nombre || `${dto.nombres ?? ''} ${dto.apellidoPaterno ?? ''} ${dto.apellidoMaterno ?? ''}`.trim(),
        telefono: dto.telefono || '',
        montoSolicitado: dto.montoSolicitado || 0,
        estado: integranteSaved.estado,
        expediente_id: integranteSaved.expediente_id,
      };
    } catch (error) {
      console.error('Error completo en createForExpediente:', error);
      throw new Error(`Error al crear integrante: ${error.message}`);
    }
  }

  async updateEstadoManual(id: string, estado: IntegranteEstado): Promise<IntegranteEntity> {
    try {
      const integrante = await this.integranteRepository.findOne({
        where: { id },
      });

      if (!integrante) {
        throw new Error(`Integrante con ID ${id} no encontrado`);
      }

      const estadosPermitidos = [
        IntegranteEstado.EN_VERIFICACION,
        IntegranteEstado.AUTORIZADA,
        IntegranteEstado.RECHAZADA,
        IntegranteEstado.SUJETA_CREDITO,
      ];

      if (!estadosPermitidos.includes(estado)) {
        throw new Error(`Solo se permiten cambios manuales a: ${estadosPermitidos.join(', ')}`);
      }

      integrante.estado = estado;
      return this.integranteRepository.save(integrante);
    } catch (error) {
      console.error('Error en updateEstadoManual:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<IntegranteEntity>): Promise<IntegranteEntity> {
    try {
      const integrante = await this.integranteRepository.findOne({
        where: { id },
      });

      if (!integrante) {
        throw new Error(`Integrante con ID ${id} no encontrado`);
      }

      const camposPermitidos = ['persona_id'];

      camposPermitidos.forEach((campo) => {
        if (data[campo as keyof IntegranteEntity] !== undefined) {
          (integrante as any)[campo] = data[campo as keyof IntegranteEntity];
        }
      });

      return this.integranteRepository.save(integrante);
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }
}
