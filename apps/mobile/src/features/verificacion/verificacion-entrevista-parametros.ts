import { useEffect, useState } from 'react';
import { listarParametrosEntrevistaActivos, type FamiliaParametroEntrevista, type ParametroEntrevistaOpcion } from '../parametros/parametros-entrevista.api';

let catalogo: ParametroEntrevistaOpcion[] = [];
let carga: Promise<ParametroEntrevistaOpcion[]> | null = null;
let cargadoEn = 0;

const cargar = (): Promise<ParametroEntrevistaOpcion[]> => {
  if (catalogo.length > 0 && Date.now() - cargadoEn < 5 * 60 * 1000) return Promise.resolve(catalogo);
  if (!carga) {
    carga = listarParametrosEntrevistaActivos()
      .then((response) => {
        catalogo = response.items;
        cargadoEn = Date.now();
        return catalogo;
      })
      .finally(() => { carga = null; });
  }
  return carga;
};

export const useOpcionesEntrevista = (
  familia: FamiliaParametroEntrevista,
  respaldo: readonly string[],
): readonly string[] => {
  const [opciones, setOpciones] = useState<readonly string[]>(() => {
    const actuales = catalogo.filter((item) => item.familia === familia && item.activo);
    return actuales.length > 0 ? actuales.map((item) => item.etiqueta) : respaldo;
  });
  useEffect(() => {
    let activo = true;
    void cargar().then((items) => {
      if (!activo) return;
      const actuales = items.filter((item) => item.familia === familia && item.activo);
      if (actuales.length > 0) setOpciones(actuales.map((item) => item.etiqueta));
    }).catch(() => undefined);
    return () => { activo = false; };
  }, [familia]);
  return opciones;
};

export const codigoParametroEntrevista = (
  familia: FamiliaParametroEntrevista,
  etiqueta: string,
  respaldo: Record<string, string>,
): string | null => catalogo.find((item) => item.familia === familia && item.etiqueta === etiqueta)?.codigo
  ?? respaldo[etiqueta]
  ?? null;

export const etiquetaParametroEntrevista = (
  familia: FamiliaParametroEntrevista,
  codigo: string | null,
  respaldo: Record<string, string>,
): string => {
  if (!codigo) return '';
  return catalogo.find((item) => item.familia === familia && item.codigo === codigo)?.etiqueta
    ?? Object.entries(respaldo).find(([, value]) => value === codigo)?.[0]
    ?? '';
};
