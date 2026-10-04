import { formatCurrency } from '../../utils/currency';
import {
  formatISODateToDDMMYYYY,
  validatePhone10,
  validateRealDate,
} from '../../utils/input';
import { validateCURP } from '../../utils/validation';
import type { DocumentoRequerido } from './solicitud-documentos';

export type SelectValue = string;

export type SelectorFieldKey =
  | 'nacionalidad'
  | 'estado_nacimiento'
  | 'genero'
  | 'estado_civil'
  | 'nivel_estudio'
  | 'colonia'
  | 'municipio'
  | 'negocio_colonia'
  | 'negocio_municipio'
  | 'negocioDesdeCuando'
  | 'referencia1Parentesco'
  | 'referencia2Parentesco'
  | 'beneficiario_parentesco'
  | 'tieneMedidorLuzSinAdeudo'
  | 'viveMaximo5KmTesorera';

export interface SolicitudErrors {
  [key: string]: string | undefined;
}

export interface SolicitudFormData {
  [key: string]: string;
  nombres: string;
  apellido_pat: string;
  apellido_mat: string;
  telefonoInicial: string;
  telefonoSecundario: string;
  montoSolicitado: string;
  fecha_nac: string;
  curp: string;
  nacionalidad: string;
  estado_nacimiento: string;
  genero: string;
  estado_civil: string;
  ocupacion: string;
  nivel_estudio: string;
  calle: string;
  numeroExterior: string;
  numeroInterior: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigoPostal: string;
  entreCalles: string;
  telefono: string;
  referencia1NombreCompleto: string;
  referencia1Parentesco: string;
  referencia1Telefono: string;
  referencia1Direccion: string;
  referencia2NombreCompleto: string;
  referencia2Parentesco: string;
  referencia2Telefono: string;
  referencia2Direccion: string;
  parejaNombreCompleto: string;
  parejaActividadEconomica: string;
  pareja_ingreso_semanal: string;
  negocioCalle: string;
  negocioNumeroExterior: string;
  negocioNumeroInterior: string;
  negocio_colonia: string;
  negocio_municipio: string;
  negocioEstado: string;
  negocioCodigoPostal: string;
  negocioDesdeCuando: string;
  negocio_ingreso_semanal: string;
  negocio_otros_ingresos: string;
  negocio_gastos: string;
  negocio_total: string;
  negocio_giro: string;
  beneficiarioNombreCompleto: string;
  beneficiario_parentesco: string;
  beneficiario_telefono: string;
  beneficiario_direccion: string;
  tieneMedidorLuzSinAdeudo: string;
  viveMaximo5KmTesorera: string;
}

export type MontoReferencia = {
  origen: 'CICLO_ANTERIOR' | 'PROSPECCION';
  monto: number | null;
};

export type ComparacionMontoPaso6 = {
  tendencia: 'AUMENTA' | 'DISMINUYE';
  diferencia: number;
} | null;

export const getMontoSolicitadoError = (
  value: string,
  montoMaximo: number,
  required = true,
): string | undefined => {
  if (!value.trim()) {
    return required ? 'Campo obligatorio' : undefined;
  }

  const monto = Number(value);
  if (!Number.isFinite(monto) || monto <= 0) {
    return 'Captura un monto mayor a $0';
  }
  if (monto > montoMaximo) {
    return `El monto máximo permitido es ${formatCurrency(montoMaximo)}`;
  }

  return undefined;
};

export const yesNoOptions = ['SI', 'NO'] as const;

export const normalizeCurpInput = (value: string): string => (
  value.replace(/\s+/g, '').toUpperCase().slice(0, 18)
);

export const validateCurpField = (value: string): string | undefined => {
  if (!value.trim()) return 'Campo obligatorio';
  if (value.trim().length !== 18 || !validateCURP(value)) return 'CURP inválida';
  return undefined;
};

export const validateFechaNacimientoField = (value: string): string | undefined => {
  if (!value.trim()) return 'Campo obligatorio';
  const ddmmyyyy = formatISODateToDDMMYYYY(value);
  if (!ddmmyyyy || !validateRealDate(ddmmyyyy)) return 'Fecha inválida';
  return undefined;
};

export const isSolicitudStepComplete = (
  step: number,
  form: SolicitudFormData,
  documentos: readonly DocumentoRequerido[],
  montoMaximoSolicitable: number,
): boolean => {
  switch (step) {
    case 1:
      return Boolean(
        form.nombres.trim()
        && form.apellido_pat.trim()
        && form.apellido_mat.trim()
        && form.telefonoInicial.trim()
        && form.fecha_nac.trim()
        && form.curp.trim()
        && form.genero.trim()
        && form.estado_civil.trim()
        && form.ocupacion.trim()
        && form.nivel_estudio.trim()
        && form.nacionalidad.trim()
      );
    case 2:
      return Boolean(
        form.calle.trim()
        && form.numeroExterior.trim()
        && form.entreCalles.trim()
        && form.colonia.trim()
        && form.municipio.trim()
      );
    case 3:
      return Boolean(
        form.referencia1NombreCompleto.trim()
        && form.referencia1Parentesco.trim()
        && form.referencia1Telefono.trim()
        && form.referencia1Direccion.trim()
        && form.referencia2NombreCompleto.trim()
        && form.referencia2Parentesco.trim()
        && form.referencia2Telefono.trim()
        && form.referencia2Direccion.trim()
      );
    case 4:
      return Boolean(
        form.negocioCalle.trim()
        && form.negocioNumeroExterior.trim()
        && form.negocio_colonia.trim()
        && form.negocio_municipio.trim()
        && form.negocioDesdeCuando.trim()
        && form.negocio_giro.trim()
        && form.negocio_ingreso_semanal.trim()
        && form.negocio_gastos.trim()
      );
    case 5:
      return Boolean(
        form.beneficiarioNombreCompleto.trim()
        && form.beneficiario_parentesco.trim()
        && form.beneficiario_telefono.trim()
        && form.beneficiario_direccion.trim()
      );
    case 6: {
      const montoSolicitado = Number(form.montoSolicitado);
      return Boolean(
        form.tieneMedidorLuzSinAdeudo
        && form.viveMaximo5KmTesorera
        && form.montoSolicitado.trim()
        && Number.isFinite(montoSolicitado)
        && montoSolicitado > 0
        && montoSolicitado <= montoMaximoSolicitable
      );
    }
    case 7: {
      const obligatorios = documentos.filter((documento) => documento.obligatorio);
      return obligatorios.every((documento) => documento.status === 'SINCRONIZADO');
    }
    default:
      return false;
  }
};

export const validateSolicitudStep = (
  step: number,
  form: SolicitudFormData,
  montoMaximoSolicitable: number,
): SolicitudErrors => {
  const errors: SolicitudErrors = {};

  if (step === 1) {
    if (!form.nombres.trim()) errors.nombres = 'Campo obligatorio';
    if (!form.apellido_pat.trim()) errors.apellido_pat = 'Campo obligatorio';
    if (!form.apellido_mat.trim()) errors.apellido_mat = 'Campo obligatorio';
    if (!form.telefonoInicial.trim()) errors.telefonoInicial = 'Campo obligatorio';
    if (!validatePhone10(form.telefonoInicial)) errors.telefonoInicial = 'Debe tener 10 dígitos';
    if (!form.fecha_nac.trim()) errors.fecha_nac = 'Campo obligatorio';
    if (!form.curp.trim()) errors.curp = 'Campo obligatorio';
    if (!form.genero.trim()) errors.genero = 'Campo obligatorio';
    if (!form.estado_civil.trim()) errors.estado_civil = 'Campo obligatorio';
    if (!form.ocupacion.trim()) errors.ocupacion = 'Campo obligatorio';
    if (!form.nivel_estudio.trim()) errors.nivel_estudio = 'Campo obligatorio';
    if (!form.nacionalidad.trim()) errors.nacionalidad = 'Campo obligatorio';
    if (form.nacionalidad === 'MEXICANA' && !form.estado_nacimiento.trim()) {
      errors.estado_nacimiento = 'Campo obligatorio';
    }
    errors.fecha_nac = validateFechaNacimientoField(form.fecha_nac);
    errors.curp = validateCurpField(form.curp);
  } else if (step === 2) {
    if (!form.calle.trim()) errors.calle = 'Campo obligatorio';
    if (!form.numeroExterior.trim()) errors.numeroExterior = 'Campo obligatorio';
    if (!form.colonia.trim()) errors.colonia = 'Campo obligatorio';
    if (!form.municipio.trim()) errors.municipio = 'Campo obligatorio';
    if (!form.codigoPostal.trim()) errors.codigoPostal = 'Campo obligatorio';
    if (form.codigoPostal.trim().length !== 5) errors.codigoPostal = 'Debe tener 5 dígitos';
    if (!form.entreCalles.trim()) errors.entreCalles = 'Campo obligatorio';
  } else if (step === 3) {
    if (!form.referencia1NombreCompleto.trim()) errors.referencia1NombreCompleto = 'Campo obligatorio';
    if (!form.referencia1Parentesco.trim()) errors.referencia1Parentesco = 'Campo obligatorio';
    if (!form.referencia1Telefono.trim()) errors.referencia1Telefono = 'Campo obligatorio';
    if (!validatePhone10(form.referencia1Telefono)) errors.referencia1Telefono = 'Debe tener 10 dígitos';
    if (!form.referencia1Direccion.trim()) errors.referencia1Direccion = 'Campo obligatorio';
    if (!form.referencia2NombreCompleto.trim()) errors.referencia2NombreCompleto = 'Campo obligatorio';
    if (!form.referencia2Parentesco.trim()) errors.referencia2Parentesco = 'Campo obligatorio';
    if (!form.referencia2Telefono.trim()) errors.referencia2Telefono = 'Campo obligatorio';
    if (!validatePhone10(form.referencia2Telefono)) errors.referencia2Telefono = 'Debe tener 10 dígitos';
    if (!form.referencia2Direccion.trim()) errors.referencia2Direccion = 'Campo obligatorio';
  } else if (step === 4) {
    if (!form.negocioCalle.trim()) errors.negocioCalle = 'Campo obligatorio';
    if (!form.negocioNumeroExterior.trim()) errors.negocioNumeroExterior = 'Campo obligatorio';
    if (!form.negocio_colonia.trim()) errors.negocio_colonia = 'Campo obligatorio';
    if (!form.negocio_municipio.trim()) errors.negocio_municipio = 'Campo obligatorio';
    if (!form.negocioCodigoPostal.trim()) errors.negocioCodigoPostal = 'Campo obligatorio';
    if (form.negocioCodigoPostal.trim().length !== 5) errors.negocioCodigoPostal = 'Debe tener 5 dígitos';
    if (!form.negocioDesdeCuando.trim()) errors.negocioDesdeCuando = 'Campo obligatorio';
    if (!form.negocio_giro.trim()) errors.negocio_giro = 'Campo obligatorio';
    if (!form.negocio_ingreso_semanal.trim()) errors.negocio_ingreso_semanal = 'Campo obligatorio';
    if (!form.negocio_gastos.trim()) errors.negocio_gastos = 'Campo obligatorio';
    if (!form.negocio_total.trim()) errors.negocio_total = 'Campo obligatorio';
  } else if (step === 5) {
    if (!form.beneficiarioNombreCompleto.trim()) errors.beneficiarioNombreCompleto = 'Campo obligatorio';
    if (!form.beneficiario_parentesco.trim()) errors.beneficiario_parentesco = 'Campo obligatorio';
    if (!form.beneficiario_telefono.trim()) errors.beneficiario_telefono = 'Campo obligatorio';
    if (!validatePhone10(form.beneficiario_telefono)) errors.beneficiario_telefono = 'Debe tener 10 dígitos';
    if (!form.beneficiario_direccion.trim()) errors.beneficiario_direccion = 'Campo obligatorio';
  } else if (step === 6) {
    if (!form.tieneMedidorLuzSinAdeudo) errors.tieneMedidorLuzSinAdeudo = 'Campo obligatorio';
    if (!form.viveMaximo5KmTesorera) errors.viveMaximo5KmTesorera = 'Campo obligatorio';
    errors.montoSolicitado = getMontoSolicitadoError(form.montoSolicitado, montoMaximoSolicitable);
  }

  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => value !== undefined),
  );
};

export const WIZARD_STEPS = [
  {
    id: 1,
    title: 'INFORMACIÓN PERSONAL',
    shortTitle: 'Info Personal',
  },
  {
    id: 2,
    title: 'DOMICILIO PARTICULAR',
    shortTitle: 'Domicilio',
  },
  {
    id: 3,
    title: 'REFERENCIAS',
    shortTitle: 'Referencias',
  },
  {
    id: 4,
    title: 'NEGOCIO O TRABAJO',
    shortTitle: 'Negocio',
  },
  {
    id: 5,
    title: 'BENEFICIARIO',
    shortTitle: 'Beneficiario',
  },
  {
    id: 6,
    title: 'VALIDACIONES Y MONTO',
    shortTitle: 'Validaciones',
  },
  {
    id: 7,
    title: 'DOCUMENTACIÓN',
    shortTitle: 'Documentación',
  },
] as const;
