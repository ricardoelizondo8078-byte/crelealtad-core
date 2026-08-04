import { WizardStep, DocumentoRequerido } from './solicitud.types';

export const WIZARD_STEPS: WizardStep[] = [
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
];

// Documentos según tabla solicitudes_documentos (doc_ine, doc_comprobante, doc_ine_beneficiario, doc_solicitud_firmada)
export const DOCUMENTOS_REQUERIDOS: DocumentoRequerido[] = [
  { id: 'doc_ine', nombre: 'INE Solicitante', obligatorio: true, status: 'PENDIENTE' },
  { id: 'doc_comprobante', nombre: 'Comprobante Domicilio', obligatorio: true, status: 'PENDIENTE' },
  { id: 'doc_ine_beneficiario', nombre: 'INE Beneficiario', obligatorio: true, status: 'PENDIENTE' },
  { id: 'doc_solicitud_firmada', nombre: 'Solicitud Firmada', obligatorio: false, status: 'OPCIONAL' },
];

export const YES_NO_OPTIONS = ['SI', 'NO'] as const;
