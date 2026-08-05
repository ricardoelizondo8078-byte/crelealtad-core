import { apiUrl } from '../../../config/api';
import { SolicitudFormData } from '../types/solicitud.types';

class SolicitudService {
  async getByIntegrante(integranteId: string): Promise<SolicitudFormData | null> {
    try {
      const response = await fetch(`${apiUrl}/solicitudes/integrante/${integranteId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No existe solicitud aún
        }
        throw new Error('Error al obtener solicitud');
      }

      const data = await response.json();
      return this.mapServerToForm(data);
    } catch (error) {
      console.error('Error en getByIntegrante:', error);
      return null;
    }
  }

  async partialUpdate(integranteId: string, formData: SolicitudFormData): Promise<void> {
    try {
      const payload = this.mapFormToServer(formData);

      const response = await fetch(`${apiUrl}/solicitudes/${integranteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al guardar solicitud');
      }
    } catch (error) {
      console.error('Error en partialUpdate:', error);
      throw error;
    }
  }

  private mapServerToForm(data: any): SolicitudFormData {
    return {
      // Paso 1
      nombres: data.nombres,
      apellidoPaterno: data.apellido_pat,
      apellidoMaterno: data.apellido_mat,
      curp: data.curp,
      fechaNacimiento: data.fecha_nac,
      nacionalidad: data.nacionalidad,
      estadoNacimiento: data.estado_nacimiento,
      genero: data.genero,
      estadoCivil: data.estado_civil,
      ocupacion: data.ocupacion,
      nivelEstudio: data.nivel_estudio,
      telefono: data.telefono,

      // Paso 2
      domCalle: data.dom_calle,
      domNumExt: data.dom_num_ext,
      domNumInt: data.dom_num_int,
      domEntreCalles: data.dom_entre_calles,
      domCodigoPostal: data.dom_codigo_postal,
      domColonia: data.dom_colonia,
      domMunicipio: data.dom_municipio,
      domEstado: data.dom_estado,
      domTelefono: data.dom_telefono,

      // Paso 3
      referencia1Nombre: data.ref1_nombre,
      referencia1Parentesco: data.ref1_parentesco,
      referencia1Telefono: data.ref1_telefono,
      referencia1Direccion: data.ref1_direccion,
      referencia2Nombre: data.ref2_nombre,
      referencia2Parentesco: data.ref2_parentesco,
      referencia2Telefono: data.ref2_telefono,
      referencia2Direccion: data.ref2_direccion,
      parejaNombre: data.pareja_nombre,
      parejaActividad: data.pareja_actividad,
      parejaIngresoSemanal: data.pareja_ingreso_semanal?.toString(),

      // Paso 4
      negocioGiro: data.negocio_giro,
      negocioDomicilio: data.negocio_domicilio,
      negocioCodigoPostal: data.negocio_codigo_postal,
      negocioColonia: data.negocio_colonia,
      negocioMunicipio: data.negocio_municipio,
      negocioEstado: data.negocio_estado,
      negocioDesdeCuando: data.negocio_desde_cuando,
      negocioIngresoSemanal: data.negocio_ingreso_semanal?.toString(),
      negocioOtrosIngresos: data.negocio_otros_ingresos?.toString(),
      negocioGastos: data.negocio_gastos?.toString(),

      // Paso 5
      beneficiarioNombre: data.beneficiario_nombre,
      beneficiarioParentesco: data.beneficiario_parentesco,
      beneficiarioTelefono: data.beneficiario_telefono,
      beneficiarioDireccion: data.beneficiario_direccion,

      // Paso 6
      tieneMedidorLuzSinAdeudo: data.tiene_medidor_luz,
      viveMaximo5KmTesorera: data.vive_max_5km_tesorera,
      tieneMenos70Anios: data.tiene_menos_70_anios,
      montoSolicitado: data.monto_solicitado?.toString(),
    };
  }

  private mapFormToServer(formData: SolicitudFormData): any {
    return {
      // Paso 1
      nombres: formData.nombres,
      apellido_pat: formData.apellidoPaterno,
      apellido_mat: formData.apellidoMaterno,
      curp: formData.curp,
      fecha_nac: formData.fechaNacimiento,
      nacionalidad: formData.nacionalidad,
      estado_nacimiento: formData.estadoNacimiento,
      genero: formData.genero,
      estado_civil: formData.estadoCivil,
      ocupacion: formData.ocupacion,
      nivel_estudio: formData.nivelEstudio,
      telefono: formData.telefono,

      // Paso 2
      dom_calle: formData.domCalle,
      dom_num_ext: formData.domNumExt,
      dom_num_int: formData.domNumInt,
      dom_entre_calles: formData.domEntreCalles,
      dom_codigo_postal: formData.domCodigoPostal,
      dom_colonia: formData.domColonia,
      dom_municipio: formData.domMunicipio,
      dom_estado: formData.domEstado,
      dom_telefono: formData.domTelefono,

      // Paso 3
      ref1_nombre: formData.referencia1Nombre,
      ref1_parentesco: formData.referencia1Parentesco,
      ref1_telefono: formData.referencia1Telefono,
      ref1_direccion: formData.referencia1Direccion,
      ref2_nombre: formData.referencia2Nombre,
      ref2_parentesco: formData.referencia2Parentesco,
      ref2_telefono: formData.referencia2Telefono,
      ref2_direccion: formData.referencia2Direccion,
      pareja_nombre: formData.parejaNombre,
      pareja_actividad: formData.parejaActividad,
      pareja_ingreso_semanal: formData.parejaIngresoSemanal ? parseFloat(formData.parejaIngresoSemanal) : undefined,

      // Paso 4
      negocio_giro: formData.negocioGiro,
      negocio_domicilio: formData.negocioDomicilio,
      negocio_codigo_postal: formData.negocioCodigoPostal,
      negocio_colonia: formData.negocioColonia,
      negocio_municipio: formData.negocioMunicipio,
      negocio_estado: formData.negocioEstado,
      negocio_desde_cuando: formData.negocioDesdeCuando,
      negocio_ingreso_semanal: formData.negocioIngresoSemanal ? parseFloat(formData.negocioIngresoSemanal) : undefined,
      negocio_otros_ingresos: formData.negocioOtrosIngresos ? parseFloat(formData.negocioOtrosIngresos) : undefined,
      negocio_gastos: formData.negocioGastos ? parseFloat(formData.negocioGastos) : undefined,

      // Paso 5
      beneficiario_nombre: formData.beneficiarioNombre,
      beneficiario_parentesco: formData.beneficiarioParentesco,
      beneficiario_telefono: formData.beneficiarioTelefono,
      beneficiario_direccion: formData.beneficiarioDireccion,

      // Paso 6
      tiene_medidor_luz: formData.tieneMedidorLuzSinAdeudo,
      vive_max_5km_tesorera: formData.viveMaximo5KmTesorera,
      tiene_menos_70_anios: formData.tieneMenos70Anios,
      monto_solicitado: formData.montoSolicitado ? parseFloat(formData.montoSolicitado) : undefined,
    };
  }
}

export const solicitudService = new SolicitudService();
