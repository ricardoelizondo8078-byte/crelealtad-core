import { api } from '../../services/api-client';
import type { ClasificacionFinanciera } from './parametros-financieras.model';

export type EstadoPropuestaFinanciera = 'PENDIENTE_APROBACION' | 'APROBADA';

export interface SucursalFinancieraCompetidora {
  orden: number;
  zona: string | null;
  direccion: string | null;
  numero_asesoras: number | null;
  valor_sucursal: string | null;
}

export interface VersionFinancieraResumen {
  id: string;
  revision: number;
  nombre_oficial: string;
  clasificacion: ClasificacionFinanciera | null;
  motivo: string | null;
  aliases: string[];
  activa: boolean;
  vigencia_desde: string;
  vigencia_hasta?: string | null;
  semanas: string | null;
  tasa: string | null;
  seguro: string | null;
  apertura: string | null;
  retencion: string | null;
  base: string | null;
  refinanciamiento: string | null;
  descripcion: string | null;
  sucursales: SucursalFinancieraCompetidora[];
}

export interface PropuestaFinancieraResumen extends VersionFinancieraResumen {
  estado: EstadoPropuestaFinanciera;
  propuesta_at: string;
  decidida_at: string | null;
}

export interface FinancieraCompetidoraResumen {
  id: string;
  nombre: string;
  catalogo_base: boolean;
  created_at: string;
  ultima_revision: number;
  vigente: VersionFinancieraResumen | null;
  programada: VersionFinancieraResumen | null;
  propuesta: PropuestaFinancieraResumen | null;
}

export interface FinancieraCompetidoraVigente {
  id: string;
  nombre: string;
  alias_captura: string;
  clasificacion: ClasificacionFinanciera | null;
  motivo: string | null;
  aliases: string[];
  vigencia_desde: string | null;
  vigencia_hasta: string | null;
  revision: number | null;
}

export interface PublicarCambioFinancieraInput {
  financiera_id?: string;
  nombre?: string;
  clasificacion?: ClasificacionFinanciera | null;
  motivo?: string;
  aliases?: string[];
  activa?: boolean;
  semanas?: string;
  tasa?: string;
  seguro?: string;
  apertura?: string;
  retencion?: string;
  base?: string;
  refinanciamiento?: string;
  descripcion?: string;
  sucursales?: {
    zona?: string;
    direccion?: string;
    numero_asesoras?: number;
    valor_sucursal?: string;
  }[];
  vigencia_desde?: string;
  expected_revision?: number;
}

export interface VersionFinancieraHistorial extends VersionFinancieraResumen {
  estado: 'PENDIENTE_APROBACION' | 'APROBADA' | 'RECHAZADA' | 'PUBLICADA';
  propuesta_por: string;
  propuesta_at: string;
  decidida_por: string | null;
  decidida_at: string | null;
  motivo_rechazo: string | null;
  publicada_por: string | null;
  publicada_at: string | null;
}

export const listarFinancierasCompetidoras = () => api.get<{
  items: FinancieraCompetidoraResumen[];
}>('/parametros/financieras-competidoras');

export const obtenerHistorialFinancieraCompetidora = (financieraId: string) => api.get<{
  financiera: { id: string; nombre: string };
  versiones: VersionFinancieraHistorial[];
}>(`/parametros/financieras-competidoras/${financieraId}/historial`);

export const listarFinancierasCompetidorasVigentes = () => api.get<{
  fecha: string;
  items: FinancieraCompetidoraVigente[];
}>('/verificacion/financieras-competidoras');

export const publicarCambioFinanciera = (input: PublicarCambioFinancieraInput) => api.post(
  '/parametros/financieras-competidoras/publicaciones',
  input,
);
