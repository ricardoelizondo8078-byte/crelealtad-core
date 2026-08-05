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
    // Ahora los nombres coinciden exactamente con el DTO (snake_case)
    return {
      // Paso 1
      primer_nombre: data.primer_nombre,
      segundo_nombre: data.segundo_nombre,
      apellido_pat: data.apellido_pat,
      apellido_mat: data.apellido_mat,
      curp: data.curp,
      fecha_nac: data.fecha_nac,
      nacionalidad: data.nacionalidad,
      estado_nacimiento: data.estado_nacimiento,
      genero: data.genero,
      estado_civil: data.estado_civil,
      ocupacion: data.ocupacion,
      nivel_estudio: data.nivel_estudio,
      telefono: data.telefono,

      // Paso 2
      dom_calle: data.dom_calle,
      dom_num_ext: data.dom_num_ext,
      dom_num_int: data.dom_num_int,
      dom_entre_calles: data.dom_entre_calles,
      dom_codigo_postal: data.dom_codigo_postal,
      dom_colonia: data.dom_colonia,
      dom_municipio: data.dom_municipio,
      dom_estado: data.dom_estado,
      dom_telefono: data.dom_telefono,

      // Paso 3
      ref1_nombre: data.ref1_nombre,
      ref1_parentesco: data.ref1_parentesco,
      ref1_telefono: data.ref1_telefono,
      ref1_direccion: data.ref1_direccion,
      ref2_nombre: data.ref2_nombre,
      ref2_parentesco: data.ref2_parentesco,
      ref2_telefono: data.ref2_telefono,
      ref2_direccion: data.ref2_direccion,
      pareja_nombre: data.pareja_nombre,
      pareja_actividad: data.pareja_actividad,
      pareja_ingreso_semanal: data.pareja_ingreso_semanal?.toString(),

      // Paso 4
      negocio_giro: data.negocio_giro,
      negocio_domicilio: data.negocio_domicilio,
      negocio_codigo_postal: data.negocio_codigo_postal,
      negocio_colonia: data.negocio_colonia,
      negocio_municipio: data.negocio_municipio,
      negocio_estado: data.negocio_estado,
      negocio_desde_cuando: data.negocio_desde_cuando,
      negocio_ingreso_semanal: data.negocio_ingreso_semanal?.toString(),
      negocio_otros_ingresos: data.negocio_otros_ingresos?.toString(),
      negocio_gastos: data.negocio_gastos?.toString(),

      // Paso 5
      beneficiario_nombre: data.beneficiario_nombre,
      beneficiario_parentesco: data.beneficiario_parentesco,
      beneficiario_telefono: data.beneficiario_telefono,
      beneficiario_direccion: data.beneficiario_direccion,

      // Paso 6
      tiene_medidor_luz: data.tiene_medidor_luz,
      vive_max_5km_tesorera: data.vive_max_5km_tesorera,
      monto_solicitado: data.monto_solicitado?.toString(),

      // Paso 7
      doc_ine_ruta: data.doc_ine_ruta,
      doc_comprobante_ruta: data.doc_comprobante_ruta,
      doc_ine_beneficiario_ruta: data.doc_ine_beneficiario_ruta,
      doc_solicitud_firmada_ruta: data.doc_solicitud_firmada_ruta,
    };
  }

  private mapFormToServer(formData: SolicitudFormData): any {
    // Ahora los nombres ya coinciden exactamente, solo parseamos números
    return {
      // Paso 1
      primer_nombre: formData.primer_nombre,
      segundo_nombre: formData.segundo_nombre,
      apellido_pat: formData.apellido_pat,
      apellido_mat: formData.apellido_mat,
      curp: formData.curp,
      fecha_nac: formData.fecha_nac,
      nacionalidad: formData.nacionalidad,
      estado_nacimiento: formData.estado_nacimiento,
      genero: formData.genero,
      estado_civil: formData.estado_civil,
      ocupacion: formData.ocupacion,
      nivel_estudio: formData.nivel_estudio,
      telefono: formData.telefono,

      // Paso 2
      dom_calle: formData.dom_calle,
      dom_num_ext: formData.dom_num_ext,
      dom_num_int: formData.dom_num_int,
      dom_entre_calles: formData.dom_entre_calles,
      dom_codigo_postal: formData.dom_codigo_postal,
      dom_colonia: formData.dom_colonia,
      dom_municipio: formData.dom_municipio,
      dom_estado: formData.dom_estado,
      dom_telefono: formData.dom_telefono,

      // Paso 3
      ref1_nombre: formData.ref1_nombre,
      ref1_parentesco: formData.ref1_parentesco,
      ref1_telefono: formData.ref1_telefono,
      ref1_direccion: formData.ref1_direccion,
      ref2_nombre: formData.ref2_nombre,
      ref2_parentesco: formData.ref2_parentesco,
      ref2_telefono: formData.ref2_telefono,
      ref2_direccion: formData.ref2_direccion,
      pareja_nombre: formData.pareja_nombre,
      pareja_actividad: formData.pareja_actividad,
      pareja_ingreso_semanal: formData.pareja_ingreso_semanal ? parseFloat(formData.pareja_ingreso_semanal) : undefined,

      // Paso 4
      negocio_giro: formData.negocio_giro,
      negocio_domicilio: formData.negocio_domicilio,
      negocio_codigo_postal: formData.negocio_codigo_postal,
      negocio_colonia: formData.negocio_colonia,
      negocio_municipio: formData.negocio_municipio,
      negocio_estado: formData.negocio_estado,
      negocio_desde_cuando: formData.negocio_desde_cuando,
      negocio_ingreso_semanal: formData.negocio_ingreso_semanal ? parseFloat(formData.negocio_ingreso_semanal) : undefined,
      negocio_otros_ingresos: formData.negocio_otros_ingresos ? parseFloat(formData.negocio_otros_ingresos) : undefined,
      negocio_gastos: formData.negocio_gastos ? parseFloat(formData.negocio_gastos) : undefined,

      // Paso 5
      beneficiario_nombre: formData.beneficiario_nombre,
      beneficiario_parentesco: formData.beneficiario_parentesco,
      beneficiario_telefono: formData.beneficiario_telefono,
      beneficiario_direccion: formData.beneficiario_direccion,

      // Paso 6
      tiene_medidor_luz: formData.tiene_medidor_luz,
      vive_max_5km_tesorera: formData.vive_max_5km_tesorera,
      monto_solicitado: formData.monto_solicitado ? parseFloat(formData.monto_solicitado) : undefined,

      // Paso 7
      doc_ine_ruta: formData.doc_ine_ruta,
      doc_comprobante_ruta: formData.doc_comprobante_ruta,
      doc_ine_beneficiario_ruta: formData.doc_ine_beneficiario_ruta,
      doc_solicitud_firmada_ruta: formData.doc_solicitud_firmada_ruta,
    };
  }
}

export const solicitudService = new SolicitudService();
