import { useEffect, useState } from 'react';
import {
  obtenerCalificacionCiclosCreditoVerificacion,
  obtenerCalificacionSemanaCreditoVerificacion,
  obtenerConcordanciaFichaVerificacion,
  obtenerConcordanciaPrestamoVerificacion,
  obtenerPromedioEvidenciasVerificacion,
  obtenerToleranciaSemanaDesembolsoVerificacion,
  type ParametroConclusionesCiclosCredito,
  type ParametroConclusionesConcordanciaFicha,
  type ParametroConclusionesConcordanciaPrestamo,
  type ParametroConclusionesPromedioEvidencias,
  type ParametroConclusionesSemanaCredito,
  type ParametroConclusionesToleranciaSemanaDesembolso,
} from '../parametros/parametros-conclusiones.api';

export const useCalificacionSemanaCredito = (): ParametroConclusionesSemanaCredito | null => {
  const [parametro, setParametro] = useState<ParametroConclusionesSemanaCredito | null>(null);

  useEffect(() => {
    let activo = true;
    void obtenerCalificacionSemanaCreditoVerificacion()
      .then((response) => {
        if (activo) setParametro(response.parametro);
      })
      .catch(() => {
        if (activo) setParametro(null);
      });
    return () => { activo = false; };
  }, []);

  return parametro;
};

export const useCalificacionCiclosCredito = (): ParametroConclusionesCiclosCredito | null => {
  const [parametro, setParametro] = useState<ParametroConclusionesCiclosCredito | null>(null);

  useEffect(() => {
    let activo = true;
    void obtenerCalificacionCiclosCreditoVerificacion()
      .then((response) => {
        if (activo) setParametro(response.parametro);
      })
      .catch(() => {
        if (activo) setParametro(null);
      });
    return () => { activo = false; };
  }, []);

  return parametro;
};

export const useToleranciaSemanaDesembolso = ():
ParametroConclusionesToleranciaSemanaDesembolso | null => {
  const [parametro, setParametro] = useState<
    ParametroConclusionesToleranciaSemanaDesembolso | null
  >(null);

  useEffect(() => {
    let activo = true;
    void obtenerToleranciaSemanaDesembolsoVerificacion()
      .then((response) => {
        if (activo) setParametro(response.parametro);
      })
      .catch(() => {
        if (activo) setParametro(null);
      });
    return () => { activo = false; };
  }, []);

  return parametro;
};

export const useConcordanciaFicha = (): ParametroConclusionesConcordanciaFicha | null => {
  const [parametro, setParametro] = useState<ParametroConclusionesConcordanciaFicha | null>(null);

  useEffect(() => {
    let activo = true;
    void obtenerConcordanciaFichaVerificacion()
      .then((response) => {
        if (activo) setParametro(response.parametro);
      })
      .catch(() => {
        if (activo) setParametro(null);
      });
    return () => { activo = false; };
  }, []);

  return parametro;
};

export const useConcordanciaPrestamo = (): ParametroConclusionesConcordanciaPrestamo | null => {
  const [parametro, setParametro] = useState<ParametroConclusionesConcordanciaPrestamo | null>(null);

  useEffect(() => {
    let activo = true;
    void obtenerConcordanciaPrestamoVerificacion()
      .then((response) => {
        if (activo) setParametro(response.parametro);
      })
      .catch(() => {
        if (activo) setParametro(null);
      });
    return () => { activo = false; };
  }, []);

  return parametro;
};

export const usePromedioEvidencias = (): ParametroConclusionesPromedioEvidencias | null => {
  const [parametro, setParametro] = useState<ParametroConclusionesPromedioEvidencias | null>(null);

  useEffect(() => {
    let activo = true;
    void obtenerPromedioEvidenciasVerificacion()
      .then((response) => {
        if (activo) setParametro(response.parametro);
      })
      .catch(() => {
        if (activo) setParametro(null);
      });
    return () => { activo = false; };
  }, []);

  return parametro;
};
