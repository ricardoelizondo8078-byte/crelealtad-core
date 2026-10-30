import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AppHeader,
  BottomActionBar,
  Card,
  ConfirmDialog,
  FormField,
  ModuleCard,
  PrimaryButton,
  ScreenContainer,
  ScreenState,
  ScreenTitleBar,
  SemanticChoiceGroup,
  SecondaryButton,
  SectionTitle,
  StatusBadge,
  TaskMenuButton,
  TextInput,
} from '../../components/ui';
import { ApiError } from '../../services/api-client';
import { colors, layout, spacing, typography } from '../../theme/tokens';
import {
  formatISODateToDDMMMYYYY,
  toISODateFromDDMMMYYYY,
} from '../../utils/input';
import {
  FinancieraCompetidoraResumen,
  listarFinancierasCompetidoras,
  obtenerHistorialFinancieraCompetidora,
  publicarCambioFinanciera,
  type SucursalFinancieraCompetidora,
  type VersionFinancieraResumen,
  VersionFinancieraHistorial,
} from './parametros-financieras.api';
import {
  CLASIFICACIONES_FINANCIERA,
  financieraApareceEnPopup,
  type ClasificacionFinanciera,
  OPCIONES_SEMAFORO_FINANCIERA,
} from './parametros-financieras.model';
import { FinancieraStatusRow } from './FinancieraStatusRow';
import { FinancieraPopupVisibilityField } from './FinancieraPopupVisibilityField';
import {
  FinancieraProductMarketFields,
  type ProductoFinancieraFormulario,
  type SucursalFinancieraFormulario,
} from './FinancieraProductMarketFields';
import { MotivosClasificacionEvidenciaScreen } from './MotivosClasificacionEvidenciaScreen';
import type { ClasificacionMotivoEvidencia } from './parametros-evidencia-motivos.api';
import { OpcionesEntrevistaScreen } from './OpcionesEntrevistaScreen';
import {
  FAMILIAS_ENTREVISTA,
  FAMILIAS_VISITA_VECINO,
  type FamiliaEntrevistaPresentacion,
} from './parametros-entrevista.model';
import { CalificacionSemanaCreditoScreen } from './CalificacionSemanaCreditoScreen';
import { CalificacionCiclosCreditoScreen } from './CalificacionCiclosCreditoScreen';
import { ToleranciaSemanaDesembolsoScreen } from './ToleranciaSemanaDesembolsoScreen';
import { ConcordanciaFichaScreen } from './ConcordanciaFichaScreen';
import { ConcordanciaPrestamoScreen } from './ConcordanciaPrestamoScreen';
import { CalificacionPromedioEvidenciasScreen } from './CalificacionPromedioEvidenciasScreen';
import { MatrizPasosVerificacionScreen } from './MatrizPasosVerificacionScreen';
import { IntegrantesVerificadasParametroScreen } from './IntegrantesVerificadasParametroScreen';

type VistaParametros =
  | 'inicio'
  | 'verificacion'
  | 'integrantes-verificadas-finalizar'
  | 'pasos-verificacion'
  | 'financieras'
  | 'edicion'
  | 'historial'
  | 'entrevista'
  | 'visita-vecino'
  | 'conclusiones'
  | 'calificacion-semana-credito'
  | 'calificacion-ciclos-credito'
  | 'tolerancia-semana-desembolso'
  | 'concordancia-ficha'
  | 'concordancia-prestamo'
  | 'calificacion-promedio-evidencias'
  | 'opciones-entrevista'
  | 'motivos-verde'
  | 'motivos-amarillo'
  | 'motivos-rojo';

interface ModuloParametrosItem {
  key: string;
  title: string;
  description: string;
  iconLabel: string;
  vista?: VistaParametros;
}

const MODULOS_PARAMETROS: readonly (ModuloParametrosItem | null)[] = [
  {
    key: 'documentacion',
    title: 'Documentación',
    description: 'Solicitudes, expedientes y documentos',
    iconLabel: 'DO',
  },
  {
    key: 'verificacion',
    title: 'Verificación',
    description: 'Financieras y evidencias',
    iconLabel: 'VE',
    vista: 'verificacion',
  },
  {
    key: 'analisis',
    title: 'Análisis',
    description: 'Reglas de evaluación',
    iconLabel: 'AN',
  },
  {
    key: 'desembolsos',
    title: 'Desembolsos',
    description: 'Condiciones para entrega',
    iconLabel: 'DE',
  },
  {
    key: 'cobranza',
    title: 'Cobranza',
    description: 'Pagos y seguimiento',
    iconLabel: 'CO',
  },
  {
    key: 'recoleccion',
    title: 'Recolección',
    description: 'Efectivo y entregas',
    iconLabel: 'RE',
  },
  {
    key: 'mora',
    title: 'Mora',
    description: 'Cartera vencida',
    iconLabel: 'MO',
  },
  {
    key: 'convenios',
    title: 'Convenios',
    description: 'Acuerdos y reestructuras',
    iconLabel: 'CV',
  },
  {
    key: 'reportes',
    title: 'Reportes',
    description: 'Indicadores y resultados',
    iconLabel: 'RP',
  },
  null,
];

const CATALOGOS_VERIFICACION = [
  {
    key: 'integrantes-verificadas-finalizar',
    title: 'Integrantes para finalizar',
    description: 'Cantidad verificada requerida para habilitar el cierre del grupo',
    iconLabel: '01',
    vista: 'integrantes-verificadas-finalizar',
  },
  {
    key: 'pasos-verificacion',
    title: 'Pasos obligatorios',
    description: 'Obligatoriedad por tipo de integrante',
    iconLabel: 'PO',
    vista: 'pasos-verificacion',
  },
  {
    key: 'entrevista',
    title: 'Entrevista',
    description: 'Opciones, motivos y escalas editables',
    iconLabel: 'EN',
    vista: 'entrevista',
  },
  {
    key: 'visita-vecino',
    title: 'Visita al vecino',
    description: 'Opciones de seguimiento para las respuestas Sí y No',
    iconLabel: 'VV',
    vista: 'visita-vecino',
  },
  {
    key: 'conclusiones',
    title: 'Conclusiones',
    description: 'Parámetros del cierre de verificación',
    iconLabel: 'CL',
    vista: 'conclusiones',
  },
] as const;

const CATALOGOS_CONCLUSIONES = [
  {
    key: 'calificacion-semana-credito',
    title: 'Calificar semana del crédito',
    description: 'Rangos verde, amarillo y rojo para otra financiera',
    iconLabel: 'SC',
    vista: 'calificacion-semana-credito',
  },
  {
    key: 'calificacion-ciclos-credito',
    title: 'Calificar número de ciclos',
    description: 'Rangos verde, amarillo y rojo para ciclos en otra financiera',
    iconLabel: 'CI',
    vista: 'calificacion-ciclos-credito',
  },
  {
    key: 'tolerancia-semana-desembolso',
    title: 'Calificar semana de desembolso',
    description: 'Tolerancia de 0 a 10 semanas para el semáforo',
    iconLabel: 'SD',
    vista: 'tolerancia-semana-desembolso',
  },
  {
    key: 'concordancia-ficha',
    title: 'Calificar concordancia en ficha',
    description: 'Porcentaje de diferencia entre ficha declarada y calculada',
    iconLabel: 'CF',
    vista: 'concordancia-ficha',
  },
  {
    key: 'concordancia-prestamo',
    title: 'Calificar concordancia en préstamo',
    description: 'Porcentaje de diferencia entre préstamo declarado y calculado',
    iconLabel: 'CP',
    vista: 'concordancia-prestamo',
  },
  {
    key: 'calificacion-promedio-evidencias',
    title: 'Calificar promedio de fotografías',
    description: 'Rangos verde, amarillo y rojo de 0 a 100',
    iconLabel: 'PF',
    vista: 'calificacion-promedio-evidencias',
  },
] as const;

interface CatalogoEntrevistaMenuItem {
  key: string;
  title: string;
  description: string;
  iconLabel: string;
  vista?: VistaParametros;
  familia?: FamiliaEntrevistaPresentacion;
}

const CATALOGOS_ENTREVISTA: readonly CatalogoEntrevistaMenuItem[] = [
  {
    key: 'financieras',
    title: 'Financieras competidoras',
    description: 'Clasificación, vigencias e historial',
    iconLabel: 'FC',
    vista: 'financieras',
  },
  {
    key: 'motivos-verde',
    title: 'Motivos verdes',
    description: 'Conceptos de evidencia favorable',
    iconLabel: 'V',
    vista: 'motivos-verde',
  },
  {
    key: 'motivos-amarillo',
    title: 'Motivos amarillos',
    description: 'Conceptos de evidencia con atención',
    iconLabel: 'A',
    vista: 'motivos-amarillo',
  },
  {
    key: 'motivos-rojo',
    title: 'Motivos rojos',
    description: 'Conceptos de evidencia desfavorable',
    iconLabel: 'R',
    vista: 'motivos-rojo',
  },
  ...FAMILIAS_ENTREVISTA.map((familia) => ({
    key: familia.familia,
    title: familia.titulo,
    description: familia.descripcion,
    iconLabel: 'OP',
    familia,
  })),
];

const CATALOGOS_VISITA_VECINO: readonly CatalogoEntrevistaMenuItem[] = (
  FAMILIAS_VISITA_VECINO.map((familia) => ({
    key: familia.familia,
    title: familia.titulo,
    description: familia.descripcion,
    iconLabel: familia.familia.endsWith('_SI') ? 'SÍ' : 'NO',
    familia,
  }))
);

const clasificacionMotivosPorVista: Partial<Record<
  VistaParametros,
  ClasificacionMotivoEvidencia
>> = {
  'motivos-verde': 'VERDE',
  'motivos-amarillo': 'AMARILLO',
  'motivos-rojo': 'ROJO',
};

interface ParametrosScreenProps {
  canUpdate: boolean;
  onBack: () => void;
}

interface FormularioFinanciera {
  nombre: string;
  clasificacion: ClasificacionFinanciera | null;
  motivo: string;
  aliases: string;
  activa: 'Sí' | 'No';
  vigenciaDesde: string;
  producto: ProductoFinancieraFormulario;
  numeroSucursales: string;
  sucursales: SucursalFinancieraFormulario[];
}

const productoVacio = (): ProductoFinancieraFormulario => ({
  semanas: '',
  tasa: '',
  seguro: '',
  apertura: '',
  retencion: '',
  base: '',
  refinanciamiento: '',
  descripcion: '',
});

const sucursalVacia = (): SucursalFinancieraFormulario => ({
  zona: '',
  direccion: '',
  numeroAsesoras: '',
  valorSucursal: '',
});

const productoDesdeVersion = (
  version?: VersionFinancieraResumen | null,
): ProductoFinancieraFormulario => ({
  semanas: version?.semanas ?? '',
  tasa: version?.tasa ?? '',
  seguro: version?.seguro ?? '',
  apertura: version?.apertura ?? '',
  retencion: version?.retencion ?? '',
  base: version?.base ?? '',
  refinanciamiento: version?.refinanciamiento ?? '',
  descripcion: version?.descripcion ?? '',
});

const sucursalesDesdeVersion = (
  version?: VersionFinancieraResumen | null,
): SucursalFinancieraFormulario[] => (version?.sucursales ?? []).map((sucursal) => ({
  zona: sucursal.zona ?? '',
  direccion: sucursal.direccion ?? '',
  numeroAsesoras: sucursal.numero_asesoras === null ? '' : String(sucursal.numero_asesoras),
  valorSucursal: sucursal.valor_sucursal ?? '',
}));

const normalizarProductoFormulario = (
  producto: ProductoFinancieraFormulario,
): ProductoFinancieraFormulario => ({
  semanas: producto.semanas.trim(),
  tasa: producto.tasa.trim(),
  seguro: producto.seguro.trim(),
  apertura: producto.apertura.trim(),
  retencion: producto.retencion.trim(),
  base: producto.base.trim(),
  refinanciamiento: producto.refinanciamiento.trim(),
  descripcion: producto.descripcion.trim(),
});

const normalizarSucursalesFormulario = (
  sucursales: SucursalFinancieraFormulario[],
  cantidad: number,
) => sucursales.slice(0, cantidad).map((sucursal) => ({
  zona: sucursal.zona.trim(),
  direccion: sucursal.direccion.trim(),
  numero_asesoras: sucursal.numeroAsesoras.trim() === ''
    ? null
    : Number(sucursal.numeroAsesoras),
  valor_sucursal: sucursal.valorSucursal.trim(),
}));

const normalizarSucursalesVersion = (
  sucursales: SucursalFinancieraCompetidora[],
) => sucursales.map((sucursal) => ({
  zona: sucursal.zona ?? '',
  direccion: sucursal.direccion ?? '',
  numero_asesoras: sucursal.numero_asesoras,
  valor_sucursal: sucursal.valor_sucursal ?? '',
}));

const ProductoParticipacionResumen: React.FC<{
  version: VersionFinancieraResumen;
}> = ({ version }) => {
  const producto = [
    ['Semanas', version.semanas],
    ['Tasa', version.tasa],
    ['Seguro', version.seguro],
    ['Apertura', version.apertura],
    ['Retención', version.retencion],
    ['Base', version.base],
    ['Refinanciamiento', version.refinanciamiento],
    ['Descripción', version.descripcion],
  ].filter(([, value]) => Boolean(value)) as string[][];

  return (
    <View style={styles.businessData}>
      <Text allowFontScaling={false} style={styles.businessHeading}>PRODUCTO</Text>
      {producto.length > 0 ? producto.map(([label, value]) => (
        <Text key={label} allowFontScaling={false} style={styles.bodyText}>
          {label}: {value}
        </Text>
      )) : (
        <Text allowFontScaling={false} style={styles.metaText}>Sin datos registrados.</Text>
      )}
      <Text allowFontScaling={false} style={styles.businessHeading}>
        PARTICIPACIÓN MERCADO
      </Text>
      <Text allowFontScaling={false} style={styles.bodyText}>
        Número de sucursales: {version.sucursales.length}
      </Text>
      {version.sucursales.map((sucursal, index) => (
        <View key={`${version.id}-sucursal-${sucursal.orden}`} style={styles.branchSummary}>
          <Text allowFontScaling={false} style={styles.statusText}>Sucursal {index + 1}</Text>
          <Text allowFontScaling={false} style={styles.metaText}>
            Zona: {sucursal.zona || 'Sin dato'}
          </Text>
          <Text allowFontScaling={false} style={styles.metaText}>
            Dirección: {sucursal.direccion || 'Sin dato'}
          </Text>
          <Text allowFontScaling={false} style={styles.metaText}>
            # Asesoras: {sucursal.numero_asesoras ?? 'Sin dato'}
          </Text>
          <Text allowFontScaling={false} style={styles.metaText}>
            Valor $ de sucursal: {sucursal.valor_sucursal || 'Sin dato'}
          </Text>
        </View>
      ))}
    </View>
  );
};

const fechaLocalISO = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fechaLocalPresentacion = (date = new Date()): string => (
  formatISODateToDDMMMYYYY(fechaLocalISO(date))
);

const presentarFechaISO = (value: string): string => (
  formatISODateToDDMMMYYYY(value) || value
);

const formularioVacio = (): FormularioFinanciera => ({
  nombre: '',
  clasificacion: null,
  motivo: '',
  aliases: '',
  activa: 'Sí',
  vigenciaDesde: fechaLocalPresentacion(),
  producto: productoVacio(),
  numeroSucursales: '',
  sucursales: [],
});

const separarAliases = (value: string): string[] => value
  .split(',')
  .map((alias) => alias.trim().replace(/\s+/g, ' '))
  .filter(Boolean);

const normalizarComparacion = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toUpperCase();

const aliasesIguales = (left: readonly string[], right: readonly string[]): boolean => (
  left.length === right.length
  && left.every((value, index) => (
    normalizarComparacion(value) === normalizarComparacion(right[index] ?? '')
  ))
);

const mensajeError = (error: unknown): string => error instanceof ApiError
  ? error.message
  : 'No fue posible completar la operación. Intenta nuevamente.';

const etiquetaEstadoVersion = (estado: VersionFinancieraHistorial['estado']): string => ({
  PENDIENTE_APROBACION: 'PENDIENTE DE APROBACIÓN',
  APROBADA: 'APROBADA · FALTA PUBLICAR',
  RECHAZADA: 'RECHAZADA',
  PUBLICADA: 'PUBLICADA',
}[estado]);

const aliasVisible = (financiera: FinancieraCompetidoraResumen): string => (
  financiera.vigente?.aliases[0]
  ?? financiera.nombre
);

const clasificacionVisible = (
  financiera: FinancieraCompetidoraResumen,
): ClasificacionFinanciera | null => financiera.vigente?.clasificacion ?? null;

export const ParametrosScreen: React.FC<ParametrosScreenProps> = ({
  canUpdate,
  onBack,
}) => {
  const [vista, setVista] = useState<VistaParametros>('inicio');
  const [items, setItems] = useState<FinancieraCompetidoraResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<FinancieraCompetidoraResumen | null>(null);
  const [formulario, setFormulario] = useState<FormularioFinanciera>(formularioVacio);
  const [confirmarPublicacion, setConfirmarPublicacion] = useState(false);
  const [historial, setHistorial] = useState<VersionFinancieraHistorial[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [familiaEntrevista, setFamiliaEntrevista] = useState<FamiliaEntrevistaPresentacion | null>(null);
  const [origenOpciones, setOrigenOpciones] = useState<'entrevista' | 'visita-vecino'>('entrevista');

  const seccionesFinancieras = useMemo(() => {
    const ordenarPorAlias = (
      left: FinancieraCompetidoraResumen,
      right: FinancieraCompetidoraResumen,
    ) => aliasVisible(left).localeCompare(aliasVisible(right), 'es');

    return [
      {
        title: 'SE MUESTRAN EN EL POP-UP',
        data: items.filter(financieraApareceEnPopup).sort(ordenarPorAlias),
      },
      {
        title: 'NO SE MUESTRAN',
        data: items.filter((item) => !financieraApareceEnPopup(item)).sort(ordenarPorAlias),
      },
    ];
  }, [items]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listarFinancierasCompetidoras();
      setItems(response.items);
      setSeleccionada((actual) => actual
        ? response.items.find((item) => item.id === actual.id) ?? actual
        : actual);
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  const abrirNueva = () => {
    setSeleccionada(null);
    setFormulario(formularioVacio());
    setError(null);
    setVista('edicion');
  };

  const abrirEdicion = (
    financiera: FinancieraCompetidoraResumen,
  ) => {
    const vigente = financiera.vigente;
    setSeleccionada(financiera);
    setFormulario({
      nombre: financiera.nombre,
      clasificacion: vigente?.clasificacion ?? null,
      motivo: vigente?.motivo ?? '',
      aliases: vigente?.aliases.join(', ') || financiera.nombre,
      activa: financieraApareceEnPopup(financiera) ? 'Sí' : 'No',
      vigenciaDesde: fechaLocalPresentacion(),
      producto: productoDesdeVersion(vigente),
      numeroSucursales: vigente?.sucursales.length
        ? String(vigente.sucursales.length)
        : '',
      sucursales: sucursalesDesdeVersion(vigente),
    });
    setError(null);
    setVista('edicion');
  };

  const formularioValido = useMemo(() => {
    const nombre = formulario.nombre.trim().replace(/\s+/g, ' ');
    const motivo = formulario.motivo.trim();
    const aliases = separarAliases(formulario.aliases);
    const vigenciaDesdeTexto = formulario.vigenciaDesde.trim();
    const vigenciaDesde = toISODateFromDDMMMYYYY(vigenciaDesdeTexto);
    const motivoValido = motivo.length === 0 || motivo.length >= 5;
    const numeroSucursales = Number(formulario.numeroSucursales || '0');
    const sucursalesValidas = Number.isInteger(numeroSucursales)
      && numeroSucursales >= 0
      && numeroSucursales <= 10;
    const vigenciaValida = vigenciaDesdeTexto.length === 0
      || (vigenciaDesde.length > 0 && vigenciaDesde >= fechaLocalISO());
    if (!motivoValido || !vigenciaValida || !sucursalesValidas) return false;
    if (!seleccionada) return nombre.length >= 2 || (aliases[0]?.length ?? 0) >= 2;

    const vigente = seleccionada.vigente;
    const nombreActual = vigente?.nombre_oficial ?? seleccionada.nombre;
    const aliasesActuales = vigente?.aliases.length
      ? vigente.aliases
      : [seleccionada.nombre];
    const clasificacionActual = vigente?.clasificacion ?? null;
    const motivoActual = vigente?.motivo ?? '';
    const activaActual = financieraApareceEnPopup(seleccionada) ? 'Sí' : 'No';
    const nombreEfectivo = nombre || nombreActual;
    const aliasesEfectivos = aliases.length ? aliases : [nombreEfectivo];
    const productoActual = normalizarProductoFormulario(productoDesdeVersion(vigente));
    const productoPropuesto = normalizarProductoFormulario(formulario.producto);
    const sucursalesActuales = normalizarSucursalesVersion(vigente?.sucursales ?? []);
    const sucursalesPropuestas = normalizarSucursalesFormulario(
      formulario.sucursales,
      numeroSucursales,
    );

    return normalizarComparacion(nombreEfectivo) !== normalizarComparacion(nombreActual)
      || !aliasesIguales(aliasesEfectivos, aliasesActuales)
      || formulario.clasificacion !== clasificacionActual
      || motivo !== motivoActual
      || (vigenciaDesdeTexto.length > 0 && vigenciaDesde !== fechaLocalISO())
      || formulario.activa !== activaActual
      || JSON.stringify(productoPropuesto) !== JSON.stringify(productoActual)
      || JSON.stringify(sucursalesPropuestas) !== JSON.stringify(sucursalesActuales);
  }, [formulario, seleccionada]);

  const cambiarProducto = (campo: keyof ProductoFinancieraFormulario, value: string) => {
    setFormulario((actual) => ({
      ...actual,
      producto: { ...actual.producto, [campo]: value },
    }));
  };

  const cambiarNumeroSucursales = (value: string) => {
    const cantidad = Number(value);
    if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > 10) return;
    setFormulario((actual) => {
      const sucursales = [...actual.sucursales];
      while (sucursales.length < cantidad) sucursales.push(sucursalVacia());
      return { ...actual, numeroSucursales: value, sucursales };
    });
  };

  const cambiarSucursal = (
    index: number,
    campo: keyof SucursalFinancieraFormulario,
    value: string,
  ) => {
    setFormulario((actual) => {
      const sucursales = [...actual.sucursales];
      while (sucursales.length <= index) sucursales.push(sucursalVacia());
      sucursales[index] = { ...sucursales[index], [campo]: value };
      return { ...actual, sucursales };
    });
  };

  const guardarYPublicar = async () => {
    if (!formularioValido) return;
    setGuardando(true);
    setError(null);
    try {
      const producto = normalizarProductoFormulario(formulario.producto);
      const numeroSucursales = Number(formulario.numeroSucursales || '0');
      const sucursales = normalizarSucursalesFormulario(
        formulario.sucursales,
        numeroSucursales,
      );
      const vigenciaDesde = toISODateFromDDMMMYYYY(formulario.vigenciaDesde);
      await publicarCambioFinanciera({
        financiera_id: seleccionada?.id,
        nombre: formulario.nombre.trim() || undefined,
        clasificacion: formulario.clasificacion,
        motivo: formulario.motivo.trim() || undefined,
        aliases: separarAliases(formulario.aliases),
        activa: formulario.activa === 'Sí',
        semanas: producto.semanas || undefined,
        tasa: producto.tasa || undefined,
        seguro: producto.seguro || undefined,
        apertura: producto.apertura || undefined,
        retencion: producto.retencion || undefined,
        base: producto.base || undefined,
        refinanciamiento: producto.refinanciamiento || undefined,
        descripcion: producto.descripcion || undefined,
        sucursales: sucursales.map((sucursal) => ({
          zona: sucursal.zona || undefined,
          direccion: sucursal.direccion || undefined,
          numero_asesoras: sucursal.numero_asesoras ?? undefined,
          valor_sucursal: sucursal.valor_sucursal || undefined,
        })),
        vigencia_desde: vigenciaDesde || undefined,
        expected_revision: seleccionada?.ultima_revision ?? 0,
      });
      await cargar();
      setConfirmarPublicacion(false);
      setVista('financieras');
    } catch (requestError) {
      setConfirmarPublicacion(false);
      setError(mensajeError(requestError));
    } finally {
      setGuardando(false);
    }
  };

  const abrirHistorial = async (financiera: FinancieraCompetidoraResumen) => {
    setSeleccionada(financiera);
    setHistorial([]);
    setError(null);
    setLoading(true);
    setVista('historial');
    try {
      const response = await obtenerHistorialFinancieraCompetidora(financiera.id);
      setHistorial(response.versiones);
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const retroceder = () => {
    if (vista === 'inicio') onBack();
    else if (vista === 'verificacion') setVista('inicio');
    else if (vista === 'integrantes-verificadas-finalizar') setVista('verificacion');
    else if (vista === 'pasos-verificacion') setVista('verificacion');
    else if (vista === 'entrevista') setVista('verificacion');
    else if (vista === 'visita-vecino') setVista('verificacion');
    else if (vista === 'conclusiones') setVista('verificacion');
    else if (
      vista === 'calificacion-semana-credito'
      || vista === 'calificacion-ciclos-credito'
      || vista === 'tolerancia-semana-desembolso'
      || vista === 'concordancia-ficha'
      || vista === 'concordancia-prestamo'
      || vista === 'calificacion-promedio-evidencias'
    ) setVista('conclusiones');
    else if (vista === 'opciones-entrevista') setVista(origenOpciones);
    else if (vista === 'financieras') setVista('entrevista');
    else if (vista === 'historial' && seleccionada) setVista('edicion');
    else if (clasificacionMotivosPorVista[vista]) setVista('entrevista');
    else setVista('financieras');
  };

  const clasificacionMotivos = clasificacionMotivosPorVista[vista];
  if (clasificacionMotivos) {
    return (
      <MotivosClasificacionEvidenciaScreen
        clasificacion={clasificacionMotivos}
        canUpdate={canUpdate}
        onBack={retroceder}
      />
    );
  }

  if (vista === 'opciones-entrevista' && familiaEntrevista) {
    return (
      <OpcionesEntrevistaScreen
        familia={familiaEntrevista.familia}
        titulo={familiaEntrevista.titulo}
        extensible={familiaEntrevista.extensible}
        canUpdate={canUpdate}
        onBack={retroceder}
      />
    );
  }

  if (vista === 'pasos-verificacion') {
    return (
      <MatrizPasosVerificacionScreen
        canUpdate={canUpdate}
        onBack={retroceder}
      />
    );
  }

  if (vista === 'integrantes-verificadas-finalizar') {
    return (
      <IntegrantesVerificadasParametroScreen
        canUpdate={canUpdate}
        onBack={retroceder}
      />
    );
  }

  if (vista === 'entrevista') {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={retroceder} moduleTheme="parameters" />
        <ScreenTitleBar title="Parámetros de entrevista" moduleTheme="parameters" />
        <FlatList
          data={CATALOGOS_ENTREVISTA}
          keyExtractor={(item) => item.key}
          initialNumToRender={CATALOGOS_ENTREVISTA.length}
          contentContainerStyle={styles.parameterList}
          renderItem={({ item }) => (
            <TaskMenuButton
              title={item.title}
              description={item.description}
              iconLabel={item.iconLabel}
              moduleTheme="parameters"
              onPress={() => {
                if (item.familia) {
                  setFamiliaEntrevista(item.familia);
                  setOrigenOpciones('entrevista');
                  setVista('opciones-entrevista');
                  return;
                }
                if (item.vista === 'financieras') {
                  setVista('financieras');
                  void cargar();
                  return;
                }
                if (item.vista) setVista(item.vista);
              }}
            />
          )}
        />
      </ScreenContainer>
    );
  }

  if (vista === 'visita-vecino') {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={retroceder} moduleTheme="parameters" />
        <ScreenTitleBar title="Parámetros de visita al vecino" moduleTheme="parameters" />
        <FlatList
          data={CATALOGOS_VISITA_VECINO}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.parameterList}
          ListHeaderComponent={(
            <Card style={[styles.homeIntro, styles.outlinedCard]}>
              <SectionTitle title="Configura las opciones del pop-up" />
              <Text allowFontScaling={false} style={styles.helpText}>
                Sí y No conservan listas independientes. La verificadora podrá marcar una o varias opciones.
              </Text>
            </Card>
          )}
          renderItem={({ item }) => (
            <TaskMenuButton
              title={item.title}
              description={item.description}
              iconLabel={item.iconLabel}
              moduleTheme="parameters"
              onPress={() => {
                if (!item.familia) return;
                setFamiliaEntrevista(item.familia);
                setOrigenOpciones('visita-vecino');
                setVista('opciones-entrevista');
              }}
            />
          )}
        />
      </ScreenContainer>
    );
  }

  if (vista === 'conclusiones') {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={retroceder} moduleTheme="parameters" />
        <ScreenTitleBar title="Parámetros de conclusiones" moduleTheme="parameters" />
        <FlatList
          data={CATALOGOS_CONCLUSIONES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.parameterList}
          renderItem={({ item }) => (
            <TaskMenuButton
              title={item.title}
              description={item.description}
              iconLabel={item.iconLabel}
              moduleTheme="parameters"
              onPress={() => setVista(item.vista)}
            />
          )}
        />
      </ScreenContainer>
    );
  }

  if (vista === 'calificacion-semana-credito') {
    return (
      <CalificacionSemanaCreditoScreen
        canUpdate={canUpdate}
        onBack={retroceder}
      />
    );
  }

  if (vista === 'calificacion-ciclos-credito') {
    return (
      <CalificacionCiclosCreditoScreen
        canUpdate={canUpdate}
        onBack={retroceder}
      />
    );
  }

  if (vista === 'tolerancia-semana-desembolso') {
    return (
      <ToleranciaSemanaDesembolsoScreen
        canUpdate={canUpdate}
        onBack={retroceder}
      />
    );
  }

  if (vista === 'concordancia-ficha') {
    return <ConcordanciaFichaScreen canUpdate={canUpdate} onBack={retroceder} />;
  }

  if (vista === 'concordancia-prestamo') {
    return <ConcordanciaPrestamoScreen canUpdate={canUpdate} onBack={retroceder} />;
  }

  if (vista === 'calificacion-promedio-evidencias') {
    return <CalificacionPromedioEvidenciasScreen canUpdate={canUpdate} onBack={retroceder} />;
  }

  if (vista === 'edicion') {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={retroceder} moduleTheme="parameters" />
        <ScreenTitleBar title="Parámetros de financiera" moduleTheme="parameters" />
        <ScrollView contentContainerStyle={styles.formContent}>
          <Card style={[styles.formCard, styles.outlinedCard]}>
            <SectionTitle
              title={seleccionada ? 'Datos de la financiera' : 'Agregar financiera'}
            />
            <TextInput
              label="Alias para el pop-up"
              value={formulario.aliases}
              onChangeText={(aliases) => setFormulario((actual) => ({ ...actual, aliases }))}
              moduleTheme="parameters"
              helperText="Escribe primero cómo la conocen las integrantes. Si hay otros nombres, sepáralos con comas."
              editable={canUpdate}
              strongBorder
            />
            <TextInput
              label="Razón social"
              value={formulario.nombre}
              onChangeText={(nombre) => setFormulario((actual) => ({ ...actual, nombre }))}
              moduleTheme="parameters"
              editable={canUpdate}
              strongBorder
            />
            <FormField label="Clasificación">
              <SemanticChoiceGroup
                value={formulario.clasificacion}
                options={OPCIONES_SEMAFORO_FINANCIERA}
                allowClear
                onSelect={(clasificacion) => setFormulario((actual) => ({
                  ...actual,
                  clasificacion: clasificacion as ClasificacionFinanciera | null,
                }))}
                disabled={!canUpdate}
              />
            </FormField>
            <TextInput
              label="Motivo de la clasificación"
              value={formulario.motivo}
              onChangeText={(motivo) => setFormulario((actual) => ({ ...actual, motivo }))}
              moduleTheme="parameters"
              helperText="Explica el criterio operativo; si lo capturas, escribe al menos 5 caracteres."
              error={formulario.motivo.trim().length > 0 && formulario.motivo.trim().length < 5
                ? 'Escribe al menos 5 caracteres.'
                : undefined}
              multiline
              numberOfLines={3}
              editable={canUpdate}
              strongBorder
            />
            <TextInput
              label="Vigencia desde"
              value={formulario.vigenciaDesde}
              onChangeText={(vigenciaDesde) => setFormulario((actual) => ({
                ...actual,
                vigenciaDesde: vigenciaDesde.toUpperCase(),
              }))}
              moduleTheme="parameters"
              helperText="Debe ser hoy o una fecha futura. Usa el formato DD-MMM-AAAA."
              error={formulario.vigenciaDesde.trim().length > 0
                && (!toISODateFromDDMMMYYYY(formulario.vigenciaDesde)
                  || toISODateFromDDMMMYYYY(formulario.vigenciaDesde) < fechaLocalISO())
                ? 'La fecha debe ser válida, de hoy o futura.'
                : undefined}
              autoCapitalize="characters"
              maxLength={11}
              editable={canUpdate}
              strongBorder
            />
            <FinancieraPopupVisibilityField
              value={formulario.activa}
              onChange={(activa) => setFormulario((actual) => ({
                ...actual,
                activa,
              }))}
              disabled={!canUpdate}
            />
          </Card>
          <FinancieraProductMarketFields
            producto={formulario.producto}
            numeroSucursales={formulario.numeroSucursales}
            sucursales={formulario.sucursales}
            onProductoChange={cambiarProducto}
            onNumeroSucursalesChange={cambiarNumeroSucursales}
            onSucursalChange={cambiarSucursal}
            disabled={!canUpdate}
          />
          {seleccionada ? (
            <SecondaryButton
              title="Historial"
              moduleTheme="parameters"
              onPress={() => void abrirHistorial(seleccionada)}
              style={styles.fullButton}
            />
          ) : null}
          {error ? <Text allowFontScaling={false} style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
        <BottomActionBar
          primaryLabel={canUpdate ? 'Guardar y publicar' : 'Sólo lectura'}
          secondaryLabel="Cancelar"
          onPrimary={() => setConfirmarPublicacion(true)}
          onSecondary={retroceder}
          primaryDisabled={!canUpdate || !formularioValido || guardando}
          secondaryDisabled={guardando}
          helperText={canUpdate
            ? 'El cambio se publica directamente y queda registrado en el historial.'
            : 'Sólo Administración puede modificar y publicar estos parámetros.'}
        />
        <ConfirmDialog
          visible={confirmarPublicacion}
          title="¿Guardar y publicar?"
          message={formulario.activa === 'No'
            ? 'La financiera dejará de mostrarse en el pop-up desde la vigencia indicada.'
            : 'Los cambios quedarán publicados desde la vigencia indicada.'}
          confirmLabel="Sí, publicar"
          busy={guardando}
          onConfirm={guardarYPublicar}
          onCancel={() => setConfirmarPublicacion(false)}
        />
      </ScreenContainer>
    );
  }

  if (vista === 'historial') {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={retroceder} moduleTheme="parameters" />
        <ScreenTitleBar title="Historial de clasificación" moduleTheme="parameters" />
        {loading ? (
          <ScreenState title="Consultando historial" loading />
        ) : error ? (
          <ScreenState title="No se pudo consultar" message={error} actionLabel="Volver" onAction={retroceder} />
        ) : (
          <FlatList
            data={historial}
            keyExtractor={(version) => version.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={(
              <Card style={styles.outlinedCard}>
                <SectionTitle title={seleccionada?.nombre ?? 'Financiera'} />
              </Card>
            )}
            renderItem={({ item }) => {
              const presentation = item.clasificacion
                ? CLASIFICACIONES_FINANCIERA[item.clasificacion]
                : null;
              return (
                <Card style={[styles.historyCard, styles.outlinedCard]}>
                  <View style={styles.cardHeader}>
                    <Text allowFontScaling={false} style={styles.cardTitle}>REVISIÓN {item.revision}</Text>
                    <StatusBadge
                      label={presentation?.shortLabel ?? 'SIN CLASIFICAR'}
                      tone={presentation?.tone ?? 'progress'}
                    />
                  </View>
                  <Text allowFontScaling={false} style={styles.statusText}>
                    {etiquetaEstadoVersion(item.estado)}
                  </Text>
                  <Text allowFontScaling={false} style={styles.bodyText}>
                    Nombre oficial: {item.nombre_oficial}
                  </Text>
                  <Text allowFontScaling={false} style={styles.metaText}>
                    Alias del pop-up: {item.aliases[0] ?? item.nombre_oficial}
                  </Text>
                  {item.motivo ? (
                    <Text allowFontScaling={false} style={styles.bodyText}>{item.motivo}</Text>
                  ) : null}
                  <Text allowFontScaling={false} style={styles.metaText}>
                    Vigencia: {presentarFechaISO(item.vigencia_desde)}
                    {item.vigencia_hasta ? ` a ${presentarFechaISO(item.vigencia_hasta)}` : ''}
                  </Text>
                  <ProductoParticipacionResumen version={item} />
                  {item.motivo_rechazo ? (
                    <Text allowFontScaling={false} style={styles.errorText}>
                      Rechazo: {item.motivo_rechazo}
                    </Text>
                  ) : null}
                </Card>
              );
            }}
          />
        )}
      </ScreenContainer>
    );
  }

  if (vista === 'financieras') {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={retroceder} moduleTheme="parameters" />
        <ScreenTitleBar title="Financieras competidoras" moduleTheme="parameters" />
        {loading && items.length === 0 ? (
          <ScreenState title="Consultando catálogo" loading />
        ) : error && items.length === 0 ? (
          <ScreenState title="No se pudo consultar" message={error} actionLabel="Reintentar" onAction={cargar} />
        ) : (
          <SectionList
            sections={seccionesFinancieras}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.catalogListContent}
            refreshing={loading}
            onRefresh={cargar}
            stickySectionHeadersEnabled={false}
            ListHeaderComponent={canUpdate || error ? (
              <View style={styles.catalogListHeader}>
                {canUpdate ? (
                  <PrimaryButton
                    title="Agregar financiera"
                    moduleTheme="parameters"
                    onPress={abrirNueva}
                    style={styles.fullButton}
                  />
                ) : null}
                {error ? <Text allowFontScaling={false} style={styles.errorText}>{error}</Text> : null}
              </View>
            ) : null}
            renderSectionHeader={({ section }) => (
              <View style={styles.catalogSectionHeader}>
                <Text allowFontScaling={false} style={styles.catalogSectionTitle}>
                  {section.title}
                </Text>
              </View>
            )}
            renderSectionFooter={({ section }) => section.data.length === 0 ? (
              <Text allowFontScaling={false} style={styles.emptySectionText}>
                Ninguna financiera
              </Text>
            ) : null}
            renderItem={({ item }) => (
              <FinancieraStatusRow
                alias={aliasVisible(item)}
                clasificacion={clasificacionVisible(item)}
                onPress={() => abrirEdicion(item)}
                testID={`financiera-row-${item.id}`}
              />
            )}
          />
        )}
      </ScreenContainer>
    );
  }

  if (vista === 'verificacion') {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={retroceder} moduleTheme="parameters" />
        <ScreenTitleBar title="Parámetros de verificación" moduleTheme="parameters" />
        <FlatList
          key="verification-parameter-rows"
          data={CATALOGOS_VERIFICACION}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.parameterList}
          ListHeaderComponent={(
            <Card style={[styles.homeIntro, styles.outlinedCard]}>
              <SectionTitle title="Selecciona un catálogo" />
              <Text allowFontScaling={false} style={styles.helpText}>
                Aquí se concentran los parámetros que utiliza Verificación.
              </Text>
            </Card>
          )}
          renderItem={({ item }) => (
            <TaskMenuButton
              title={item.title}
              description={item.description}
              iconLabel={item.iconLabel}
              moduleTheme="parameters"
              accessibilityHint={`Abre ${item.title}`}
              onPress={() => setVista(item.vista)}
            />
          )}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer moduleTheme="parameters">
      <AppHeader showBackButton onBackPress={retroceder} moduleTheme="parameters" />
      <ScreenTitleBar title="Parámetros" moduleTheme="parameters" />
      <FlatList
        key="parameter-modules-grid"
        data={MODULOS_PARAMETROS}
        numColumns={2}
        keyExtractor={(item, index) => item?.key ?? `grid-spacer-${index}`}
        contentContainerStyle={styles.moduleGrid}
        columnWrapperStyle={styles.moduleRow}
        ListHeaderComponent={(
          <Card style={[styles.homeIntro, styles.outlinedCard]}>
            <SectionTitle title="Selecciona un módulo" />
            <Text allowFontScaling={false} style={styles.helpText}>
              Los parámetros están agrupados según el módulo donde se utilizan.
            </Text>
          </Card>
        )}
        renderItem={({ item }) => item ? (
          <ModuleCard
            title={item.title}
            description={item.description}
            iconLabel={item.iconLabel}
            moduleTheme="parameters"
            onPress={item.vista ? () => setVista(item.vista as VistaParametros) : undefined}
            disabled={!item.vista}
            statusLabel={item.vista ? undefined : 'Sin parámetros'}
          />
        ) : <View style={styles.gridSpacer} />}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  moduleGrid: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  moduleRow: { gap: spacing.lg },
  parameterList: {
    width: '100%',
    maxWidth: layout.detailMaxWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  gridSpacer: { flex: 1 },
  homeIntro: { marginBottom: spacing.lg },
  listContent: {
    width: '100%',
    maxWidth: layout.detailMaxWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  catalogListContent: {
    width: '100%',
    maxWidth: layout.detailMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  catalogListHeader: { gap: spacing.md, marginBottom: spacing.md },
  catalogSectionHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.gray[200],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[500],
  },
  catalogSectionTitle: { ...typography.captionStrong, color: colors.gray[800] },
  emptySectionText: {
    ...typography.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  formContent: {
    width: '100%',
    maxWidth: layout.formMaxWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    flexGrow: 1,
  },
  formCard: { gap: spacing.md },
  outlinedCard: { borderWidth: 2, borderColor: colors.gray[400] },
  helpText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  errorText: { ...typography.body, color: colors.danger, marginTop: spacing.sm },
  historyCard: { gap: spacing.sm },
  businessData: { gap: spacing.sm },
  businessHeading: {
    ...typography.captionStrong,
    color: colors.gray[700],
    marginTop: spacing.sm,
  },
  branchSummary: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: spacing.sm,
    backgroundColor: colors.gray[50],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, flex: 1 },
  bodyText: { ...typography.body, color: colors.textPrimary },
  metaText: { ...typography.caption, color: colors.textSecondary },
  statusText: { ...typography.captionStrong, color: colors.textSecondary },
  fullButton: { flex: 0, width: '100%' },
});
