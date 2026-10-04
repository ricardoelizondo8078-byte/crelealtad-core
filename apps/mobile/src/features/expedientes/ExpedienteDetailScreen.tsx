import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  Card,
  IntegranteCard,
  PrimaryButton,
  ScreenContainer,
  ScreenTitleBar,
  StickySectionHeader,
} from '../../components/ui';
import { api } from '../../services/api-client';
import {
  completarDistanciasAproximadas,
  DISTANCIA_MAXIMA_TESORERA_KM,
} from '../../services/domicilio-distance';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import { esRutaDocumentoServidor } from '../../utils/documents';
import { MAX_SOLICITUD_AMOUNT } from '../../config/parameters';
import { DocumentosScreen } from '../documentos';
import { IntegranteFormScreen } from '../integrantes';
import { SolicitudFormScreen } from '../solicitudes';
import { ConfirmarIntegrantesScreen } from './ConfirmarIntegrantesScreen';

export interface ExpedienteDetail {
  id: string;
  nombre?: string;
  estado: string;
  grupo_id: string;
  estado_fecha?: string;
  tesorera_integrante_id?: string | null;
}

interface GrupoInfo {
  id: string;
  nombre: string;
}

interface IntegranteStatusViewModel {
  id: string;
  nombre: string;
  telefono: string;
  montoSolicitado: number | null;
  montoAutorizadoAnterior: number | null;
  comparacionMontoDisponible: boolean;
  cicloNumeroActual: number | null;
  es_nueva_con_nosotros: boolean;
  edad: number | null;
  supera_limite_edad: boolean;
  distancia_tesorera_aprox_km: number | null;
  montoMaximoSolicitable?: number;
  estado: string;
  motivo_retiro?: 'DESCANSA_RENOVACION' | 'DOCUMENTACION_INCOMPLETA' | 'DECIDIO_NO_CONTINUAR' | 'OTRO' | null;
  motivo_retiro_detalle?: string | null;
  es_tesorera: boolean;
  solicitudStatus: 'Capturada' | 'Pendiente';
  documentosStatus: 'Capturados' | 'Pendientes';
  overallStatus: 'Completa' | 'Pendiente' | 'Retirada';
  pasoActual: number; // Siguiente paso a llenar (1-7)
  pasoCompletado: number; // Último paso completado (0-7) para la barra de progreso
}

type TendenciaMonto = 'aumenta' | 'disminuye' | 'sin_cambio' | 'sin_captura' | 'sin_comparacion';

const compararMontos = (
  montoSolicitado: number | null,
  montoAutorizadoAnterior: number | null,
  comparacionDisponible: boolean,
): { tendencia: TendenciaMonto; diferencia: number } => {
  if (montoSolicitado === null) {
    return { tendencia: 'sin_captura', diferencia: 0 };
  }
  if (!comparacionDisponible || montoAutorizadoAnterior === null) {
    return { tendencia: 'sin_comparacion', diferencia: 0 };
  }

  const diferencia = montoSolicitado - montoAutorizadoAnterior;
  if (diferencia > 0) return { tendencia: 'aumenta', diferencia };
  if (diferencia < 0) return { tendencia: 'disminuye', diferencia };
  return { tendencia: 'sin_cambio', diferencia: 0 };
};

interface ExpedienteDetailScreenProps {
  expedienteId: string;
  onBack?: () => void;
}

export const ExpedienteDetailScreen: React.FC<ExpedienteDetailScreenProps> = ({ expedienteId, onBack }) => {
  const [expediente, setExpediente] = useState<ExpedienteDetail | null>(null);
  const [grupo, setGrupo] = useState<GrupoInfo | null>(null);
  const [integrantes, setIntegrantes] = useState<IntegranteStatusViewModel[]>([]);
  const [integrantesNuevasConfirmadas, setIntegrantesNuevasConfirmadas] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedintegranteId, setSelectedintegranteId] = useState<string | null>(null);
  const [selectedintegranteNombre, setSelectedintegranteNombre] = useState<string | null>(null);
  const [selectedSolicitantePosition, setSelectedSolicitantePosition] = useState<number | null>(null);
  const [activeSolicitanteView, setActiveSolicitanteView] = useState<'solicitud' | 'documentos' | null>(null);
  const [initialStep, setInitialStep] = useState<number | undefined>(undefined);
  const [showVerificationSelection, setShowVerificationSelection] = useState(false);

  const calcularDiasEnEstado = (estadoFecha?: string): number => {
    if (!estadoFecha) return 0;
    const fechaEstado = new Date(estadoFecha);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - fechaEstado.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const loadExpediente = async () => {
    try {
      const data = await api.get<any>(`/expedientes/${expedienteId}`);
      setExpediente(data);

      // Cargar información del grupo
      if (data.grupo_id) {
        try {
          const grupoData = await api.get<any>(`/grupos/${data.grupo_id}`);
          setGrupo(grupoData);
        } catch {
          // Si falla, no mostramos el nombre del grupo
        }
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
    }
  };

  const loadSolicitantes = async (integranteNuevaId?: string) => {
    try {
      const data = await api.get<any[]>(`/integrantes/expediente/${expedienteId}`);
      const dataConDistancias = await completarDistanciasAproximadas(data);
      const enriched = await Promise.all(
        dataConDistancias.map(async (integrante: any) => {
          const esNuevaConfirmada = integrante.es_nueva_con_nosotros === true
            || integrante.id === integranteNuevaId
            || integrantesNuevasConfirmadas.has(integrante.id);
          try {
            let solicitud = null;
            try {
              solicitud = await api.get<any>(`/solicitudes/integrante/${integrante.id}`);
            } catch {
              // No tiene solicitud todavía
            }
            const montoMaximoSolicitable = Number(integrante.montoMaximoSolicitable)
              || MAX_SOLICITUD_AMOUNT;
            const montoSolicitado = Number(solicitud?.monto_solicitado);
            const montoSolicitadoConfirmado = Boolean(solicitud?.monto_solicitado_confirmado_at)
              && Number.isFinite(montoSolicitado)
              && montoSolicitado > 0;
            const montoSolicitadoValido = montoSolicitadoConfirmado
              && montoSolicitado <= montoMaximoSolicitable;

            // Verificar documentos OBLIGATORIOS directamente desde la solicitud
            // Los 3 documentos obligatorios son: INE, Comprobante Domicilio y Solicitud Firmada.
            const requiredDocumentsCaptured = solicitud ? (
              esRutaDocumentoServidor(solicitud.doc_ine_ruta) &&
              esRutaDocumentoServidor(solicitud.doc_comprobante_ruta) &&
              esRutaDocumentoServidor(solicitud.doc_solicitud_firmada_ruta)
            ) : false;

            // BUG 2 FIX: Solo marcar como "Capturada" si el estado es SUJETA_CREDITO
            const solicitudCapturada = ['SUJETA_CREDITO', 'EN_VERIFICACION', 'AUTORIZADA'].includes(integrante.estado)
              && montoSolicitadoValido;
            const retirada = integrante.estado === 'RETIRADA';

            // Calcular paso actual (1-7)
            // Determinar el último paso COMPLETADO (para la barra de progreso)
            let pasoCompletado = 0;

            if (solicitud) {
              // Paso 1 completo: tiene CURP, fecha_nac y genero
              if (solicitud.curp && solicitud.fecha_nac && solicitud.genero) {
                pasoCompletado = 1;

                // Paso 2 completo: tiene domicilio
                if (solicitud.dom_calle && solicitud.dom_colonia && solicitud.dom_municipio) {
                  pasoCompletado = 2;

                  // Paso 3 completo: tiene referencias
                  if (solicitud.ref1_nombre && solicitud.ref2_nombre) {
                    pasoCompletado = 3;

                    // Paso 4 completo: tiene negocio
                    if (solicitud.negocio_giro && solicitud.negocio_ingreso_semanal) {
                      pasoCompletado = 4;

                      // Paso 5 completo: tiene beneficiario
                      if (solicitud.beneficiario_nombre && solicitud.beneficiario_parentesco) {
                        pasoCompletado = 5;

                        // Paso 6 completo: tiene validaciones
                        if (
                          ['SI', 'NO'].includes(solicitud.tiene_medidor_luz) &&
                          ['SI', 'NO'].includes(solicitud.vive_max_5km_tesorera) &&
                          montoSolicitadoValido
                        ) {
                          pasoCompletado = 6;

                          // Paso 7 completo: tiene documentos
                          if (requiredDocumentsCaptured) {
                            pasoCompletado = 7;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            // El siguiente paso a llenar es pasoCompletado + 1 (máximo 7)
            const pasoSiguiente = Math.min(pasoCompletado + 1, 7);

            return {
              ...integrante,
              montoSolicitado: montoSolicitadoConfirmado ? montoSolicitado : null,
              montoAutorizadoAnterior: integrante.montoAutorizadoAnterior == null
                ? null
                : Number(integrante.montoAutorizadoAnterior),
              comparacionMontoDisponible: integrante.comparacionMontoDisponible === true,
              cicloNumeroActual: integrante.cicloNumeroActual == null
                ? null
                : Number(integrante.cicloNumeroActual),
              es_nueva_con_nosotros: esNuevaConfirmada,
              edad: Number.isFinite(Number(integrante.edad)) ? Number(integrante.edad) : null,
              supera_limite_edad: integrante.supera_limite_edad === true,
              distancia_tesorera_aprox_km: integrante.distancia_tesorera_aprox_km != null
                && Number.isFinite(Number(integrante.distancia_tesorera_aprox_km))
                ? Number(integrante.distancia_tesorera_aprox_km)
                : null,
              montoMaximoSolicitable,
              solicitudStatus: solicitudCapturada ? 'Capturada' : 'Pendiente',
              documentosStatus: requiredDocumentsCaptured ? 'Capturados' : 'Pendientes',
              overallStatus: retirada
                ? 'Retirada'
                : solicitudCapturada && requiredDocumentsCaptured
                  ? 'Completa'
                  : 'Pendiente',
              pasoActual: pasoSiguiente, // Para abrir en el paso correcto
              pasoCompletado, // Para mostrar el progreso en la barra
            } as IntegranteStatusViewModel;
          } catch {
            return {
              ...integrante,
              es_nueva_con_nosotros: esNuevaConfirmada,
              solicitudStatus: 'Pendiente',
              documentosStatus: 'Pendientes',
              overallStatus: integrante.estado === 'RETIRADA' ? 'Retirada' : 'Pendiente',
              pasoActual: 1,
              pasoCompletado: 0,
            } as IntegranteStatusViewModel;
          }
        }),
      );

      setIntegrantes(enriched);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadExpediente(), loadSolicitantes()]);
      setLoading(false);
    };

    loadAll();
  }, [expedienteId]);

  const handleSaved = async (created?: { id: string; es_nueva_con_nosotros: boolean }) => {
    const integranteNuevaId = created?.es_nueva_con_nosotros ? created.id : undefined;
    if (integranteNuevaId) {
      setIntegrantesNuevasConfirmadas((current) => new Set(current).add(integranteNuevaId));
    }
    setShowForm(false);
    setSelectedintegranteId(null);
    setSelectedintegranteNombre(null);
    setSelectedSolicitantePosition(null);
    setActiveSolicitanteView(null);
    setInitialStep(undefined);
    await loadSolicitantes(integranteNuevaId);
  };

  // BUG 1 FIX: Actualización inmediata mientras edita
  const handleDataChange = useCallback((integranteId: string, data: { nombre?: string; telefono?: string; montoSolicitado?: number }) => {
    setIntegrantes((prev) =>
      prev.map((s) =>
        s.id === integranteId
          ? {
              ...s,
              ...(data.nombre !== undefined && { nombre: data.nombre }),
              ...(data.telefono !== undefined && { telefono: data.telefono }),
              ...(data.montoSolicitado !== undefined && { montoSolicitado: data.montoSolicitado }),
            }
          : s
      )
    );
  }, []);

  const handleSendToVerification = () => {
    if (integrantes.length === 0) {
      Alert.alert('No se puede enviar a verificación', 'El expediente no tiene integrantes.');
      return;
    }
    setShowVerificationSelection(true);
  };

  if (showVerificationSelection) {
    return (
      <ConfirmarIntegrantesScreen
        expedienteId={expedienteId}
        grupoNombre={grupo?.nombre}
        integrantes={integrantes}
        onBack={() => setShowVerificationSelection(false)}
        onRefresh={loadSolicitantes}
        onContinueCapture={(integrante) => {
          const index = integrantes.findIndex((item) => item.id === integrante.id);
          setShowVerificationSelection(false);
          setSelectedintegranteId(integrante.id);
          setSelectedintegranteNombre(integrante.nombre);
          setSelectedSolicitantePosition(index >= 0 ? index + 1 : null);
          setInitialStep(integrante.pasoActual);
          setActiveSolicitanteView('solicitud');
        }}
        onSent={(data) => {
          setShowVerificationSelection(false);
          setExpediente(data as ExpedienteDetail);
          void Promise.all([loadExpediente(), loadSolicitantes()]);
        }}
      />
    );
  }

  if (selectedintegranteId && activeSolicitanteView === 'solicitud') {
    return (
      <SolicitudFormScreen
        integranteId={selectedintegranteId}
        integranteNombre={selectedintegranteNombre ?? undefined}
        groupName={grupo?.nombre}
        integrantePosition={selectedSolicitantePosition ?? undefined}
        integrantesTotal={integrantes.length || undefined}
        initialStep={initialStep}
        onSaved={handleSaved}
        onBack={handleSaved}
        onDataChange={(data) => handleDataChange(selectedintegranteId, data)}
      />
    );
  }

  if (selectedintegranteId && activeSolicitanteView === 'documentos') {
    return (
      <DocumentosScreen
        integranteId={selectedintegranteId}
        integranteNombre={selectedintegranteNombre ?? undefined}
        integrantePosition={selectedSolicitantePosition ?? undefined}
        integrantesTotal={integrantes.length || undefined}
        groupName={grupo?.nombre}
        onSaved={handleSaved}
        onBack={handleSaved}
      />
    );
  }

  if (showForm) {
    return <IntegranteFormScreen expedienteId={expedienteId} onSaved={handleSaved} onBack={handleSaved} />;
  }

  const completadas = integrantes.filter((integrante) => integrante.overallStatus === 'Completa').length;
  const retiradas = integrantes.filter((integrante) => integrante.overallStatus === 'Retirada').length;
  const noAprobadas = integrantes.filter((integrante) => integrante.estado === 'RECHAZADA').length;
  const pendientes = integrantes.length - completadas - retiradas - noAprobadas;
  const ciclosActuales = [...new Set(
    integrantes
      .map((integrante) => integrante.cicloNumeroActual)
      .filter((ciclo): ciclo is number => typeof ciclo === 'number' && Number.isInteger(ciclo) && ciclo > 0),
  )];
  const cicloActual = ciclosActuales.length === 1 ? ciclosActuales[0] : null;
  const integrantesCicloAnterior = integrantes.filter((integrante) => (
    integrante.comparacionMontoDisponible
    && integrante.montoAutorizadoAnterior !== null
  ));
  const montoPrestadoAnterior = integrantesCicloAnterior.reduce(
    (total, integrante) => total + (integrante.montoAutorizadoAnterior ?? 0),
    0,
  );
  const montoDocumentado = integrantes
    .filter((integrante) => integrante.overallStatus === 'Completa')
    .reduce((total, integrante) => total + (integrante.montoSolicitado ?? 0), 0);
  const diferenciaIntegrantes = completadas - integrantesCicloAnterior.length;
  const diferenciaDocumentada = montoDocumentado - montoPrestadoAnterior;
  const mostrarComparativoCiclos = cicloActual !== null
    && cicloActual >= 2
    && integrantesCicloAnterior.length > 0;
  const indicadorDiferencia = diferenciaDocumentada > 0
    ? `↑ ${formatCurrency(diferenciaDocumentada)}`
    : diferenciaDocumentada < 0
      ? `↓ ${formatCurrency(Math.abs(diferenciaDocumentada))}`
      : `= ${formatCurrency(0)}`;
  const integrantesDiferenciaAbsoluta = Math.abs(diferenciaIntegrantes);
  const indicadorDiferenciaIntegrantes = diferenciaIntegrantes > 0
    ? `↑ ${integrantesDiferenciaAbsoluta} ${integrantesDiferenciaAbsoluta === 1 ? 'Sra.' : 'Sras.'}`
    : diferenciaIntegrantes < 0
      ? `↓ ${integrantesDiferenciaAbsoluta} ${integrantesDiferenciaAbsoluta === 1 ? 'Sra.' : 'Sras.'}`
      : '= 0 Sras.';
  const indicadorDiferenciaIntegrantesAccesible = diferenciaIntegrantes > 0
    ? `aumenta ${integrantesDiferenciaAbsoluta} ${integrantesDiferenciaAbsoluta === 1 ? 'integrante' : 'integrantes'}`
    : diferenciaIntegrantes < 0
      ? `disminuye ${integrantesDiferenciaAbsoluta} ${integrantesDiferenciaAbsoluta === 1 ? 'integrante' : 'integrantes'}`
      : 'sin diferencia de integrantes';

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Detalle de Expediente" moduleTheme="documentation" />

      {/* Banner del grupo */}
      <View style={styles.grupoBanner}>
        <Text allowFontScaling={false} style={styles.grupoBannerText}>{grupo?.nombre || 'Cargando grupo...'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : expediente ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          stickyHeaderIndices={[2]}
        >
          <Card style={styles.mainCard}>
            {/* Botones en la parte superior */}
            <View style={styles.buttonsRow}>
              <View style={styles.buttonHalf}>
                <PrimaryButton
                  title="Agregar integrante"
                  onPress={() => setShowForm(true)}
                  moduleTheme="documentation"
                  disabled={expediente.estado !== 'EN_DOCUMENTACION'}
                />
              </View>
              <View style={styles.buttonHalf}>
                <PrimaryButton
                  title="Enviar a verificación"
                  onPress={handleSendToVerification}
                  moduleTheme="documentation"
                  disabled={expediente.estado !== 'EN_DOCUMENTACION'}
                />
              </View>
            </View>

            {/* Estado del expediente */}
            {expediente.estado === 'EN_VERIFICACION' ? (
              <View style={styles.estadoRow}>
                <View style={styles.estadoVerificacionBurbuja}>
                  <Text allowFontScaling={false} style={styles.estadoVerificacionTexto}>VERIFICANDO</Text>
                </View>
              </View>
            ) : expediente.estado === 'EN_DOCUMENTACION' ? (
              <View style={styles.estadoRow}>
                <View style={styles.estadoDocumentacionBurbuja}>
                  <Text allowFontScaling={false} style={styles.estadoDocumentacionTexto}>DOCUMENTANDO</Text>
                </View>
                <View style={styles.estadoDocumentacionBurbuja}>
                  <Text allowFontScaling={false} style={styles.estadoDocumentacionTexto}>
                    {calcularDiasEnEstado(expediente.estado_fecha)} {calcularDiasEnEstado(expediente.estado_fecha) === 1 ? 'DÍA' : 'DÍAS'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.estadoRow}>
                <Text allowFontScaling={false} style={styles.status}>Estado: {expediente.estado}</Text>
              </View>
            )}

            {/* KPIs en burbujas */}
            <View style={styles.kpisRow}>
              <View style={styles.kpiBubble}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{integrantes.length}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Total</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleSuccess]}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{completadas}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Completa</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleWarning]}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{pendientes}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Pendiente</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleWithdrawn]}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{retiradas}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>Retirada</Text>
              </View>
              <View style={[styles.kpiBubble, styles.kpiBubbleDanger]}>
                <Text allowFontScaling={false} style={styles.kpiValue}>{noAprobadas}</Text>
                <Text allowFontScaling={false} style={styles.kpiLabel}>No aprobada</Text>
              </View>
            </View>
          </Card>

          <View collapsable={false}>
            {mostrarComparativoCiclos ? (
              <Card style={styles.cycleComparisonCard}>
              <View
                accessible
                accessibilityLabel={`Ciclo ${cicloActual - 1}, anterior: ${integrantesCicloAnterior.length} integrantes, prestado ${formatCurrency(montoPrestadoAnterior)}. Ciclo ${cicloActual}, documentando: ${completadas} de ${integrantes.length} completas, monto documentado ${formatCurrency(montoDocumentado)}. Diferencia: ${indicadorDiferenciaIntegrantesAccesible} y ${indicadorDiferencia}.`}
              >
                <View style={styles.cycleColumns}>
                  <View style={styles.cycleColumn}>
                    <View style={styles.cycleHeadingRow}>
                      <Text allowFontScaling={false} style={styles.cycleHeading}>Ciclo {cicloActual - 1}</Text>
                      <Text allowFontScaling={false} style={styles.cycleContext}>(anterior)</Text>
                    </View>
                    <Text allowFontScaling={false} style={styles.cycleMetric}>
                      {integrantesCicloAnterior.length} {integrantesCicloAnterior.length === 1 ? 'integrante' : 'integrantes'}
                    </Text>
                    <View style={styles.cycleAmountRow}>
                      <Text allowFontScaling={false} style={styles.cycleAmountLabel}>Prestado</Text>
                      <Text allowFontScaling={false} style={styles.cycleAmountValue}>{formatCurrency(montoPrestadoAnterior)}</Text>
                    </View>
                  </View>

                  <View style={[styles.cycleColumn, styles.currentCycleColumn]}>
                    <View style={styles.cycleHeadingRow}>
                      <Text allowFontScaling={false} style={styles.cycleHeading}>Ciclo {cicloActual}</Text>
                      <Text allowFontScaling={false} style={styles.currentCycleContext}>(documentando)</Text>
                    </View>
                    <Text allowFontScaling={false} style={styles.cycleMetric}>
                      {completadas} de {integrantes.length} completas
                    </Text>
                    <View style={styles.cycleAmountRow}>
                      <Text allowFontScaling={false} style={styles.cycleAmountLabel}>Monto documentado</Text>
                      <Text allowFontScaling={false} style={styles.cycleAmountValue}>{formatCurrency(montoDocumentado)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cycleDifferenceRow}>
                  <Text allowFontScaling={false} style={styles.cycleDifferenceLabel}>Diferencia</Text>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.cycleDifferenceValue,
                      diferenciaIntegrantes > 0 && styles.montoAumenta,
                      diferenciaIntegrantes < 0 && styles.montoDisminuye,
                    ]}
                  >
                    {indicadorDiferenciaIntegrantes}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.cycleDifferenceValue,
                      diferenciaDocumentada > 0 && styles.montoAumenta,
                      diferenciaDocumentada < 0 && styles.montoDisminuye,
                    ]}
                  >
                    {indicadorDiferencia}
                  </Text>
                </View>
              </View>
              </Card>
            ) : null}
          </View>

          <StickySectionHeader
            title="Integrantes"
            moduleTheme="documentation"
            variant="solid"
            fullBleed
          />

          <View style={styles.integrantesList}>
            {integrantes.length === 0 ? (
              <Text allowFontScaling={false} style={styles.empty}>Aún no hay integrantes para este expediente.</Text>
            ) : (
              integrantes.map((integrante, index) => {
                const requiereRevisionDocumental = expediente.estado === 'EN_VERIFICACION'
                  && integrante.estado === 'DOCUMENTANDO';
                const comparacion = compararMontos(
                  integrante.montoSolicitado,
                  integrante.montoAutorizadoAnterior,
                  integrante.comparacionMontoDisponible,
                );
                const etiquetaComparacion = comparacion.tendencia === 'aumenta'
                  ? `↑ AUMENTA ${formatCurrency(Math.abs(comparacion.diferencia))}`
                  : comparacion.tendencia === 'disminuye'
                    ? `↓ DISMINUYE ${formatCurrency(Math.abs(comparacion.diferencia))}`
                    : comparacion.tendencia === 'sin_cambio'
                      ? '= MISMO MONTO'
                      : comparacion.tendencia === 'sin_captura'
                        ? 'PENDIENTE DE CAPTURA'
                        : '↔ SIN MONTO ANTERIOR';
                const indicadorComparacion = comparacion.tendencia === 'aumenta'
                  ? `↑ ${formatCurrency(Math.abs(comparacion.diferencia))}`
                  : comparacion.tendencia === 'disminuye'
                    ? `↓ ${formatCurrency(Math.abs(comparacion.diferencia))}`
                    : comparacion.tendencia === 'sin_cambio'
                      ? '= $ 0'
                      : null;

                return (
                  <IntegranteCard
                    key={integrante.id}
                    name={integrante.nombre || 'Sin nombre'}
                    position={index + 1}
                    total={integrantes.length}
                    phone={integrante.telefono}
                    age={integrante.edad}
                    ageWarning={integrante.supera_limite_edad}
                    completedSteps={integrante.pasoCompletado ?? 0}
                    previousCreditAmount={integrante.montoAutorizadoAnterior}
                    requestedAmount={integrante.montoSolicitado}
                    distanceToTreasurerLabel={integrante.distancia_tesorera_aprox_km == null
                      ? 'DIST. N/D'
                      : `DIST. ${integrante.distancia_tesorera_aprox_km.toFixed(1)} KM`}
                    distanceToTreasurerWarning={integrante.distancia_tesorera_aprox_km != null
                      && integrante.distancia_tesorera_aprox_km > DISTANCIA_MAXIMA_TESORERA_KM}
                    isNewMember={integrante.es_nueva_con_nosotros}
                    status={integrante.estado === 'RETIRADA'
                      ? 'withdrawn'
                      : integrante.estado === 'RECHAZADA'
                        ? 'rejected'
                        : requiereRevisionDocumental
                          ? 'needsDocumentation'
                          : 'neutral'}
                    amountNote={indicadorComparacion ? {
                      label: indicadorComparacion,
                      tone: comparacion.tendencia === 'aumenta'
                        ? 'positive'
                        : comparacion.tendencia === 'disminuye'
                          ? 'negative'
                          : 'neutral',
                    } : null}
                    muted={expediente.estado !== 'EN_DOCUMENTACION' && !requiereRevisionDocumental}
                    style={styles.integranteCard}
                    accessibilityLabel={`${integrante.nombre || 'Integrante'}.${integrante.es_nueva_con_nosotros ? ' Integrante nueva con CRELEALTAD.' : ''}${integrante.estado === 'RECHAZADA' ? ' No aprobada.' : requiereRevisionDocumental ? ' Revisar documentación.' : ''} Edad: ${integrante.edad == null ? 'sin registro' : `${integrante.edad} años`}.${integrante.supera_limite_edad ? ' Supera el límite de 70 años.' : ''}${integrante.distancia_tesorera_aprox_km == null ? '' : ` Distancia aproximada en línea recta al domicilio de la tesorera: ${integrante.distancia_tesorera_aprox_km.toFixed(1)} kilómetros.`} Crédito anterior: ${
                      integrante.montoAutorizadoAnterior == null
                        ? 'sin monto anterior'
                        : formatCurrency(integrante.montoAutorizadoAnterior)
                    }. Solicita este ciclo: ${integrante.montoSolicitado == null
                      ? 'pendiente de captura'
                      : formatCurrency(integrante.montoSolicitado)}. Monto verificado pendiente. ${etiquetaComparacion}.`}
                    onPress={() => {
                      if (integrante.estado === 'RETIRADA') {
                        setShowVerificationSelection(true);
                        return;
                      }
                      if (integrante.estado === 'RECHAZADA') {
                        Alert.alert(
                          'Integrante no aprobada',
                          'La información permanece disponible para consulta, pero no puede modificarse desde Documentación.',
                          [{ text: 'Entendido' }],
                        );
                        return;
                      }
                      if (expediente.estado !== 'EN_DOCUMENTACION' && !requiereRevisionDocumental) {
                        Alert.alert(
                          'Expediente en verificación',
                          'No se pueden modificar los datos mientras el expediente está en verificación.',
                          [{ text: 'Entendido' }]
                        );
                        return;
                      }
                      setSelectedintegranteId(integrante.id);
                      setSelectedintegranteNombre(integrante.nombre);
                      setSelectedSolicitantePosition(index + 1);
                      setInitialStep(integrante.pasoActual);
                      setActiveSolicitanteView('solicitud');
                    }}
                  />
                );
              })
            )}
          </View>
        </ScrollView>
      ) : (
        <Text allowFontScaling={false} style={styles.empty}>No se encontró el expediente.</Text>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  loader: { marginTop: spacing.xl },
  grupoBanner: {
    backgroundColor: moduleThemes.documentation.headerBg,
    paddingVertical: 6,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: moduleThemes.documentation.titleBarBg,
  },
  grupoBannerText: {
    color: '#FDE047', // Amarillo brillante
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  cycleComparisonCard: {
    marginBottom: spacing.sm,
    padding: 0,
    overflow: 'hidden',
  },
  cycleColumns: {
    flexDirection: 'row',
  },
  cycleColumn: {
    flex: 1,
    minWidth: 0,
    padding: spacing.md,
  },
  currentCycleColumn: {
    backgroundColor: colors.successSoft,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderSoft,
  },
  cycleHeadingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: spacing.xs,
  },
  cycleHeading: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
  },
  cycleContext: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  currentCycleContext: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  cycleMetric: {
    marginTop: spacing.xs,
    color: colors.textPrimary,
    ...typography.caption,
  },
  cycleAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.xs,
    marginTop: spacing.xs,
  },
  cycleAmountLabel: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '400',
  },
  cycleAmountValue: {
    flexShrink: 0,
    color: colors.textPrimary,
    ...typography.caption,
  },
  cycleDifferenceRow: {
    minHeight: 38,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: spacing.sm,
    rowGap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  cycleDifferenceLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cycleDifferenceValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  buttonHalf: {
    flex: 1,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  estadoVerificacionBurbuja: {
    backgroundColor: colors.warningLight,
    borderWidth: 2,
    borderColor: '#D97706',
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  estadoVerificacionTexto: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
    textAlign: 'center',
  },
  estadoDocumentacionBurbuja: {
    backgroundColor: colors.successSoft,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  estadoDocumentacionTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  diasTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  kpisRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.xs,
  },
  kpiBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: '#000000',
    padding: spacing.xs,
    paddingTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 55,
  },
  kpiBubbleSuccess: {
    backgroundColor: colors.successSoft,
    borderColor: '#10B981',
  },
  kpiBubbleWarning: {
    backgroundColor: '#D1D5DB',
    borderColor: '#6B7280',
  },
  kpiBubbleWithdrawn: {
    backgroundColor: colors.gray[200],
    borderColor: colors.gray[600],
  },
  kpiBubbleDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#EF4444',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  integrantesList: {
    marginTop: spacing.sm,
  },
  empty: { color: colors.textSecondary, ...typography.body },
  integranteCard: {
    marginBottom: spacing.sm,
  },
  montoAumenta: {
    color: colors.success,
  },
  montoDisminuye: {
    color: colors.danger,
  },
});
