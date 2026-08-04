import { useState } from 'react';
import { SolicitudFormData, SolicitudErrors } from '../types/solicitud.types';
import { validateCURP } from '../../../utils/validation';
import { validateRealDate } from '../../../utils/input';

export const useSolicitudValidation = () => {
  const [errors, setErrors] = useState<SolicitudErrors>({});

  const validateStep1 = (data: SolicitudFormData): boolean => {
    const newErrors: SolicitudErrors = {};

    if (!data.primerNombre?.trim()) newErrors.primerNombre = 'Campo obligatorio';
    if (!data.apellidoPaterno?.trim()) newErrors.apellidoPaterno = 'Campo obligatorio';
    if (!data.apellidoMaterno?.trim()) newErrors.apellidoMaterno = 'Campo obligatorio';

    if (!data.curp?.trim()) {
      newErrors.curp = 'Campo obligatorio';
    } else if (data.curp.length !== 18 || !validateCURP(data.curp)) {
      newErrors.curp = 'CURP inválida';
    }

    if (!data.fechaNacimiento) newErrors.fechaNacimiento = 'Campo obligatorio';
    if (!data.nacionalidad) newErrors.nacionalidad = 'Campo obligatorio';
    if (data.nacionalidad === 'MEXICANA' && !data.estadoNacimiento) {
      newErrors.estadoNacimiento = 'Campo obligatorio';
    }
    if (!data.genero) newErrors.genero = 'Campo obligatorio';
    if (!data.estadoCivil) newErrors.estadoCivil = 'Campo obligatorio';
    if (!data.nivelEstudio) newErrors.nivelEstudio = 'Campo obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (data: SolicitudFormData): boolean => {
    const newErrors: SolicitudErrors = {};

    if (!data.domCalle?.trim()) newErrors.domCalle = 'Campo obligatorio';
    if (!data.domNumExt?.trim()) newErrors.domNumExt = 'Campo obligatorio';
    if (!data.domCodigoPostal?.trim()) newErrors.domCodigoPostal = 'Campo obligatorio';
    if (!data.domColonia?.trim()) newErrors.domColonia = 'Campo obligatorio';
    if (!data.domMunicipio?.trim()) newErrors.domMunicipio = 'Campo obligatorio';
    if (!data.domEstado?.trim()) newErrors.domEstado = 'Campo obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (data: SolicitudFormData): boolean => {
    const newErrors: SolicitudErrors = {};

    // Referencia 1
    if (!data.referencia1Nombre?.trim()) newErrors.referencia1Nombre = 'Campo obligatorio';
    if (!data.referencia1Parentesco?.trim()) newErrors.referencia1Parentesco = 'Campo obligatorio';
    if (!data.referencia1Telefono?.trim()) newErrors.referencia1Telefono = 'Campo obligatorio';

    // Referencia 2
    if (!data.referencia2Nombre?.trim()) newErrors.referencia2Nombre = 'Campo obligatorio';
    if (!data.referencia2Parentesco?.trim()) newErrors.referencia2Parentesco = 'Campo obligatorio';
    if (!data.referencia2Telefono?.trim()) newErrors.referencia2Telefono = 'Campo obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (data: SolicitudFormData): boolean => {
    const newErrors: SolicitudErrors = {};

    if (!data.negocioGiro?.trim()) newErrors.negocioGiro = 'Campo obligatorio';
    if (!data.negocioIngresoSemanal?.trim()) newErrors.negocioIngresoSemanal = 'Campo obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = (data: SolicitudFormData): boolean => {
    const newErrors: SolicitudErrors = {};

    if (!data.beneficiarioNombre?.trim()) newErrors.beneficiarioNombre = 'Campo obligatorio';
    if (!data.beneficiarioParentesco?.trim()) newErrors.beneficiarioParentesco = 'Campo obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep6 = (data: SolicitudFormData): boolean => {
    const newErrors: SolicitudErrors = {};

    if (!data.tieneMedidorLuzSinAdeudo) newErrors.tieneMedidorLuzSinAdeudo = 'Campo obligatorio';
    if (!data.viveMaximo5KmTesorera) newErrors.viveMaximo5KmTesorera = 'Campo obligatorio';
    if (!data.tieneMenos70Anios) newErrors.tieneMenos70Anios = 'Campo obligatorio';
    if (!data.montoSolicitado?.trim()) newErrors.montoSolicitado = 'Campo obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
  };

  const clearError = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return {
    errors,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
    validateStep6,
    clearErrors,
    clearError,
    setErrors,
  };
};
