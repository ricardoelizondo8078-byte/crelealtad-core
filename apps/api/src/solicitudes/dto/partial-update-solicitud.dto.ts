import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSolicitudDto } from './create-solicitud.dto';

/**
 * DTO para PATCH /solicitudes/:integranteId
 *
 * ARQUITECTURA:
 * - Los 4 campos requeridos (integrante_id, persona_id, expediente_id, grupo_id)
 *   NO se requieren en el PATCH porque el backend los deriva del integranteId del path.
 * - Todos los 87 campos de las tablas hijas son opcionales como en CreateSolicitudDto.
 * - El servicio reconstruye el DTO completo antes de llamar a createOrUpdateForSolicitante.
 */
export class PartialUpdateSolicitudDto extends PartialType(
  OmitType(CreateSolicitudDto, ['integrante_id', 'persona_id', 'expediente_id', 'grupo_id'] as const)
) {}
