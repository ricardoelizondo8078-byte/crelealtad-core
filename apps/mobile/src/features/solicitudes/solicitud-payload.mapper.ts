export type SolicitudFormValues = Record<string, string>;

const toNullableNumber = (value: string): number | null => value ? Number(value) : null;

export const buildIntegrantePayload = (form: SolicitudFormValues, includeNames: boolean) => ({
  ...(includeNames && {
    nombres: form.nombres,
    apellido_pat: form.apellido_pat,
    apellido_mat: form.apellido_mat,
  }),
  telefono: form.telefonoInicial,
  telefonoSecundario: form.telefonoSecundario,
});

export const buildSolicitudStepPayload = (
  form: SolicitudFormValues,
  step: number,
): Record<string, unknown> => {
  const payloads: Record<number, Record<string, unknown>> = {
    1: {
      nombres: form.nombres,
      apellido_pat: form.apellido_pat,
      apellido_mat: form.apellido_mat,
      fecha_nac: form.fecha_nac || null,
      curp: form.curp,
      genero: form.genero,
      estado_civil: form.estado_civil,
      ocupacion: form.ocupacion,
      nivel_estudio: form.nivel_estudio,
      nacionalidad: form.nacionalidad,
      estado_nacimiento: form.estado_nacimiento,
    },
    2: {
      dom_calle: form.calle,
      dom_num_ext: form.numeroExterior,
      dom_num_int: form.numeroInterior,
      dom_entre_calles: form.entreCalles,
      dom_colonia: form.colonia,
      dom_municipio: form.municipio,
      dom_estado: form.estado,
      dom_codigo_postal: form.codigoPostal,
      dom_telefono: form.telefonoInicial,
    },
    3: {
      ref1_nombre: form.referencia1NombreCompleto,
      ref1_parentesco: form.referencia1Parentesco,
      ref1_telefono: form.referencia1Telefono,
      ref1_direccion: form.referencia1Direccion,
      ref2_nombre: form.referencia2NombreCompleto,
      ref2_parentesco: form.referencia2Parentesco,
      ref2_telefono: form.referencia2Telefono,
      ref2_direccion: form.referencia2Direccion,
      pareja_nombre: form.parejaNombreCompleto,
      pareja_actividad: form.parejaActividadEconomica,
      pareja_ingreso_semanal: toNullableNumber(form.pareja_ingreso_semanal),
    },
    4: {
      negocio_domicilio: form.negocioCalle,
      negocio_num_ext: form.negocioNumeroExterior,
      negocio_num_int: form.negocioNumeroInterior,
      negocio_colonia: form.negocio_colonia,
      negocio_municipio: form.negocio_municipio,
      negocio_estado: form.negocioEstado,
      negocio_codigo_postal: form.negocioCodigoPostal,
      negocio_giro: form.negocio_giro,
      negocio_desde_cuando: form.negocioDesdeCuando,
      negocio_ingreso_semanal: toNullableNumber(form.negocio_ingreso_semanal),
      negocio_otros_ingresos: toNullableNumber(form.negocio_otros_ingresos),
      negocio_gastos: toNullableNumber(form.negocio_gastos),
      negocio_total: toNullableNumber(form.negocio_total),
    },
    5: {
      beneficiario_nombre: form.beneficiarioNombreCompleto,
      beneficiario_parentesco: form.beneficiario_parentesco,
      beneficiario_telefono: form.beneficiario_telefono,
      beneficiario_direccion: form.beneficiario_direccion,
    },
    6: {
      tiene_medidor_luz: form.tieneMedidorLuzSinAdeudo || null,
      vive_max_5km_tesorera: form.viveMaximo5KmTesorera || null,
      monto_solicitado: form.montoSolicitado ? Number(form.montoSolicitado) : undefined,
    },
  };

  return payloads[step] ?? {};
};

export const compactPayload = (payload: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  );

export const buildAutoSavePayload = (
  form: SolicitudFormValues,
  montoMaximo: number,
): Record<string, unknown> => {
  const payload = Object.assign(
    {},
    ...[1, 2, 3, 4, 5, 6].map((step) => buildSolicitudStepPayload(form, step)),
  );
  const monto = Number(form.montoSolicitado);
  if (!Number.isFinite(monto) || monto <= 0 || monto > montoMaximo) {
    delete payload.monto_solicitado;
  }
  return compactPayload(payload);
};
