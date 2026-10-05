import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  AppHeader,
  Card,
  ContextHeader,
  CreditAmountsSummary,
  PrimaryButton,
  ScreenContainer,
  ScreenTitleBar,
  SecondaryButton,
  SectionTitle,
  SelectorField,
  StatusCard,
  StatusBadge,
  StatusTab,
  TextInput as UiTextInput,
} from '../../components/ui';
import type {
  DocumentImageCarouselPage,
  YesNoValue,
} from '../../components/ui';
import { apiUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useOfflineSync } from '../../context/OfflineSyncContext';
import { offlineDraftKey } from '../../offline/offline-sync.ids';
import { api, ApiError } from '../../services/api-client';
import {
  obtenerUbicacionEntrevista,
  obtenerUbicacionImagenDomicilio,
  obtenerUbicacionLlamada,
  obtenerUbicacionVisitaVecino,
} from '../../services/llamada-location';
import { useDebounce } from '../../hooks/useDebounce';
import {
  colors,
  moduleThemes,
  radius,
  spacing,
  statusColors,
  typography,
} from '../../theme/tokens';
import {
  calcularDistanciasAproximadasRegistradas,
  DISTANCIA_MAXIMA_TESORERA_KM,
} from '../../services/domicilio-distance';
import { formatCurrency, normalizeCurrencyInput } from '../../utils/currency';
import { formatPhone } from '../../utils/input';
import { abrirWhatsApp, llamar } from '../../utils/phone';
import {
  getLocalVerificationProgress,
  markNeedsDocumentation as saveNeedsDocumentationProgress,
  saveStepOneCompleted,
} from './verificacion-progress.storage';
import {
  ContactoInicialStep,
  createEmptyRespuestasContactoInicial,
} from './ContactoInicialStep';
import {
  AccionPosteriorLlamada,
  EncuestaLlamadaStep,
} from './EncuestaLlamadaStep';
import {
  VerificationProcessKey,
  VerificationProcessMenu,
} from './VerificationProcessMenu';
import { ImagenesDomicilioSection } from './ImagenesDomicilioSection';
import { VisitaVecinoSection } from './VisitaVecinoSection';
import { EntrevistaPreguntasGeneralesSection } from './EntrevistaPreguntasGeneralesSection';
import { EntrevistaHistorialCrediticioSection } from './EntrevistaHistorialCrediticioSection';
import { EntrevistaDatosPersonalesSection } from './EntrevistaDatosPersonalesSection';
import { EntrevistaIngresosSection } from './EntrevistaIngresosSection';
import { EntrevistaEncuestasSection } from './EntrevistaEncuestasSection';
import { VerificacionDocumentoModal } from './VerificacionDocumentoModal';
import { EntrevistaEvidenceViewers } from './EntrevistaEvidenceViewers';
import { VerificacionLlamadaModals } from './VerificacionLlamadaModals';
import { DocumentosRevisionSection } from './DocumentosRevisionSection';
import { useEntrevistaForm } from './useEntrevistaForm';
import { useDocumentoRevisionModal } from './useDocumentoRevisionModal';
import {
  CanalLlamadaVerificacion,
  crearClaveIdempotenciaLlamada,
  EvidenciaLlamadaSeleccionada,
  obtenerResumenLlamadas,
  registrarConfirmacionTelefono,
  registrarEncuestaLlamada,
  registrarLlamada,
  reemplazarEvidenciaTelefono,
  ResumenLlamadasVerificacion,
} from './verificacion-llamadas.api';
import {
  crearClaveIdempotenciaEvidenciaVisita,
  crearClaveIdempotenciaFachadaVisita,
  crearClaveIdempotenciaVisitaVecino,
  EvidenciaVisitaPendiente,
  FachadaVisitaPendiente,
  obtenerResumenEvidenciaVisita,
  obtenerResumenFachadaVisita,
  obtenerResumenVisitaVecino,
  registrarEvidenciaVisita,
  registrarFachadaVisita,
  registrarVisitaVecino,
} from './verificacion-visitas-vecino.api';
import {
  getVerificacionDocumentHeaders,
  VERIFICACION_READ_REQUEST_OPTIONS,
  VERIFICACION_REQUEST_OPTIONS,
} from './verificacion-api-context';
import {
  crearClaveIdempotenciaImagenDomicilio,
  crearClaveIdempotenciaRespuestaMedidorLuz,
  MOTIVOS_SIN_MEDIDOR_LUZ,
  MotivoSinMedidorLuz,
  obtenerResumenImagenesDomicilio,
  registrarImagenDomicilio,
  registrarRespuestaMedidorLuz,
  TipoImagenDomicilio,
} from './verificacion-imagenes-domicilio.api';
import {
  crearClaveIdempotenciaEvidenciaNegocio,
  crearClaveIdempotenciaEvidenciaEntrevista,
  EntrevistaPayload,
  EvidenciaEntrevistaPendiente,
  EvidenciaNegocioPendiente,
  obtenerEntrevista,
  obtenerEvidenciasEntrevista,
  obtenerEvidenciasNegocio,
  registrarEvidenciaEntrevista,
  registrarEvidenciaNegocio,
} from './verificacion-entrevista.api';
import {
  crearEntrevistaPayload,
  restaurarEntrevista,
  type EntrevistaRestaurada,
} from './verificacion-entrevista.mapper';
import {
  calcularSemanasTranscurridasDesdeMes,
  NO_CONOCE_TESORERA_VALUE,
  NO_SABE_DOMICILIO_RECOLECCION_VALUE,
} from './verificacion-entrevista.catalog';
import {
  crearErroresEvidenciasHistorialCreditoVacios,
  crearErroresImagenesDomicilioVacios,
  crearEvidenciasHistorialCreditoPendientesVacias,
  crearEvidenciasHistorialCreditoVacias,
  crearImagenesDomicilioPendientesVacias,
  crearImagenesDomicilioVacias,
} from './verificacion-domicilio.model';
import {
  cycleNumber,
  esTipoDocumentoRevision,
  mapCreditHistory,
  obtenerTelefonosLlamadaDisponibles,
  TIPO_DOCUMENTO_POR_CLAVE,
} from './verificacion-individual.model';
import {
  TIPOS_DOCUMENTO_REVISION,
  type DocumentoFuente,
  type DocumentoItem,
  type DocumentoRemoto,
  type ErroresEvidenciasHistorialCredito,
  type EvidenciaNegocioVista,
  type EvidenciasHistorialCredito,
  type EvidenciasHistorialCreditoPendientes,
  type ImagenDomicilioPendienteEnPantalla,
  type ImagenDomicilioVista,
  type IntegranteData,
  type PasoVerificacion,
  type SolicitudData,
  type TelefonoLlamadaDisponible,
  type TipoEvidenciaHistorialCredito,
  type TipoImagenDomicilioEnPantalla,
  type TipoTelefonoEntrevista,
  type VistaLlamada,
} from './verificacion-individual.types';

interface IntegranteVerificacionScreenProps {
  integranteId: string;
  nombreGrupo: string;
  integrantePosition?: number;
  integrantesTotal?: number;
  onBack?: () => void;
}

type VerificationTextInputProps = React.ComponentProps<typeof UiTextInput>;

const TextInput: React.FC<VerificationTextInputProps> = (props) => (
  <UiTextInput
    {...props}
    moduleTheme="verification"
    highlightWhenFilled
  />
);

export const IntegranteVerificacionScreen: React.FC<IntegranteVerificacionScreenProps> = ({
  integranteId,
  nombreGrupo,
  integrantePosition,
  integrantesTotal,
  onBack,
}) => {
  const { usuario } = useAuth();
  const {
    saveDraft,
    getDraft,
    enqueueJson,
    syncNow,
    retryBlocked,
    setServerVersion,
  } = useOfflineSync();
  const {
    values: entrevistaFormValues,
    conoceAsesora, setConoceAsesora,
    comoConocioAsesora, setComoConocioAsesora,
    conoceIntegrantes, setConoceIntegrantes,
    tiempoConoceIntegrantes, setTiempoConoceIntegrantes,
    sabeMontosCompaneras, setSabeMontosCompaneras,
    acuerdoMontos, setAcuerdoMontos,
    companerasMontoNoAcordadoIds, setCompanerasMontoNoAcordadoIds,
    motivosDesacuerdoMontosPorIntegrante, setMotivosDesacuerdoMontosPorIntegrante,
    conoceTesoreraDelGrupo, setConoceTesoreraDelGrupo,
    quienEsTesorera, setQuienEsTesorera,
    domicilioRecoleccion, setDomicilioRecoleccion,
    tieneFamiliarGrupo, setTieneFamiliarGrupo,
    familiaresGrupoIds, setFamiliaresGrupoIds,
    tieneOtroCreditoGrupal, setTieneOtroCreditoGrupal,
    financieraCreditoGrupal, setFinancieraCreditoGrupal,
    creditoGrupalAnteriorActivo, setCreditoGrupalAnteriorActivo,
    valorFichaCreditoGrupal, setValorFichaCreditoGrupal,
    semanaActualCreditoGrupal, setSemanaActualCreditoGrupal,
    mesDesembolsoCreditoGrupal, setMesDesembolsoCreditoGrupal,
    mesUltimoPagoCreditoGrupal, setMesUltimoPagoCreditoGrupal,
    anioUltimoPagoCreditoGrupal, setAnioUltimoPagoCreditoGrupal,
    numeroCiclosCreditoGrupal, setNumeroCiclosCreditoGrupal,
    tasaCreditoGrupal, setTasaCreditoGrupal,
    nombreAsesoraCreditoGrupal, setNombreAsesoraCreditoGrupal,
    telefonoAsesoraCreditoGrupal, setTelefonoAsesoraCreditoGrupal,
    motivoNoRenovacionCreditoGrupal, setMotivoNoRenovacionCreditoGrupal,
    viveEnDomicilioDeclarado, setViveEnDomicilioDeclarado,
    motivoNoViveEnDomicilio, setMotivoNoViveEnDomicilio,
    tipoDomicilio, setTipoDomicilio,
    familiarDomicilio, setFamiliarDomicilio,
    aniosEnDomicilio, setAniosEnDomicilio,
    personasVivenCasa, setPersonasVivenCasa,
    quienViveConUsted, setQuienViveConUsted,
    quienesVivenConUstedSabenDelCredito, setQuienesVivenConUstedSabenDelCredito,
    tieneOtroIngresoHogar, setTieneOtroIngresoHogar,
    otroIngresoSemanal, setOtroIngresoSemanal,
    capacidadPagoSemanal, setCapacidadPagoSemanal,
    motivoCredito, setMotivoCredito,
    fuentesIngresoPersonal, setFuentesIngresoPersonal,
    ingresosSemanalesDeclarados, setIngresosSemanalesDeclarados,
    lugarTrabajo, setLugarTrabajo,
    antiguedadLaboral, setAntiguedadLaboral,
    tipoNegocio, setTipoNegocio,
    ingresoLibreSemanalNegocio, setIngresoLibreSemanalNegocio,
    ubicacionNegocio, setUbicacionNegocio,
    tieneControlPagos, setTieneControlPagos,
    motivoSinControl, setMotivoSinControl,
    asesoraAcudioSemanalmente, setAsesoraAcudioSemanalmente,
    firmabanControlSemanalmente, setFirmabanControlSemanalmente,
    tratoAsesoraTesorera, setTratoAsesoraTesorera,
    conocePremioTesorera, setConocePremioTesorera,
    opinionCredito, setOpinionCredito,
    tratoDesembolso, setTratoDesembolso,
    rapidezDesembolso, setRapidezDesembolso,
    informacionCreditoClara, setInformacionCreditoClara,
    recomendaria, setRecomendaria,
    razonRecomendacion, setRazonRecomendacion,
    motivoRecomendacion, setMotivoRecomendacion,
  } = useEntrevistaForm();
  const [integrante, setIntegrante] = useState<IntegranteData | null>(null);
  const [solicitudData, setSolicitudData] = useState<SolicitudData | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoItem[]>([]);
  const [integrantesGrupo, setIntegrantesGrupo] = useState<IntegranteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingNeedsDocumentation, setMarkingNeedsDocumentation] = useState(false);
  const [pasoActual, setPasoActual] = useState<PasoVerificacion>('documentos');
  const [consultandoDocumentos, setConsultandoDocumentos] = useState(false);
  const {
    documentoViewing,
    showDocumentModal,
    ladoSeleccionado,
    setLadoSeleccionado,
    abrirDocumento: mostrarDocumentoModal,
    cerrarDocumento: cerrarDocumentoModal,
  } = useDocumentoRevisionModal();
  const scrollViewRef = useRef<ScrollView>(null);
  const [showStickyGastos, setShowStickyGastos] = useState(false);
  const gastosHeaderRef = useRef<View>(null);
  const [gastosHeaderY, setGastosHeaderY] = useState(0);
  const gastosEndRef = useRef<View>(null);
  const [gastosEndY, setGastosEndY] = useState(0);
  const fixedHeaderContainerRef = useRef<View>(null);
  const [fixedHeaderHeight, setFixedHeaderHeight] = useState(0); // Altura total del header fijo

  // Estado del formulario
  const [imagenesDomicilio, setImagenesDomicilio] = useState(crearImagenesDomicilioVacias);
  const [imagenesDomicilioPendientes, setImagenesDomicilioPendientes] = useState(
    crearImagenesDomicilioPendientesVacias,
  );
  const [erroresImagenesDomicilio, setErroresImagenesDomicilio] = useState(
    crearErroresImagenesDomicilioVacios,
  );
  const [loadingImagenesDomicilio, setLoadingImagenesDomicilio] = useState(false);
  const [guardandoImagenDomicilio, setGuardandoImagenDomicilio] = useState<TipoImagenDomicilioEnPantalla | null>(null);
  const [respuestaTieneMedidorLuz, setRespuestaTieneMedidorLuz] = useState<'' | 'Sí' | 'No'>('');
  const [motivoSinMedidorLuz, setMotivoSinMedidorLuz] = useState<MotivoSinMedidorLuz | null>(null);
  const [guardandoRespuestaMedidorLuz, setGuardandoRespuestaMedidorLuz] = useState(false);
  const [imagenesDomicilioPuedeTerminar, setImagenesDomicilioPuedeTerminar] = useState(false);
  const [abrirMotivosSinMedidorLuz, setAbrirMotivosSinMedidorLuz] = useState(false);
  const [versionPopupMotivoMedidor, setVersionPopupMotivoMedidor] = useState(0);
  const [errorResumenImagenesDomicilio, setErrorResumenImagenesDomicilio] = useState<string | null>(null);
  const [imagenDomicilioEnVista, setImagenDomicilioEnVista] = useState<{
    titulo: string;
    uri: string;
    headers?: Record<string, string>;
  } | null>(null);
  const [encontradaEnDomicilio, setEncontradaEnDomicilio] = useState<string>('');
  const [alguienEnDomicilio, setAlguienEnDomicilio] = useState<string>('');
  const [nombreQuienRecibio, setNombreQuienRecibio] = useState('');
  const [parentescoQuienRecibio, setParentescoQuienRecibio] = useState('');

  // Evaluación económica - Ingresos
  const [ingresoEmpleo, setIngresoEmpleo] = useState('');
  const [ingresoExterno, setIngresoExterno] = useState('');
  const [ingresoNegocio, setIngresoNegocio] = useState('');

  // Evaluación económica - Gastos (11 tipos)
  const [gastoLuz, setGastoLuz] = useState('');
  const [gastoGas, setGastoGas] = useState('');
  const [gastoAgua, setGastoAgua] = useState('');
  const [gastoTelefono, setGastoTelefono] = useState('');
  const [gastoCable, setGastoCable] = useState('');
  const [gastoCelular, setGastoCelular] = useState('');
  const [gastoDespensa, setGastoDespensa] = useState('');
  const [gastoCasa, setGastoCasa] = useState('');
  const [gastoEscuela, setGastoEscuela] = useState('');
  const [gastoCarro, setGastoCarro] = useState('');
  const [gastoOtros, setGastoOtros] = useState('');


  // Referencias
  const [ref1Nombre, setRef1Nombre] = useState('');
  const [ref1Parentesco, setRef1Parentesco] = useState('');
  const [ref1Telefono, setRef1Telefono] = useState('');
  const [ref2Nombre, setRef2Nombre] = useState('');
  const [ref2Parentesco, setRef2Parentesco] = useState('');
  const [ref2Telefono, setRef2Telefono] = useState('');

  // Preguntas generales
  const [conoceMontos, setConoceMontos] = useState<string>('');
  const [conoceTesorera, setConoceTesorera] = useState<string>('');
  const [conoceDomicilio, setConoceDomicilio] = useState<string>('');
  const [antiguedadDomicilio, setAntiguedadDomicilio] = useState('');
  const [tieneNegocio, setTieneNegocio] = useState<string>('');
  const [tieneOtroCredito, setTieneOtroCredito] = useState<string>('');

  // Preguntas tesorera
  const [formoGrupo, setFormoGrupo] = useState<string>('');
  const [conoceMontosTesorera, setConoceMontosTesorera] = useState<string>('');
  const [lugarCobro, setLugarCobro] = useState('');

  // Control de pagos
  const [fotoControlPagos1, setFotoControlPagos1] = useState<string | null>(null);
  const [fotoControlPagos2, setFotoControlPagos2] = useState<string | null>(null);
  const [fotoControlPagosVisible, setFotoControlPagosVisible] = useState(false);

  // Evaluación exclusiva de la tesorera sobre el servicio de la asesora
  const [fotoFolletoPremioTesorera, setFotoFolletoPremioTesorera] = useState<string | null>(null);
  const [fotoFolletoPremioVisible, setFotoFolletoPremioVisible] = useState(false);

  // Encuesta de servicio para integrantes con historial interno confirmado
  const [tratoAsesor, setTratoAsesor] = useState<string>('');
  const [calidadServicio, setCalidadServicio] = useState<string>('');

  // Observaciones
  const [hayInconsistencias, setHayInconsistencias] = useState<string>('');
  const [realmenteViveAhi, setRealmenteViveAhi] = useState<string>('');
  const [recomendacion, setRecomendacion] = useState<string>('');
  const [observacionesAdicionales, setObservacionesAdicionales] = useState('');

  const [telefonoConfirmado, setTelefonoConfirmado] = useState('');
  const [telefonoSecundario, setTelefonoSecundario] = useState('');
  const [selectorCanalTelefonoVisible, setSelectorCanalTelefonoVisible] = useState(false);
  const [telefonoSeleccionadoParaContacto, setTelefonoSeleccionadoParaContacto] = useState('');
  const [tipoTelefonoSeleccionadoParaContacto, setTipoTelefonoSeleccionadoParaContacto] = useState<TipoTelefonoEntrevista | null>(null);
  const [confirmacionTelefonoPendiente, setConfirmacionTelefonoPendiente] = useState<{
    tipo: TipoTelefonoEntrevista;
    telefono: string;
  } | null>(null);
  const [confirmacionTelefonoEvidenciaVisible, setConfirmacionTelefonoEvidenciaVisible] = useState(false);
  const [guardandoConfirmacionTelefono, setGuardandoConfirmacionTelefono] = useState(false);
  const [telefonoPrincipalConfirmadoValor, setTelefonoPrincipalConfirmadoValor] = useState<string | null>(null);
  const [telefonoSecundarioConfirmadoValor, setTelefonoSecundarioConfirmadoValor] = useState<string | null>(null);
  const [evidenciaTelefonoVisible, setEvidenciaTelefonoVisible] = useState(false);
  const [reemplazoEvidenciaTelefonoVisible, setReemplazoEvidenciaTelefonoVisible] = useState(false);
  const [telefonoEvidenciaEnVista, setTelefonoEvidenciaEnVista] = useState<{
    tipo: TipoTelefonoEntrevista;
    telefono: string;
    llamadaId: string;
    evidenciaUrl: string;
  } | null>(null);
  const [evidenciaTelefonoHeaders, setEvidenciaTelefonoHeaders] = useState<Record<string, string>>();
  const [guardandoReemplazoEvidenciaTelefono, setGuardandoReemplazoEvidenciaTelefono] = useState(false);
  const semanasDesdeUltimoPagoCreditoGrupal = calcularSemanasTranscurridasDesdeMes(
    mesUltimoPagoCreditoGrupal,
    anioUltimoPagoCreditoGrupal,
  );
  const [evidenciasNegocio, setEvidenciasNegocio] = useState<EvidenciaNegocioVista[]>([]);
  const [evidenciasNegocioPendientes, setEvidenciasNegocioPendientes] = useState<EvidenciaNegocioPendiente[]>([]);
  const [loadingEvidenciasNegocio, setLoadingEvidenciasNegocio] = useState(false);
  const [guardandoEvidenciasNegocio, setGuardandoEvidenciasNegocio] = useState(false);
  const [errorEvidenciasNegocio, setErrorEvidenciasNegocio] = useState<string | null>(null);
  const [evidenciasHistorialCredito, setEvidenciasHistorialCredito] = useState<EvidenciasHistorialCredito>(
    crearEvidenciasHistorialCreditoVacias,
  );
  const [evidenciasHistorialCreditoPendientes, setEvidenciasHistorialCreditoPendientes] = useState<
    EvidenciasHistorialCreditoPendientes
  >(crearEvidenciasHistorialCreditoPendientesVacias);
  const [loadingEvidenciasHistorialCredito, setLoadingEvidenciasHistorialCredito] = useState(false);
  const [guardandoEvidenciasHistorialCredito, setGuardandoEvidenciasHistorialCredito] = useState<
    TipoEvidenciaHistorialCredito | null
  >(null);
  const [erroresEvidenciasHistorialCredito, setErroresEvidenciasHistorialCredito] = useState<
    ErroresEvidenciasHistorialCredito
  >(crearErroresEvidenciasHistorialCreditoVacios);
  const [paginasComprobanteLineaCredito, setPaginasComprobanteLineaCredito] = useState<
    DocumentImageCarouselPage[]
  >([]);
  const [loadingComprobanteLineaCredito, setLoadingComprobanteLineaCredito] = useState(false);
  const [errorComprobanteLineaCredito, setErrorComprobanteLineaCredito] = useState<string | null>(null);
  const comprobanteLineaCreditoRequestRef = useRef(0);
  const [entrevistaCargada, setEntrevistaCargada] = useState(false);
  const [guardandoEntrevista, setGuardandoEntrevista] = useState(false);
  const [errorGuardadoEntrevista, setErrorGuardadoEntrevista] = useState<string | null>(null);
  const [estadoSyncEntrevista, setEstadoSyncEntrevista] = useState<
    'idle' | 'pending' | 'synced' | 'blocked'
  >('idle');
  const ultimaEntrevistaConfirmadaRef = useRef<string>('');
  const guardadoEntrevistaEnCursoRef = useRef(false);
  const entrevistaPendienteRef = useRef<string | null>(null);
  const entrevistaAbiertaRef = useRef(false);
  const [evidenciaEntrevistaHeaders, setEvidenciaEntrevistaHeaders] = useState<Record<string, string>>();
  const [evidenciaControlPagosPendiente, setEvidenciaControlPagosPendiente] = useState<EvidenciaEntrevistaPendiente | null>(null);
  const [evidenciaFolletoPendiente, setEvidenciaFolletoPendiente] = useState<EvidenciaEntrevistaPendiente | null>(null);
  const [guardandoEvidenciaEntrevista, setGuardandoEvidenciaEntrevista] = useState<
    'CONTROL_PAGOS' | 'FOLLETO_PREMIO_TESORERA' | null
  >(null);
  const entrevistaDraftKey = useMemo(
    () => offlineDraftKey('VERIFICACION', 'entrevista', integranteId),
    [integranteId],
  );
  const entrevistaVersionKey = useMemo(
    () => `verificacion:entrevista:${integranteId}:revision`,
    [integranteId],
  );

  // Llamada integrante
  const [showLlamadaModal, setShowLlamadaModal] = useState(false);
  const [selectorNumeroLlamadaVisible, setSelectorNumeroLlamadaVisible] = useState(false);
  const [canalParaSeleccionarNumero, setCanalParaSeleccionarNumero] = useState<CanalLlamadaVerificacion | null>(null);
  const [vistaLlamada, setVistaLlamada] = useState<VistaLlamada>('acciones');
  const [respuestasContactoInicial, setRespuestasContactoInicial] = useState(
    createEmptyRespuestasContactoInicial,
  );
  const [resumenLlamadas, setResumenLlamadas] = useState<ResumenLlamadasVerificacion | null>(null);
  const [errorResumenLlamadas, setErrorResumenLlamadas] = useState(false);
  const [canalLlamadaPendiente, setCanalLlamadaPendiente] = useState<CanalLlamadaVerificacion | null>(null);
  const [idempotenciaLlamadaPendiente, setIdempotenciaLlamadaPendiente] = useState<string | null>(null);
  const [telefonoLlamadaPendiente, setTelefonoLlamadaPendiente] = useState<{
    tipo: TipoTelefonoEntrevista;
    telefono: string;
  } | null>(null);
  const [guardandoResultadoLlamada, setGuardandoResultadoLlamada] = useState(false);
  const [accionPosteriorLlamada, setAccionPosteriorLlamada] = useState<AccionPosteriorLlamada | null>(null);
  const [llamadaCompletada, setLlamadaCompletada] = useState(false);
  const [llamadaContestadaId, setLlamadaContestadaId] = useState<string | null>(null);
  const [evidenciaLlamada, setEvidenciaLlamada] = useState<EvidenciaLlamadaSeleccionada | null>(null);
  const [guardandoEncuestaLlamada, setGuardandoEncuestaLlamada] = useState(false);
  const [ineVisitaPages, setIneVisitaPages] = useState<DocumentImageCarouselPage[]>([]);
  const [loadingIneVisita, setLoadingIneVisita] = useState(false);
  const [errorIneVisita, setErrorIneVisita] = useState<string | null>(null);
  const [vecinoConoceDomicilio, setVecinoConoceDomicilio] = useState<YesNoValue>(null);
  const [visitaVecinoActualId, setVisitaVecinoActualId] = useState<string | null>(null);
  const [errorResumenVisitaVecino, setErrorResumenVisitaVecino] = useState(false);
  const [guardandoResultadoVecino, setGuardandoResultadoVecino] = useState(false);
  const [idempotenciaVisitaVecinoPendiente, setIdempotenciaVisitaVecinoPendiente] = useState<{
    clave: string;
    respuesta: Exclude<YesNoValue, null>;
  } | null>(null);
  const [fachadaVisita, setFachadaVisita] = useState<{
    id: string;
    uri: string;
    headers?: Record<string, string>;
    fotoCapturadaAt: string;
  } | null>(null);
  const [fachadaVisitaPendiente, setFachadaVisitaPendiente] = useState<FachadaVisitaPendiente | null>(null);
  const [loadingFachadaVisita, setLoadingFachadaVisita] = useState(false);
  const [guardandoFachadaVisita, setGuardandoFachadaVisita] = useState(false);
  const [errorFachadaVisita, setErrorFachadaVisita] = useState<string | null>(null);
  const [evidenciaVisita, setEvidenciaVisita] = useState<{
    id: string;
    uri: string;
    headers?: Record<string, string>;
    fotoCapturadaAt: string;
  } | null>(null);
  const [evidenciaVisitaPendiente, setEvidenciaVisitaPendiente] = useState<EvidenciaVisitaPendiente | null>(null);
  const [loadingEvidenciaVisita, setLoadingEvidenciaVisita] = useState(false);
  const [guardandoEvidenciaVisita, setGuardandoEvidenciaVisita] = useState(false);
  const [errorEvidenciaVisita, setErrorEvidenciaVisita] = useState<string | null>(null);

  const aplicarEntrevistaRestaurada = (restaurada: EntrevistaRestaurada) => {
    setConoceAsesora(restaurada.conoceAsesora);
    setComoConocioAsesora(restaurada.comoConocioAsesora);
    setConoceIntegrantes(restaurada.conoceIntegrantes);
    setTiempoConoceIntegrantes(restaurada.tiempoConoceIntegrantes);
    setSabeMontosCompaneras(restaurada.sabeMontosCompaneras);
    setAcuerdoMontos(restaurada.acuerdoMontos);
    setCompanerasMontoNoAcordadoIds(restaurada.companerasMontoNoAcordadoIds);
    setMotivosDesacuerdoMontosPorIntegrante(restaurada.motivosDesacuerdoMontosPorIntegrante);
    setConoceTesoreraDelGrupo(restaurada.conoceTesoreraDelGrupo);
    setQuienEsTesorera(restaurada.quienEsTesorera);
    setDomicilioRecoleccion(restaurada.domicilioRecoleccion);
    setTieneFamiliarGrupo(restaurada.tieneFamiliarGrupo);
    setFamiliaresGrupoIds(restaurada.familiaresGrupoIds);
    setTieneOtroCreditoGrupal(restaurada.tieneOtroCreditoGrupal);
    setFinancieraCreditoGrupal(restaurada.financieraCreditoGrupal);
    setCreditoGrupalAnteriorActivo(restaurada.creditoGrupalAnteriorActivo);
    setValorFichaCreditoGrupal(restaurada.valorFichaCreditoGrupal);
    setSemanaActualCreditoGrupal(restaurada.semanaActualCreditoGrupal);
    setMesDesembolsoCreditoGrupal(restaurada.mesDesembolsoCreditoGrupal);
    setMesUltimoPagoCreditoGrupal(restaurada.mesUltimoPagoCreditoGrupal);
    setAnioUltimoPagoCreditoGrupal(restaurada.anioUltimoPagoCreditoGrupal);
    setNumeroCiclosCreditoGrupal(restaurada.numeroCiclosCreditoGrupal);
    setTasaCreditoGrupal(restaurada.tasaCreditoGrupal);
    setNombreAsesoraCreditoGrupal(restaurada.nombreAsesoraCreditoGrupal);
    setTelefonoAsesoraCreditoGrupal(formatPhone(restaurada.telefonoAsesoraCreditoGrupal));
    setMotivoNoRenovacionCreditoGrupal(restaurada.motivoNoRenovacionCreditoGrupal);
    setViveEnDomicilioDeclarado(restaurada.viveEnDomicilioDeclarado);
    setMotivoNoViveEnDomicilio(restaurada.motivoNoViveEnDomicilio);
    setTipoDomicilio(restaurada.tipoDomicilio);
    setFamiliarDomicilio(restaurada.familiarDomicilio);
    setAniosEnDomicilio(restaurada.aniosEnDomicilio);
    setPersonasVivenCasa(restaurada.personasVivenCasa);
    setQuienViveConUsted(restaurada.quienViveConUsted);
    setQuienesVivenConUstedSabenDelCredito(restaurada.quienesVivenConUstedSabenDelCredito);
    setTieneOtroIngresoHogar(restaurada.tieneOtroIngresoHogar);
    setOtroIngresoSemanal(restaurada.otroIngresoSemanal);
    setCapacidadPagoSemanal(restaurada.capacidadPagoSemanal);
    setMotivoCredito(restaurada.motivoCredito);
    setFuentesIngresoPersonal(restaurada.fuentesIngresoPersonal);
    setIngresosSemanalesDeclarados(restaurada.ingresosSemanalesDeclarados);
    setLugarTrabajo(restaurada.lugarTrabajo);
    setAntiguedadLaboral(restaurada.antiguedadLaboral);
    setTipoNegocio(restaurada.tipoNegocio);
    setIngresoLibreSemanalNegocio(restaurada.ingresoLibreSemanalNegocio);
    setUbicacionNegocio(restaurada.ubicacionNegocio);
    setTieneControlPagos(restaurada.tieneControlPagos);
    setMotivoSinControl(restaurada.motivoSinControl);
    setAsesoraAcudioSemanalmente(restaurada.asesoraAcudioSemanalmente);
    setFirmabanControlSemanalmente(restaurada.firmabanControlSemanalmente);
    setTratoAsesoraTesorera(restaurada.tratoAsesoraTesorera);
    setConocePremioTesorera(restaurada.conocePremioTesorera);
    setOpinionCredito(restaurada.opinionCredito);
    setTratoDesembolso(restaurada.tratoDesembolso);
    setRapidezDesembolso(restaurada.rapidezDesembolso);
    setInformacionCreditoClara(restaurada.informacionCreditoClara);
    setRecomendaria(restaurada.recomendaria);
    setRazonRecomendacion(restaurada.razonRecomendacion);
    setMotivoRecomendacion(restaurada.motivoRecomendacion);
  };

  const aplicarEntrevistaPayload = (payload: EntrevistaPayload) => {
    aplicarEntrevistaRestaurada(restaurarEntrevista({
      ...payload,
      id: 'borrador-local',
      integrante_id: integranteId,
      revision: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, NO_SABE_DOMICILIO_RECOLECCION_VALUE));
  };

  const cargarEntrevistaGuardada = async () => {
    setEntrevistaCargada(false);
    const localDraft = await getDraft<EntrevistaPayload>(entrevistaDraftKey);
    try {
      const respuesta = await obtenerEntrevista(integranteId);
      await setServerVersion(
        entrevistaVersionKey,
        respuesta.entrevista?.revision ?? 0,
      );
      const usaBorradorLocal = Boolean(localDraft && localDraft.status !== 'SYNCED');
      const payload = usaBorradorLocal ? localDraft?.data : respuesta.entrevista;
      if (payload) {
        if (usaBorradorLocal) {
          aplicarEntrevistaPayload(payload);
        } else {
          aplicarEntrevistaRestaurada(restaurarEntrevista(
            respuesta.entrevista!,
            NO_SABE_DOMICILIO_RECOLECCION_VALUE,
          ));
        }
        ultimaEntrevistaConfirmadaRef.current = JSON.stringify(payload);
      } else {
        ultimaEntrevistaConfirmadaRef.current = '';
      }
      setEstadoSyncEntrevista(
        localDraft?.status === 'BLOCKED'
          ? 'blocked'
          : usaBorradorLocal
            ? 'pending'
            : payload
              ? 'synced'
              : 'idle',
      );
      setErrorGuardadoEntrevista(
        localDraft?.status === 'BLOCKED'
          ? localDraft.lastError || 'La entrevista requiere revisión antes de sincronizar.'
          : null,
      );
      setEntrevistaCargada(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 0 && localDraft) {
        aplicarEntrevistaPayload(localDraft.data);
        ultimaEntrevistaConfirmadaRef.current = JSON.stringify(localDraft.data);
        setEstadoSyncEntrevista(localDraft.status === 'BLOCKED' ? 'blocked' : 'pending');
        setErrorGuardadoEntrevista(
          localDraft.status === 'BLOCKED'
            ? localDraft.lastError || 'La entrevista requiere revisión antes de sincronizar.'
            : null,
        );
        setEntrevistaCargada(true);
        return;
      }
      setEntrevistaCargada(false);
      setEstadoSyncEntrevista('idle');
      setErrorGuardadoEntrevista(
        'No se pudo recuperar la entrevista guardada. Revisa tu conexión antes de capturar.',
      );
    }
  };

  const reintentarGuardadoEntrevista = async () => {
    setGuardandoEntrevista(true);
    try {
      if (estadoSyncEntrevista === 'blocked') {
        await retryBlocked();
      } else {
        await syncNow();
      }
      const draft = await getDraft<EntrevistaPayload>(entrevistaDraftKey);
      if (draft?.status === 'BLOCKED') {
        setEstadoSyncEntrevista('blocked');
        setErrorGuardadoEntrevista(
          draft.lastError || 'La entrevista requiere revisión antes de sincronizar.',
        );
      } else if (draft?.status === 'PENDING' || draft?.status === 'SYNCING') {
        setEstadoSyncEntrevista('pending');
        setErrorGuardadoEntrevista(null);
      } else {
        setEstadoSyncEntrevista('synced');
        setErrorGuardadoEntrevista(null);
      }
    } finally {
      setGuardandoEntrevista(false);
    }
  };

  const cargarEvidenciasPropiasEntrevista = async () => {
    setLoadingEvidenciasHistorialCredito(true);
    try {
      const resumen = await obtenerEvidenciasEntrevista(integranteId);
      const evidenciaControl = [...resumen.evidencias]
        .reverse()
        .find((evidencia) => evidencia.tipo === 'CONTROL_PAGOS');
      const evidenciaFolleto = [...resumen.evidencias]
        .reverse()
        .find((evidencia) => evidencia.tipo === 'FOLLETO_PREMIO_TESORERA');
      const evidenciasCreditoActivo = resumen.evidencias.filter(
        (evidencia) => evidencia.tipo === 'HISTORIAL_CREDITO_ACTIVO',
      );
      const evidenciasCreditoInactivo = resumen.evidencias.filter(
        (evidencia) => evidencia.tipo === 'HISTORIAL_CREDITO_INACTIVO',
      );
      const hayEvidenciasConArchivo = Boolean(
        evidenciaControl
        || evidenciaFolleto
        || evidenciasCreditoActivo.length > 0
        || evidenciasCreditoInactivo.length > 0,
      );
      const headers = hayEvidenciasConArchivo
        ? await getVerificacionDocumentHeaders()
        : undefined;
      setEvidenciaEntrevistaHeaders(headers);
      setFotoControlPagos1(evidenciaControl ? apiUrl(evidenciaControl.archivo_url) : null);
      setFotoFolletoPremioTesorera(evidenciaFolleto ? apiUrl(evidenciaFolleto.archivo_url) : null);
      const presentarEvidenciaCredito = (
        evidencia: (typeof resumen.evidencias)[number],
      ): EvidenciaNegocioVista => ({
        id: evidencia.id,
        uri: apiUrl(evidencia.archivo_url),
        headers,
        registradaAt: evidencia.registrada_at,
      });
      setEvidenciasHistorialCredito({
        HISTORIAL_CREDITO_ACTIVO: evidenciasCreditoActivo.map(presentarEvidenciaCredito),
        HISTORIAL_CREDITO_INACTIVO: evidenciasCreditoInactivo.map(presentarEvidenciaCredito),
      });
      setErroresEvidenciasHistorialCredito(crearErroresEvidenciasHistorialCreditoVacios());
    } catch {
      setErroresEvidenciasHistorialCredito({
        HISTORIAL_CREDITO_ACTIVO: 'No se pudieron consultar las fotografías guardadas del crédito activo.',
        HISTORIAL_CREDITO_INACTIVO: 'No se pudieron consultar las fotografías guardadas del crédito anterior.',
      });
      setErrorGuardadoEntrevista(
        'La entrevista se recuperó, pero no fue posible consultar todas sus fotografías.',
      );
    } finally {
      setLoadingEvidenciasHistorialCredito(false);
    }
  };

  const cargarImagenesDomicilio = async () => {
    setLoadingImagenesDomicilio(true);
    try {
      const resumenImagenes = await obtenerResumenImagenesDomicilio(integranteId);
      const hayImagenesGuardadas = Object.values(resumenImagenes.imagenes).some(Boolean);
      const headers = hayImagenesGuardadas
        ? await getVerificacionDocumentHeaders()
        : undefined;
      const presentar = (tipo: TipoImagenDomicilio): ImagenDomicilioVista | null => {
        const imagen = resumenImagenes.imagenes[tipo];
        return imagen
          ? {
              id: imagen.id,
              uri: apiUrl(imagen.archivo_url),
              headers,
              fotoCapturadaAt: imagen.foto_capturada_at,
            }
          : null;
      };
      setImagenesDomicilio({
        FACHADA: presentar('FACHADA'),
        MEDIDOR_LUZ: presentar('MEDIDOR_LUZ'),
        FACHADA_CON_INTEGRANTE: presentar('FACHADA_CON_INTEGRANTE'),
      });
      setRespuestaTieneMedidorLuz(
        resumenImagenes.medidor_luz
          ? resumenImagenes.medidor_luz.tiene_medidor ? 'Sí' : 'No'
          : '',
      );
      setMotivoSinMedidorLuz(resumenImagenes.medidor_luz?.motivo ?? null);
      setImagenesDomicilioPuedeTerminar(resumenImagenes.proceso.puede_terminar);
      setAbrirMotivosSinMedidorLuz(false);
      setErrorResumenImagenesDomicilio(null);
    } catch {
      setImagenesDomicilioPuedeTerminar(false);
      setErrorResumenImagenesDomicilio(
        'No se pudieron consultar las imágenes del domicilio guardadas.',
      );
    } finally {
      setLoadingImagenesDomicilio(false);
    }
  };

  const cargarEvidenciasNegocio = async () => {
    setLoadingEvidenciasNegocio(true);
    try {
      const resumen = await obtenerEvidenciasNegocio(integranteId);
      const headers = resumen.evidencias.length > 0
        ? await getVerificacionDocumentHeaders()
        : undefined;
      setEvidenciasNegocio(resumen.evidencias.map((evidencia) => ({
        id: evidencia.id,
        uri: apiUrl(evidencia.archivo_url),
        headers,
        registradaAt: evidencia.registrada_at,
      })));
      setErrorEvidenciasNegocio(null);
    } catch {
      setErrorEvidenciasNegocio(
        'No se pudieron consultar las fotografías del negocio guardadas.',
      );
    } finally {
      setLoadingEvidenciasNegocio(false);
    }
  };

  const cargarComprobanteLineaCredito = async (documento?: DocumentoItem) => {
    const requestId = ++comprobanteLineaCreditoRequestRef.current;
    setPaginasComprobanteLineaCredito([]);
    setErrorComprobanteLineaCredito(null);

    if (!documento || documento.estado !== 'Capturado') {
      setLoadingComprobanteLineaCredito(false);
      return;
    }

    setLoadingComprobanteLineaCredito(true);
    try {
      if (documento.ruta?.startsWith('storage:') && documento.uriFrente) {
        const paginasLocales: DocumentImageCarouselPage[] = [
          {
            uri: documento.uriFrente,
            label: 'Comprobante 1',
            headers: documento.headers,
          },
        ];
        if (documento.uriReverso) {
          paginasLocales.push({
            uri: documento.uriReverso,
            label: 'Comprobante 2',
            headers: documento.headers,
          });
        }
        if (comprobanteLineaCreditoRequestRef.current === requestId) {
          setPaginasComprobanteLineaCredito(paginasLocales);
        }
        return;
      }

      if (!documento.ruta) {
        throw new Error('El comprobante de línea de crédito no tiene una ruta disponible.');
      }

      const [remoto, headers] = await Promise.all([
        api.get<DocumentoRemoto>(documento.ruta, VERIFICACION_READ_REQUEST_OPTIONS),
        getVerificacionDocumentHeaders(),
      ]);
      const imagenes = remoto.archivos
        .map((archivo, posicion) => ({ archivo, posicion }))
        .filter(({ archivo }) => archivo.mime_type.startsWith('image/'))
        .sort((a, b) => (a.archivo.indice ?? a.posicion) - (b.archivo.indice ?? b.posicion));

      if (comprobanteLineaCreditoRequestRef.current === requestId) {
        setPaginasComprobanteLineaCredito(imagenes.map(({ archivo }, index) => ({
          uri: apiUrl(archivo.url),
          headers,
          label: `Comprobante ${index + 1}`,
        })));
      }
    } catch (error) {
      if (comprobanteLineaCreditoRequestRef.current === requestId) {
        setErrorComprobanteLineaCredito(
          error instanceof Error
            ? error.message
            : 'No se pudieron consultar las imágenes del comprobante de línea de crédito.',
        );
      }
    } finally {
      if (comprobanteLineaCreditoRequestRef.current === requestId) {
        setLoadingComprobanteLineaCredito(false);
      }
    }
  };

  useEffect(() => {
    setImagenesDomicilio(crearImagenesDomicilioVacias());
    setImagenesDomicilioPendientes(crearImagenesDomicilioPendientesVacias());
    setErroresImagenesDomicilio(crearErroresImagenesDomicilioVacios());
    setLoadingImagenesDomicilio(true);
    setGuardandoImagenDomicilio(null);
    setErrorResumenImagenesDomicilio(null);
    setVistaLlamada('acciones');
    setRespuestasContactoInicial(createEmptyRespuestasContactoInicial());
    setAccionPosteriorLlamada(null);
    setLlamadaCompletada(false);
    setLlamadaContestadaId(null);
    setTelefonoLlamadaPendiente(null);
    setEvidenciaLlamada(null);
    setIneVisitaPages([]);
    setLoadingIneVisita(false);
    setErrorIneVisita(null);
    setVecinoConoceDomicilio(null);
    setVisitaVecinoActualId(null);
    setErrorResumenVisitaVecino(false);
    setGuardandoResultadoVecino(false);
    setIdempotenciaVisitaVecinoPendiente(null);
    setFachadaVisita(null);
    setFachadaVisitaPendiente(null);
    setLoadingFachadaVisita(true);
    setGuardandoFachadaVisita(false);
    setErrorFachadaVisita(null);
    setEvidenciaVisita(null);
    setEvidenciaVisitaPendiente(null);
    setLoadingEvidenciaVisita(false);
    setGuardandoEvidenciaVisita(false);
    setErrorEvidenciaVisita(null);
    setConsultandoDocumentos(false);
    setEvidenciasNegocio([]);
    setEvidenciasNegocioPendientes([]);
    setLoadingEvidenciasNegocio(true);
    setGuardandoEvidenciasNegocio(false);
    setErrorEvidenciasNegocio(null);
    setEvidenciasHistorialCredito(crearEvidenciasHistorialCreditoVacias());
    setEvidenciasHistorialCreditoPendientes(
      crearEvidenciasHistorialCreditoPendientesVacias(),
    );
    setLoadingEvidenciasHistorialCredito(true);
    setGuardandoEvidenciasHistorialCredito(null);
    setErroresEvidenciasHistorialCredito(crearErroresEvidenciasHistorialCreditoVacios());
    comprobanteLineaCreditoRequestRef.current += 1;
    setPaginasComprobanteLineaCredito([]);
    setLoadingComprobanteLineaCredito(false);
    setErrorComprobanteLineaCredito(null);
    setEntrevistaCargada(false);
    setGuardandoEntrevista(false);
    setErrorGuardadoEntrevista(null);
    setEstadoSyncEntrevista('idle');
    ultimaEntrevistaConfirmadaRef.current = '';
    guardadoEntrevistaEnCursoRef.current = false;
    entrevistaPendienteRef.current = null;
    entrevistaAbiertaRef.current = false;
    setEvidenciaEntrevistaHeaders(undefined);
    setEvidenciaControlPagosPendiente(null);
    setEvidenciaFolletoPendiente(null);
    setGuardandoEvidenciaEntrevista(null);
    setConoceAsesora('');
    setComoConocioAsesora('');
    setConoceIntegrantes('');
    setTiempoConoceIntegrantes('');
    setSabeMontosCompaneras('');
    setAcuerdoMontos('');
    setConoceTesoreraDelGrupo('');
    setQuienEsTesorera('');
    setDomicilioRecoleccion('');
    setTieneFamiliarGrupo('');
    setFamiliaresGrupoIds([]);
    setViveEnDomicilioDeclarado('');
    setMotivoNoViveEnDomicilio('');
    setTipoDomicilio('');
    setFamiliarDomicilio('');
    setAniosEnDomicilio('');
    setQuienViveConUsted([]);
    setTelefonoConfirmado('');
    setTelefonoSecundario('');
    setSelectorCanalTelefonoVisible(false);
    setTelefonoSeleccionadoParaContacto('');
    setTipoTelefonoSeleccionadoParaContacto(null);
    setConfirmacionTelefonoPendiente(null);
    setConfirmacionTelefonoEvidenciaVisible(false);
    setGuardandoConfirmacionTelefono(false);
    setTelefonoPrincipalConfirmadoValor(null);
    setTelefonoSecundarioConfirmadoValor(null);
    setEvidenciaTelefonoVisible(false);
    setReemplazoEvidenciaTelefonoVisible(false);
    setTelefonoEvidenciaEnVista(null);
    setEvidenciaTelefonoHeaders(undefined);
    setGuardandoReemplazoEvidenciaTelefono(false);
    setFuentesIngresoPersonal([]);
    setLugarTrabajo('');
    setAntiguedadLaboral('');
    setIngresosSemanalesDeclarados('');
    setTieneOtroIngresoHogar('');
    setOtroIngresoSemanal('');
    setCapacidadPagoSemanal('');
    setPersonasVivenCasa('');
    setQuienesVivenConUstedSabenDelCredito('');
    setViveEnDomicilioDeclarado('');
    setMotivoNoViveEnDomicilio('');
    setTipoDomicilio('');
    setFamiliarDomicilio('');
    setTieneOtroCreditoGrupal('');
    setFinancieraCreditoGrupal('');
    setCreditoGrupalAnteriorActivo('');
    setValorFichaCreditoGrupal('');
    setSemanaActualCreditoGrupal('');
    setMesDesembolsoCreditoGrupal('');
    setMesUltimoPagoCreditoGrupal('');
    setAnioUltimoPagoCreditoGrupal('');
    setNumeroCiclosCreditoGrupal('');
    setNombreAsesoraCreditoGrupal('');
    setTelefonoAsesoraCreditoGrupal('');
    setTasaCreditoGrupal('');
    setMotivoNoRenovacionCreditoGrupal('');
    setTipoNegocio('');
    setIngresoLibreSemanalNegocio('');
    setTieneControlPagos('');
    setFotoControlPagos1(null);
    setFotoControlPagos2(null);
    setFotoControlPagosVisible(false);
    setCompanerasMontoNoAcordadoIds([]);
    setMotivosDesacuerdoMontosPorIntegrante({});
    setConoceTesoreraDelGrupo('');
    setQuienEsTesorera('');
    setMotivoSinControl('');
    setAsesoraAcudioSemanalmente('');
    setFirmabanControlSemanalmente('');
    setTratoAsesoraTesorera('');
    setConocePremioTesorera('');
    setFotoFolletoPremioTesorera(null);
    setFotoFolletoPremioVisible(false);
    setOpinionCredito('');
    setTratoDesembolso('');
    setRapidezDesembolso('');
    setInformacionCreditoClara('');
    setTratoAsesor('');
    setCalidadServicio('');
    setRecomendaria('');
    setRazonRecomendacion('');
    setMotivoRecomendacion('');

    const loadIntegrante = async () => {
      setLoading(true);
      setResumenLlamadas(null);
      setErrorResumenLlamadas(false);
      try {
        const savedProgress = usuario?.id
          ? await getLocalVerificationProgress(usuario.id, integranteId)
          : null;
        let hasAllRequiredDocuments = false;

        const integranteData = await api.get<any>(
          `/integrantes/${integranteId}`,
          VERIFICACION_READ_REQUEST_OPTIONS,
        );
        setIntegrante({
          ...integranteData,
          telefonoSecundario: integranteData.telefonoSecundario
            ?? integranteData.telefono_secundario
            ?? null,
          montoSolicitado: integranteData.montoSolicitado == null
            ? null
            : Number(integranteData.montoSolicitado),
          montoAutorizadoAnterior: integranteData.montoAutorizadoAnterior == null
            ? null
            : Number(integranteData.montoAutorizadoAnterior),
          esTesorera: integranteData.es_tesorera || false,
          cicloNumeroActual: cycleNumber(integranteData.cicloNumeroActual),
          esRenovacion: Boolean(integranteData.esRenovacion),
          esNuevaConNosotros: integranteData.es_nueva_con_nosotros === true,
          tieneHistorialInterno: typeof integranteData.tiene_historial_interno === 'boolean'
            ? integranteData.tiene_historial_interno
            : null,
          creditosParticipados: integranteData.creditos_participados != null
            && Number.isFinite(Number(integranteData.creditos_participados))
            ? Number(integranteData.creditos_participados)
            : null,
          historialCrediticioInterno: mapCreditHistory(
            integranteData.historial_crediticio_interno ?? integranteData.historialCrediticioInterno,
          ),
          edad: integranteData.edad != null && Number.isFinite(Number(integranteData.edad))
            ? Number(integranteData.edad)
            : null,
          superaLimiteEdad: integranteData.supera_limite_edad === true,
          distanciaTesoreraAproxKm: null,
        });
        setTelefonoConfirmado(formatPhone(integranteData.telefono ?? ''));

        await cargarEntrevistaGuardada();
        await cargarImagenesDomicilio();
        await cargarEvidenciasNegocio();
        await cargarEvidenciasPropiasEntrevista();

        try {
          const resumen = await obtenerResumenLlamadas(integranteId);
          setResumenLlamadas(resumen);
          setLlamadaCompletada(resumen.proceso.completado);
          setTelefonoPrincipalConfirmadoValor(
            resumen.telefonos_confirmados?.PRINCIPAL?.telefono ?? null,
          );
          setTelefonoSecundarioConfirmadoValor(
            resumen.telefonos_confirmados?.SECUNDARIO?.telefono ?? null,
          );
          setErrorResumenLlamadas(false);
        } catch {
          setResumenLlamadas(null);
          setErrorResumenLlamadas(true);
        }

        let fachadaIdActual: string | null = null;
        try {
          const resumenFachada = await obtenerResumenFachadaVisita(integranteId);
          if (resumenFachada.fachada) {
            const headers = await getVerificacionDocumentHeaders();
            fachadaIdActual = resumenFachada.fachada.id;
            setFachadaVisita({
              id: resumenFachada.fachada.id,
              uri: apiUrl(resumenFachada.fachada.archivo_url),
              headers,
              fotoCapturadaAt: resumenFachada.fachada.foto_capturada_at,
            });
          } else {
            setFachadaVisita(null);
          }
          setErrorFachadaVisita(null);
        } catch {
          setFachadaVisita(null);
          setErrorFachadaVisita(
            'No se pudo consultar la fotografía de fachada guardada.',
          );
        } finally {
          setLoadingFachadaVisita(false);
        }

        try {
          const resumenVisita = await obtenerResumenVisitaVecino(integranteId);
          const resultadoVigente = resumenVisita.resultado
            && (
              fachadaIdActual === null
              || resumenVisita.resultado.fachada_id === fachadaIdActual
            )
            ? resumenVisita.resultado
            : null;
          setVecinoConoceDomicilio(
            resultadoVigente
              ? (resultadoVigente.conoce_y_sabe_donde_vive ? 'si' : 'no')
              : null,
          );
          setVisitaVecinoActualId(resultadoVigente?.visita_id ?? null);
          setErrorResumenVisitaVecino(false);

          if (resultadoVigente) {
            setLoadingEvidenciaVisita(true);
            try {
              const resumenEvidencia = await obtenerResumenEvidenciaVisita(
                integranteId,
                resultadoVigente.visita_id,
              );
              if (resumenEvidencia.evidencia) {
                const headers = await getVerificacionDocumentHeaders();
                setEvidenciaVisita({
                  id: resumenEvidencia.evidencia.id,
                  uri: apiUrl(resumenEvidencia.evidencia.archivo_url),
                  headers,
                  fotoCapturadaAt: resumenEvidencia.evidencia.foto_capturada_at,
                });
              } else {
                setEvidenciaVisita(null);
              }
              setErrorEvidenciaVisita(null);
            } catch {
              setEvidenciaVisita(null);
              setErrorEvidenciaVisita(
                'No se pudo consultar la fotografía de evidencia guardada.',
              );
            } finally {
              setLoadingEvidenciaVisita(false);
            }
          } else {
            setEvidenciaVisita(null);
            setLoadingEvidenciaVisita(false);
          }
        } catch {
          setVecinoConoceDomicilio(null);
          setVisitaVecinoActualId(null);
          setEvidenciaVisita(null);
          setLoadingEvidenciaVisita(false);
          setErrorResumenVisitaVecino(true);
        }

        const solicitudData = await api.get<any | null>(
          `/solicitudes/integrante/${integranteId}`,
          VERIFICACION_READ_REQUEST_OPTIONS,
        );
        if (solicitudData) {

          // Guardar datos de la solicitud para usar en los headers
          setSolicitudData({
            nombres: solicitudData.nombres,
            apellido_pat: solicitudData.apellido_pat,
            apellido_mat: solicitudData.apellido_mat,
            nombre_completo: solicitudData.nombre_completo,
            dom_calle: solicitudData.dom_calle,
            dom_num_ext: solicitudData.dom_num_ext,
            dom_num_int: solicitudData.dom_num_int,
            dom_colonia: solicitudData.dom_colonia,
            dom_municipio: solicitudData.dom_municipio,
            dom_codigo_postal: solicitudData.dom_codigo_postal,
          });

          // Función para validar si una ruta es válida (no es mobile-temp)
          const esRutaValida = (ruta: string) => ruta && !ruta.startsWith('mobile-temp:');

          // Mapear y cargar documentos desde AsyncStorage
          const documentosFuente: DocumentoFuente[] = [
            {
              clave: 'ine_integrante',
              tipo: 'ine',
              obligatorioRevision: true,
              nombre: 'INE',
              icono: '🪪',
              rutaDB: solicitudData.doc_ine_ruta,
            },
            {
              clave: 'comprobante_domicilio',
              tipo: 'comprobante',
              obligatorioRevision: true,
              nombre: 'Comprobante de domicilio',
              icono: '🧾',
              rutaDB: solicitudData.doc_comprobante_ruta,
            },
            {
              clave: 'solicitud_firmada',
              tipo: 'solicitud_firmada',
              obligatorioRevision: true,
              nombre: 'Solicitud firmada',
              icono: '📄',
              rutaDB: solicitudData.doc_solicitud_firmada_ruta,
            },
            {
              clave: 'ine_beneficiario',
              tipo: 'ine_beneficiario',
              obligatorioRevision: false,
              nombre: 'INE Beneficiario',
              icono: '🪪',
              rutaDB: solicitudData.doc_ine_beneficiario_ruta,
            },
            {
              clave: 'comprobante_linea_credito',
              tipo: 'comprobante_credito',
              obligatorioRevision: false,
              nombre: 'Comprobante Línea de Crédito',
              icono: '🧾',
              rutaDB: solicitudData.doc_comprobante_credito_ruta,
            },
          ];

          const docsMap = await Promise.all(documentosFuente.map(async (doc): Promise<DocumentoItem> => {
            let uriFrente: string | undefined;
            let uriReverso: string | undefined;
            const rutaDB = doc.rutaDB;

            // Si la ruta es válida y empieza con "storage:", cargar desde AsyncStorage
            if (rutaDB && esRutaValida(rutaDB) && rutaDB.startsWith('storage:')) {
              const storageKey = rutaDB.split('|')[0].replace('storage:', '');
              try {
                const stored = await AsyncStorage.getItem(storageKey);
                if (stored) {
                  const documentData = JSON.parse(stored);
                  uriFrente = documentData.frente;
                  uriReverso = documentData.reverso;
                }
              } catch {
              }
            }

            return {
              clave: doc.clave,
              tipo: doc.tipo,
              obligatorioRevision: doc.obligatorioRevision,
              nombre: doc.nombre,
              icono: doc.icono,
              ruta: rutaDB,
              estado: (rutaDB && esRutaValida(rutaDB)) ? 'Capturado' : 'Pendiente',
              uriFrente,
              uriReverso,
              validacion: null,
            };
          }));

          setDocumentos(docsMap);
          void cargarComprobanteLineaCredito(
            docsMap.find((documento) => documento.tipo === 'comprobante_credito'),
          );
          const documentosObligatorios = docsMap.filter((doc) => doc.obligatorioRevision);
          hasAllRequiredDocuments = documentosObligatorios.length === TIPOS_DOCUMENTO_REVISION.length
            && documentosObligatorios.every((doc) => doc.estado === 'Capturado');
        } else {
          setSolicitudData(null);
          setDocumentos([]);
          void cargarComprobanteLineaCredito();
        }

        if (
          (savedProgress?.currentStep === 'menu'
            || savedProgress?.currentStep === 'llamada-integrante')
          && hasAllRequiredDocuments
        ) {
          setPasoActual('menu');
        } else {
          setPasoActual('documentos');
          if (
            (savedProgress?.currentStep === 'menu'
              || savedProgress?.currentStep === 'llamada-integrante')
            && usuario?.id
          ) {
            try {
              await saveNeedsDocumentationProgress(usuario.id, integranteId);
            } catch (error) {
              console.warn('No se pudo actualizar la incidencia documental.', error);
            }
          }
        }

        // Cargar integrantes del grupo para el selector de tesorera
        if (integranteData.expediente_id) {
          try {
            const integrantesData = await api.get<any[]>(
              `/integrantes/expediente/${integranteData.expediente_id}`,
              VERIFICACION_READ_REQUEST_OPTIONS,
            );
            const integrantesActivas = integrantesData.filter((int: any) => int.estado !== 'RETIRADA');
            const integrantesConDistancias = calcularDistanciasAproximadasRegistradas(integrantesActivas);
            const integrantesMapped = integrantesConDistancias.map((int: any) => ({
              id: int.id,
              nombre: int.nombre || int.nombre_completo || `${int.nombres || ''} ${int.apellido_pat || ''}`.trim(),
              telefono: int.telefono,
              montoSolicitado: (int.monto_solicitado ?? int.montoSolicitado) == null
                ? null
                : Number(int.monto_solicitado ?? int.montoSolicitado),
              montoAutorizadoAnterior: int.montoAutorizadoAnterior == null
                ? null
                : Number(int.montoAutorizadoAnterior),
              esTesorera: int.es_tesorera || false,
              cicloNumeroActual: cycleNumber(int.cicloNumeroActual ?? int.ciclo),
              esRenovacion: Number(int.cicloNumeroActual ?? int.ciclo ?? 0) > 1,
              esNuevaConNosotros: int.es_nueva_con_nosotros === true,
              tieneHistorialInterno: typeof int.tiene_historial_interno === 'boolean'
                ? int.tiene_historial_interno
                : null,
              creditosParticipados: int.creditos_participados != null
                && Number.isFinite(Number(int.creditos_participados))
                ? Number(int.creditos_participados)
                : null,
              historialCrediticioInterno: mapCreditHistory(
                int.historial_crediticio_interno ?? int.historialCrediticioInterno,
              ),
              edad: int.edad != null && Number.isFinite(Number(int.edad))
                ? Number(int.edad)
                : null,
              superaLimiteEdad: int.supera_limite_edad === true,
              distanciaTesoreraAproxKm: int.distancia_tesorera_aprox_km != null
                && Number.isFinite(Number(int.distancia_tesorera_aprox_km))
                ? Number(int.distancia_tesorera_aprox_km)
                : null,
            }));
            setIntegrantesGrupo(integrantesMapped);
            const integranteActual = integrantesMapped.find((int) => int.id === integranteId);
            if (integranteActual) {
              setIntegrante((actual) => actual ? {
                ...actual,
                cicloNumeroActual: integranteActual.cicloNumeroActual,
                creditosParticipados: integranteActual.creditosParticipados,
                historialCrediticioInterno: integranteActual.historialCrediticioInterno,
                edad: integranteActual.edad,
                superaLimiteEdad: integranteActual.superaLimiteEdad,
                distanciaTesoreraAproxKm: integranteActual.distanciaTesoreraAproxKm,
              } : actual);
            }
          } catch (err) {
            console.warn('No se pudo cargar el selector de integrantes del grupo.', err);
          }
        }
      } catch (error) {
        Alert.alert(
          'No se pudo abrir la verificación',
          error instanceof Error ? error.message : 'Revisa tu conexión e intenta nuevamente.',
        );
      } finally {
        setLoadingImagenesDomicilio(false);
        setLoading(false);
      }
    };

    loadIntegrante();
  }, [integranteId, usuario?.id]);

  const entrevistaPayloadActual: EntrevistaPayload = crearEntrevistaPayload(
    entrevistaFormValues,
    NO_SABE_DOMICILIO_RECOLECCION_VALUE,
  );
  const entrevistaSerializada = JSON.stringify(entrevistaPayloadActual);
  const entrevistaSerializadaDebounced = useDebounce(entrevistaSerializada, 900);

  useEffect(() => {
    if (
      !entrevistaCargada
      || !entrevistaAbiertaRef.current
      || entrevistaSerializadaDebounced === ultimaEntrevistaConfirmadaRef.current
    ) {
      return;
    }

    entrevistaPendienteRef.current = entrevistaSerializadaDebounced;
    const guardarPendientes = async () => {
      if (guardadoEntrevistaEnCursoRef.current) return;
      guardadoEntrevistaEnCursoRef.current = true;
      setGuardandoEntrevista(true);
      try {
        while (entrevistaPendienteRef.current) {
          const pendiente = entrevistaPendienteRef.current;
          entrevistaPendienteRef.current = null;
          const payload = JSON.parse(pendiente) as EntrevistaPayload;
          await saveDraft({
            key: entrevistaDraftKey,
            module: 'VERIFICACION',
            entityType: 'entrevista',
            entityId: integranteId,
            data: payload,
          });
          const result = await enqueueJson({
            module: 'VERIFICACION',
            entityType: 'entrevista',
            entityId: integranteId,
            dedupeKey: `entrevista:${integranteId}`,
            draftKey: entrevistaDraftKey,
            endpoint: `/verificacion/integrantes/${integranteId}/entrevista`,
            method: 'PUT',
            body: payload,
            conflict: {
              key: entrevistaVersionKey,
              requestField: 'expected_revision',
              responsePath: 'entrevista.revision',
            },
          });
          ultimaEntrevistaConfirmadaRef.current = pendiente;
          if (result.status === 'BLOCKED') {
            setEstadoSyncEntrevista('blocked');
            setErrorGuardadoEntrevista(
              result.error || 'La entrevista requiere revisión antes de sincronizar.',
            );
          } else {
            setEstadoSyncEntrevista(result.status === 'CONFIRMED' ? 'synced' : 'pending');
            setErrorGuardadoEntrevista(null);
          }
        }
      } catch {
        setErrorGuardadoEntrevista(
          'No se pudo conservar el borrador de la entrevista. Intenta nuevamente antes de salir.',
        );
      } finally {
        guardadoEntrevistaEnCursoRef.current = false;
        setGuardandoEntrevista(false);
      }
    };

    void guardarPendientes();
  }, [
    entrevistaCargada,
    entrevistaSerializadaDebounced,
    enqueueJson,
    entrevistaDraftKey,
    entrevistaVersionKey,
    integranteId,
    pasoActual,
    saveDraft,
    setServerVersion,
  ]);

  const tomarFoto = async (callback: (uri: string) => void) => {
    try {
      // Solicitar permisos de cámara
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Se necesitan permisos de cámara para tomar fotos. Por favor, habilita los permisos en la configuración de tu dispositivo.'
        );
        return;
      }

      // Lanzar la cámara
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        exif: false,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets[0]?.uri) {
        callback(result.assets[0].uri);
      }
    } catch {
      Alert.alert(
        'Error',
        'No se pudo abrir la cámara. Por favor, verifica que los permisos estén habilitados.'
      );
    }
  };

  // Los selectores nativos de cámara y galería no deben permanecer debajo del
  // overlay global de procesamiento: en algunos dispositivos bloquea sus controles.
  const handleTomarFoto = tomarFoto;

  const guardarEvidenciaEspecialEntrevista = async (
    pendiente: EvidenciaEntrevistaPendiente,
    onGuardada: (uri: string) => void,
    onPendiente: (evidencia: EvidenciaEntrevistaPendiente | null) => void,
  ) => {
    setGuardandoEvidenciaEntrevista(pendiente.tipo as 'CONTROL_PAGOS' | 'FOLLETO_PREMIO_TESORERA');
    onPendiente(pendiente);
    try {
      const respuesta = await registrarEvidenciaEntrevista(integranteId, pendiente);
      const headers = await getVerificacionDocumentHeaders();
      setEvidenciaEntrevistaHeaders(headers);
      onGuardada(apiUrl(respuesta.evidencia.archivo_url));
      onPendiente(null);
      setErrorGuardadoEntrevista(null);
    } catch (error) {
      setErrorGuardadoEntrevista(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la fotografía con su ubicación. Inténtalo nuevamente.',
      );
    } finally {
      setGuardandoEvidenciaEntrevista(null);
    }
  };

  const capturarYGuardarEvidenciaEntrevista = async (
    tipo: 'CONTROL_PAGOS' | 'FOLLETO_PREMIO_TESORERA',
    onGuardada: (uri: string) => void,
    onPendiente: (evidencia: EvidenciaEntrevistaPendiente | null) => void,
  ) => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (permiso.status !== 'granted') {
        setErrorGuardadoEntrevista('Permite el acceso a la cámara para guardar esta evidencia.');
        return;
      }
      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: false,
        exif: false,
      });
      const asset = resultado.canceled ? undefined : resultado.assets[0];
      if (!asset) return;
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        setErrorGuardadoEntrevista('La fotografía supera 10 MB. Tómala nuevamente.');
        return;
      }
      const mimeType: 'image/jpeg' | 'image/png' = asset.mimeType === 'image/png'
        ? 'image/png'
        : 'image/jpeg';
      const fotoCapturadaAt = new Date().toISOString();
      const ubicacion = await obtenerUbicacionEntrevista();
      const pendiente: EvidenciaEntrevistaPendiente = {
        tipo,
        uri: asset.uri,
        nombre: asset.fileName
          || `evidencia-entrevista-${Date.now()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`,
        mimeType,
        idempotencyKey: crearClaveIdempotenciaEvidenciaEntrevista(tipo),
        fotoCapturadaAt,
        ubicacion,
      };
      await guardarEvidenciaEspecialEntrevista(pendiente, onGuardada, onPendiente);
    } catch (error) {
      setErrorGuardadoEntrevista(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la fotografía con su ubicación. Inténtalo nuevamente.',
      );
    }
  };

  const abrirOpcionesFotoControlPagos = () => {
    void capturarYGuardarEvidenciaEntrevista(
      'CONTROL_PAGOS',
      setFotoControlPagos1,
      setEvidenciaControlPagosPendiente,
    );
  };

  const guardarImagenDomicilio = async (pendiente: ImagenDomicilioPendienteEnPantalla) => {
    if (guardandoImagenDomicilio) return;
    setGuardandoImagenDomicilio(pendiente.tipo);
    setImagenesDomicilioPendientes((actuales) => ({
      ...actuales,
      [pendiente.tipo]: pendiente,
    }));
    setErroresImagenesDomicilio((actuales) => ({
      ...actuales,
      [pendiente.tipo]: null,
    }));

    try {
      const registro = await registrarImagenDomicilio(integranteId, pendiente);
      if (!registro.imagen) {
        throw new Error('El servidor no confirmó la imagen del domicilio.');
      }
      setImagenesDomicilio((actuales) => ({
        ...actuales,
        [pendiente.tipo]: {
          id: registro.imagen.id,
          uri: pendiente.uri,
          fotoCapturadaAt: registro.imagen.foto_capturada_at,
        },
      }));
      setImagenesDomicilioPendientes((actuales) => ({
        ...actuales,
        [pendiente.tipo]: null,
      }));
      setErroresImagenesDomicilio((actuales) => ({
        ...actuales,
        [pendiente.tipo]: null,
      }));
      setRespuestaTieneMedidorLuz(
        registro.resumen.medidor_luz
          ? registro.resumen.medidor_luz.tiene_medidor ? 'Sí' : 'No'
          : '',
      );
      setMotivoSinMedidorLuz(registro.resumen.medidor_luz?.motivo ?? null);
      setImagenesDomicilioPuedeTerminar(registro.resumen.proceso.puede_terminar);
      setAbrirMotivosSinMedidorLuz(false);
      setErrorResumenImagenesDomicilio(null);
    } catch (error) {
      const mensaje = error instanceof Error
        ? error.message
        : 'Revisa tu conexión e intenta nuevamente.';
      setErroresImagenesDomicilio((actuales) => ({
        ...actuales,
        [pendiente.tipo]: mensaje,
      }));
      Alert.alert('La imagen no se guardó', mensaje);
    } finally {
      setGuardandoImagenDomicilio(null);
    }
  };

  const tomarImagenDomicilio = async (tipo: TipoImagenDomicilioEnPantalla) => {
    if (guardandoImagenDomicilio || guardandoRespuestaMedidorLuz) return;
    if (tipo === 'MEDIDOR_LUZ' && respuestaTieneMedidorLuz !== 'Sí') {
      Alert.alert(
        'Confirma el medidor de luz',
        'Selecciona Sí en la pregunta sobre el medidor antes de tomar la fotografía.',
      );
      return;
    }

    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (permiso.status !== 'granted') {
        Alert.alert(
          'Permiso de cámara requerido',
          'Permite el acceso a la cámara para tomar la imagen del domicilio.',
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });
      const uri = resultado.assets?.[0]?.uri;
      if (resultado.canceled || !uri) return;

      const fotoCapturadaAt = new Date().toISOString();
      let ubicacion;
      try {
        ubicacion = await obtenerUbicacionImagenDomicilio();
      } catch (error) {
        Alert.alert(
          'La imagen no se guardó',
          error instanceof Error
            ? `${error.message} Vuelve a tomarla cuando la ubicación esté disponible.`
            : 'No se pudo obtener la ubicación. Vuelve a tomar la imagen.',
        );
        return;
      }

      await guardarImagenDomicilio({
        tipo,
        uri,
        idempotencyKey: crearClaveIdempotenciaImagenDomicilio(),
        fotoCapturadaAt,
        ubicacion,
      });
    } catch (error) {
      Alert.alert(
        'No se pudo abrir la cámara',
        error instanceof Error
          ? error.message
          : 'Verifica el permiso de cámara e inténtalo nuevamente.',
      );
    }
  };

  const guardarRespuestaSobreMedidor = async (
    tieneMedidor: boolean,
    motivo?: MotivoSinMedidorLuz,
  ) => {
    const fachadaId = imagenesDomicilio.FACHADA?.id;
    if (!fachadaId || guardandoRespuestaMedidorLuz) return;

    setGuardandoRespuestaMedidorLuz(true);
    setImagenesDomicilioPuedeTerminar(false);
    try {
      const registro = await registrarRespuestaMedidorLuz(integranteId, {
        fachadaId,
        tieneMedidor,
        motivo,
        idempotencyKey: crearClaveIdempotenciaRespuestaMedidorLuz(),
      });
      const respuestaConfirmada = registro.resumen.medidor_luz;
      if (!respuestaConfirmada || respuestaConfirmada.fachada_id !== fachadaId) {
        throw new Error('El servidor no confirmó la respuesta para la fachada actual.');
      }
      setRespuestaTieneMedidorLuz(respuestaConfirmada.tiene_medidor ? 'Sí' : 'No');
      setMotivoSinMedidorLuz(respuestaConfirmada.motivo);
      setImagenesDomicilioPuedeTerminar(registro.resumen.proceso.puede_terminar);
      setAbrirMotivosSinMedidorLuz(false);
      setErrorResumenImagenesDomicilio(null);
    } catch (error) {
      const mensaje = error instanceof Error
        ? error.message
        : 'Revisa tu conexión e intenta nuevamente.';
      Alert.alert('La respuesta no se guardó', mensaje);
      await cargarImagenesDomicilio();
    } finally {
      setGuardandoRespuestaMedidorLuz(false);
    }
  };

  const handleSeleccionarTieneMedidor = (valor: string) => {
    if (guardandoRespuestaMedidorLuz) return;

    if (valor === 'Sí') {
      if (respuestaTieneMedidorLuz === 'Sí') return;
      setAbrirMotivosSinMedidorLuz(false);
      void guardarRespuestaSobreMedidor(true);
      return;
    }

    setRespuestaTieneMedidorLuz('No');
    setMotivoSinMedidorLuz(null);
    setImagenesDomicilioPuedeTerminar(false);
    setAbrirMotivosSinMedidorLuz(true);
    setVersionPopupMotivoMedidor((actual) => actual + 1);
  };

  const handleSeleccionarMotivoSinMedidor = (etiqueta: string) => {
    const opcion = MOTIVOS_SIN_MEDIDOR_LUZ.find(
      (motivo) => motivo.etiqueta === etiqueta,
    );
    if (!opcion) return;

    setAbrirMotivosSinMedidorLuz(false);
    void guardarRespuestaSobreMedidor(false, opcion.codigo);
  };

  const abrirProcesos = async () => {
    if (usuario?.id) {
      try {
        await saveStepOneCompleted(usuario.id, integranteId);
      } catch (error) {
        console.warn('No se pudo guardar el avance local de verificación.', error);
      }
    }

    setConsultandoDocumentos(false);
    setPasoActual('menu');
  };

  const handleLlamarIntegrante = (telefono: string, nombre: string) => {
    llamar(telefono, nombre);
  };

  const prepararResultadoLlamada = (
    canal: CanalLlamadaVerificacion,
    telefonoUtilizado: { tipo: TipoTelefonoEntrevista; telefono: string },
  ) => {
    setRespuestasContactoInicial(createEmptyRespuestasContactoInicial());
    setAccionPosteriorLlamada(null);
    setLlamadaContestadaId(null);
    setEvidenciaLlamada(null);
    setCanalLlamadaPendiente(canal);
    setTelefonoLlamadaPendiente({
      tipo: telefonoUtilizado.tipo,
      telefono: telefonoUtilizado.telefono.replace(/\D/g, ''),
    });
    setIdempotenciaLlamadaPendiente(crearClaveIdempotenciaLlamada());
    setShowLlamadaModal(true);
  };

  const iniciarContactoLlamada = (
    canal: CanalLlamadaVerificacion,
    opcion: TelefonoLlamadaDisponible,
  ) => {
    const telefonoUtilizado = { tipo: opcion.tipo, telefono: opcion.numero };
    if (canal === 'TELEFONICA') {
      llamar(
        opcion.numero,
        integrante?.nombre ?? '',
        undefined,
        () => prepararResultadoLlamada('TELEFONICA', telefonoUtilizado),
      );
      return;
    }

    void abrirWhatsApp(
      opcion.numero,
      () => prepararResultadoLlamada('WHATSAPP', telefonoUtilizado),
    );
  };

  const abrirSeleccionNumeroLlamada = (canal: CanalLlamadaVerificacion) => {
    const llamadasTelefonicasRegistradas = resumenLlamadas
      ? resumenLlamadas.telefonica.no_contestadas + resumenLlamadas.telefonica.contestadas
      : 0;

    if (canal === 'WHATSAPP' && llamadasTelefonicasRegistradas === 0) return;

    const telefonosDisponibles = obtenerTelefonosLlamadaDisponibles(integrante);
    if (telefonosDisponibles.length === 0) {
      Alert.alert(
        'Número no disponible',
        'La integrante no tiene un teléfono válido para realizar la llamada.',
      );
      return;
    }

    if (telefonosDisponibles.length === 1) {
      iniciarContactoLlamada(canal, telefonosDisponibles[0]);
      return;
    }

    setCanalParaSeleccionarNumero(canal);
    setSelectorNumeroLlamadaVisible(true);
  };

  const cerrarSelectorNumeroLlamada = () => {
    setSelectorNumeroLlamadaVisible(false);
    setCanalParaSeleccionarNumero(null);
  };

  const handleSeleccionarNumeroLlamada = (opcion: TelefonoLlamadaDisponible) => {
    const canal = canalParaSeleccionarNumero;
    cerrarSelectorNumeroLlamada();
    if (!canal) return;

    iniciarContactoLlamada(canal, opcion);
  };

  const handleRealizarLlamada = () => {
    abrirSeleccionNumeroLlamada('TELEFONICA');
  };

  const handleRealizarLlamadaWhatsApp = () => {
    abrirSeleccionNumeroLlamada('WHATSAPP');
  };

  const prepararResultadoDesdeTelefonoSeleccionado = (
    canal: CanalLlamadaVerificacion,
    telefono: string,
    tipo: TipoTelefonoEntrevista,
  ) => {
    setConfirmacionTelefonoPendiente({
      tipo,
      telefono: telefono.replace(/\D/g, ''),
    });
    prepararResultadoLlamada(canal, { tipo, telefono });
  };

  const handleSeleccionarCanalTelefono = (
    telefono: string,
    tipo: TipoTelefonoEntrevista,
  ) => {
    if (telefono.replace(/\D/g, '').length !== 10) return;
    Keyboard.dismiss();
    setTelefonoSeleccionadoParaContacto(telefono);
    setTipoTelefonoSeleccionadoParaContacto(tipo);
    setSelectorCanalTelefonoVisible(true);
  };

  const cerrarSelectorCanalTelefono = () => {
    setSelectorCanalTelefonoVisible(false);
    setTelefonoSeleccionadoParaContacto('');
    setTipoTelefonoSeleccionadoParaContacto(null);
  };

  const handleLlamadaTelefonoSeleccionado = () => {
    const telefono = telefonoSeleccionadoParaContacto;
    const tipo = tipoTelefonoSeleccionadoParaContacto;
    if (!tipo) return;
    setSelectorCanalTelefonoVisible(false);
    llamar(
      telefono,
      integrante?.nombre ?? '',
      undefined,
      () => prepararResultadoDesdeTelefonoSeleccionado('TELEFONICA', telefono, tipo),
    );
    setTelefonoSeleccionadoParaContacto('');
    setTipoTelefonoSeleccionadoParaContacto(null);
  };

  const handleWhatsAppTelefonoSeleccionado = () => {
    const llamadasTelefonicasRegistradas = resumenLlamadas
      ? resumenLlamadas.telefonica.no_contestadas + resumenLlamadas.telefonica.contestadas
      : 0;
    if (llamadasTelefonicasRegistradas === 0) return;

    const telefono = telefonoSeleccionadoParaContacto;
    const tipo = tipoTelefonoSeleccionadoParaContacto;
    if (!tipo) return;
    setSelectorCanalTelefonoVisible(false);
    void abrirWhatsApp(
      telefono,
      () => prepararResultadoDesdeTelefonoSeleccionado('WHATSAPP', telefono, tipo),
    );
    setTelefonoSeleccionadoParaContacto('');
    setTipoTelefonoSeleccionadoParaContacto(null);
  };

  const handleResultadoLlamada = async (resultado: 'si-contesto' | 'no-contesto') => {
    if (
      guardandoResultadoLlamada
      || !canalLlamadaPendiente
      || !idempotenciaLlamadaPendiente
    ) {
      return;
    }

    setGuardandoResultadoLlamada(true);

    try {
      const ubicacion = await obtenerUbicacionLlamada();
      const registro = await registrarLlamada(
        integranteId,
        canalLlamadaPendiente,
        resultado === 'si-contesto' ? 'CONTESTADA' : 'NO_CONTESTADA',
        idempotenciaLlamadaPendiente,
        ubicacion,
        telefonoLlamadaPendiente?.tipo,
        telefonoLlamadaPendiente?.telefono,
      );

      setResumenLlamadas(registro.resumen);
      setLlamadaCompletada(registro.resumen.proceso.completado);
      setErrorResumenLlamadas(false);
      if (resultado === 'no-contesto') {
        setVistaLlamada('acciones');
        setRespuestasContactoInicial(createEmptyRespuestasContactoInicial());
        setAccionPosteriorLlamada(null);
        setConfirmacionTelefonoPendiente(null);
      }
      setShowLlamadaModal(false);
      setCanalLlamadaPendiente(null);
      setIdempotenciaLlamadaPendiente(null);
      setTelefonoLlamadaPendiente(null);

      if (resultado === 'si-contesto') {
        setLlamadaContestadaId(registro.llamada.id);
        if (confirmacionTelefonoPendiente) {
          setEvidenciaLlamada(null);
          setConfirmacionTelefonoEvidenciaVisible(true);
        } else {
          setVistaLlamada('encuesta');
          scrollViewRef.current?.scrollTo({ y: 0, animated: false });
          setAccionPosteriorLlamada(null);
        }
      }
    } catch (error) {
      Alert.alert(
        'No se guardó la llamada',
        error instanceof Error
          ? error.message
          : 'Revisa tu conexión e intenta registrar nuevamente el resultado.',
      );
    } finally {
      setGuardandoResultadoLlamada(false);
    }
  };

  const handleDismissResultadoLlamada = () => {
    if (guardandoResultadoLlamada) return;
    setShowLlamadaModal(false);
    setCanalLlamadaPendiente(null);
    setIdempotenciaLlamadaPendiente(null);
    setTelefonoLlamadaPendiente(null);
    setConfirmacionTelefonoPendiente(null);
  };

  const handleRespuestaVisitaVecino = async (
    respuesta: Exclude<YesNoValue, null>,
  ) => {
    if (guardandoResultadoVecino) return;
    if (!fachadaVisita) {
      Alert.alert(
        'Falta la fotografía de fachada',
        'Toma y guarda la fotografía desde la cámara antes de registrar la respuesta del vecino.',
      );
      return;
    }

    const intento = idempotenciaVisitaVecinoPendiente?.respuesta === respuesta
      ? idempotenciaVisitaVecinoPendiente
      : {
          clave: crearClaveIdempotenciaVisitaVecino(),
          respuesta,
        };

    setIdempotenciaVisitaVecinoPendiente(intento);
    setGuardandoResultadoVecino(true);

    try {
      const ubicacion = await obtenerUbicacionVisitaVecino();
      const registro = await registrarVisitaVecino(
        integranteId,
        respuesta === 'si',
        fachadaVisita.id,
        intento.clave,
        ubicacion,
      );
      const resultadoConfirmado = registro.resumen.resultado;
      setVecinoConoceDomicilio(
        resultadoConfirmado
          ? (resultadoConfirmado.conoce_y_sabe_donde_vive ? 'si' : 'no')
          : null,
      );
      setVisitaVecinoActualId(registro.visita.id);
      setEvidenciaVisita(null);
      setEvidenciaVisitaPendiente(null);
      setErrorEvidenciaVisita(null);
      setErrorResumenVisitaVecino(false);
      setIdempotenciaVisitaVecinoPendiente(null);
    } catch (error) {
      Alert.alert(
        'No se guardó la respuesta',
        error instanceof Error
          ? error.message
          : 'Revisa tu conexión e intenta nuevamente.',
      );
    } finally {
      setGuardandoResultadoVecino(false);
    }
  };

  const guardarFachadaVisita = async (pendiente: FachadaVisitaPendiente) => {
    if (guardandoFachadaVisita) return;
    setGuardandoFachadaVisita(true);
    setFachadaVisitaPendiente(pendiente);

    try {
      const registro = await registrarFachadaVisita(integranteId, pendiente);
      if (!registro.fachada) {
        throw new Error('El servidor no confirmó la fotografía de fachada.');
      }
      setFachadaVisita({
        id: registro.fachada.id,
        uri: pendiente.uri,
        fotoCapturadaAt: registro.fachada.foto_capturada_at,
      });
      setFachadaVisitaPendiente(null);
      setErrorFachadaVisita(null);
      setVecinoConoceDomicilio(null);
      setVisitaVecinoActualId(null);
      setIdempotenciaVisitaVecinoPendiente(null);
      setEvidenciaVisita(null);
      setEvidenciaVisitaPendiente(null);
      setErrorEvidenciaVisita(null);
      await cargarIneVisita();
    } catch (error) {
      setErrorFachadaVisita(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la fotografía de fachada.',
      );
      Alert.alert(
        'No se guardó la fachada',
        error instanceof Error
          ? error.message
          : 'Revisa tu conexión e intenta nuevamente.',
      );
    } finally {
      setGuardandoFachadaVisita(false);
    }
  };

  const capturarFachadaVisita = async () => {
    if (guardandoFachadaVisita) return;

    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (permiso.status !== 'granted') {
        Alert.alert(
          'Permiso de cámara requerido',
          'Permite el acceso a la cámara para tomar la fotografía de la fachada.',
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });
      const uri = resultado.assets?.[0]?.uri;
      if (resultado.canceled || !uri) return;

      const fotoCapturadaAt = new Date().toISOString();
      let ubicacion;
      try {
        ubicacion = await obtenerUbicacionVisitaVecino();
      } catch (error) {
        Alert.alert(
          'La fotografía no se guardó',
          error instanceof Error
            ? `${error.message} Vuelve a tomar la fotografía cuando la ubicación esté disponible.`
            : 'No se pudo obtener la ubicación. Vuelve a tomar la fotografía.',
        );
        return;
      }

      await guardarFachadaVisita({
        uri,
        idempotencyKey: crearClaveIdempotenciaFachadaVisita(),
        fotoCapturadaAt,
        ubicacion,
      });
    } catch (error) {
      Alert.alert(
        'No se pudo abrir la cámara',
        error instanceof Error
          ? error.message
          : 'Verifica el permiso de cámara e inténtalo nuevamente.',
      );
    }
  };

  const guardarEvidenciaVisita = async (
    pendiente: EvidenciaVisitaPendiente,
  ) => {
    if (guardandoEvidenciaVisita || !visitaVecinoActualId) return;
    setGuardandoEvidenciaVisita(true);
    setEvidenciaVisitaPendiente(pendiente);

    try {
      const registro = await registrarEvidenciaVisita(
        integranteId,
        visitaVecinoActualId,
        pendiente,
      );
      if (!registro.evidencia) {
        throw new Error('El servidor no confirmó la fotografía de evidencia.');
      }
      setEvidenciaVisita({
        id: registro.evidencia.id,
        uri: pendiente.uri,
        fotoCapturadaAt: registro.evidencia.foto_capturada_at,
      });
      setEvidenciaVisitaPendiente(null);
      setErrorEvidenciaVisita(null);
    } catch (error) {
      setErrorEvidenciaVisita(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la fotografía de evidencia.',
      );
      Alert.alert(
        'No se guardó la evidencia',
        error instanceof Error
          ? error.message
          : 'Revisa tu conexión e intenta nuevamente.',
      );
    } finally {
      setGuardandoEvidenciaVisita(false);
    }
  };

  const capturarEvidenciaVisita = async () => {
    if (guardandoEvidenciaVisita) return;
    if (!visitaVecinoActualId) {
      Alert.alert(
        'Primero responde la pregunta',
        'Selecciona Sí o No y espera la confirmación antes de tomar la evidencia.',
      );
      return;
    }

    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (permiso.status !== 'granted') {
        Alert.alert(
          'Permiso de cámara requerido',
          'Permite el acceso a la cámara para tomar la fotografía de evidencia.',
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });
      const uri = resultado.assets?.[0]?.uri;
      if (resultado.canceled || !uri) return;

      const fotoCapturadaAt = new Date().toISOString();
      let ubicacion;
      try {
        ubicacion = await obtenerUbicacionVisitaVecino();
      } catch (error) {
        Alert.alert(
          'La fotografía no se guardó',
          error instanceof Error
            ? `${error.message} Vuelve a tomar la evidencia cuando la ubicación esté disponible.`
            : 'No se pudo obtener la ubicación. Vuelve a tomar la evidencia.',
        );
        return;
      }

      await guardarEvidenciaVisita({
        uri,
        idempotencyKey: crearClaveIdempotenciaEvidenciaVisita(),
        fotoCapturadaAt,
        ubicacion,
      });
    } catch (error) {
      Alert.alert(
        'No se pudo abrir la cámara',
        error instanceof Error
          ? error.message
          : 'Verifica el permiso de cámara e inténtalo nuevamente.',
      );
    }
  };

  const seleccionarEvidenciaLlamada = async (): Promise<boolean> => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permiso.status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Activa el acceso a tus imágenes para seleccionar la evidencia de la llamada.',
      );
      return false;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
      base64: false,
      selectionLimit: 1,
    });
    const asset = resultado.canceled ? undefined : resultado.assets[0];
    if (!asset) return false;

    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      Alert.alert('Imagen demasiado grande', 'Selecciona una imagen de máximo 10 MB.');
      return false;
    }
    if (asset.mimeType && !['image/jpeg', 'image/png'].includes(asset.mimeType)) {
      Alert.alert('Formato no compatible', 'Selecciona una imagen JPEG o PNG.');
      return false;
    }

    const mimeType = asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    setEvidenciaLlamada({
      uri: asset.uri,
      nombre: asset.fileName || `evidencia-llamada.${mimeType === 'image/png' ? 'png' : 'jpg'}`,
      mimeType,
    });
    return true;
  };

  const cerrarEvidenciaConfirmacionTelefono = () => {
    if (guardandoConfirmacionTelefono) return;
    setConfirmacionTelefonoEvidenciaVisible(false);
    setConfirmacionTelefonoPendiente(null);
    setLlamadaContestadaId(null);
    setEvidenciaLlamada(null);
  };

  const guardarConfirmacionTelefono = async () => {
    if (
      guardandoConfirmacionTelefono
      || !confirmacionTelefonoPendiente
      || !llamadaContestadaId
      || !evidenciaLlamada
    ) return;

    const confirmacionPendiente = confirmacionTelefonoPendiente;
    setGuardandoConfirmacionTelefono(true);
    try {
      await registrarConfirmacionTelefono(
        integranteId,
        llamadaContestadaId,
        confirmacionPendiente.tipo,
        confirmacionPendiente.telefono,
        evidenciaLlamada,
      );

      // La palomita se deriva de una nueva lectura del servidor, no de haber
      // seleccionado el resultado ni de conservar una evidencia sólo en memoria.
      const resumenConfirmado = await obtenerResumenLlamadas(integranteId);
      const telefonoConfirmadoServidor = resumenConfirmado.telefonos_confirmados
        ?.[confirmacionPendiente.tipo]?.telefono ?? null;

      if (telefonoConfirmadoServidor !== confirmacionPendiente.telefono) {
        throw new Error(
          'La evidencia no quedó confirmada por el servidor. Intenta guardarla nuevamente.',
        );
      }

      setResumenLlamadas(resumenConfirmado);
      setLlamadaCompletada(resumenConfirmado.proceso.completado);
      setTelefonoPrincipalConfirmadoValor(
        resumenConfirmado.telefonos_confirmados?.PRINCIPAL?.telefono ?? null,
      );
      setTelefonoSecundarioConfirmadoValor(
        resumenConfirmado.telefonos_confirmados?.SECUNDARIO?.telefono ?? null,
      );
      setConfirmacionTelefonoEvidenciaVisible(false);
      setConfirmacionTelefonoPendiente(null);
      setLlamadaContestadaId(null);
      setEvidenciaLlamada(null);
    } catch (error) {
      Alert.alert(
        'No se guardó la confirmación',
        error instanceof Error
          ? error.message
          : 'Revisa tu conexión e intenta guardar nuevamente la evidencia.',
      );
    } finally {
      setGuardandoConfirmacionTelefono(false);
    }
  };

  const abrirEvidenciaTelefono = async (tipo: TipoTelefonoEntrevista) => {
    const confirmacion = resumenLlamadas?.telefonos_confirmados?.[tipo];
    if (!confirmacion) return;

    setEvidenciaLlamada(null);
    setTelefonoEvidenciaEnVista({
      tipo,
      telefono: confirmacion.telefono,
      llamadaId: confirmacion.llamada_id,
      evidenciaUrl: `${confirmacion.evidencia_url}?v=${Date.now()}`,
    });
    setEvidenciaTelefonoHeaders(await getVerificacionDocumentHeaders());
    setEvidenciaTelefonoVisible(true);
  };

  const cerrarEvidenciaTelefono = () => {
    if (guardandoReemplazoEvidenciaTelefono) return;
    setEvidenciaTelefonoVisible(false);
    setTelefonoEvidenciaEnVista(null);
    setEvidenciaTelefonoHeaders(undefined);
    setEvidenciaLlamada(null);
  };

  const iniciarReemplazoEvidenciaTelefono = async () => {
    if (!telefonoEvidenciaEnVista || guardandoReemplazoEvidenciaTelefono) return;

    setEvidenciaTelefonoVisible(false);
    const seleccionada = await seleccionarEvidenciaLlamada();
    if (!seleccionada) {
      setEvidenciaTelefonoVisible(true);
      return;
    }
    setReemplazoEvidenciaTelefonoVisible(true);
  };

  const cerrarReemplazoEvidenciaTelefono = () => {
    if (guardandoReemplazoEvidenciaTelefono) return;
    setReemplazoEvidenciaTelefonoVisible(false);
    setTelefonoEvidenciaEnVista(null);
    setEvidenciaTelefonoHeaders(undefined);
    setEvidenciaLlamada(null);
  };

  const guardarReemplazoEvidenciaTelefono = async () => {
    if (
      guardandoReemplazoEvidenciaTelefono
      || !telefonoEvidenciaEnVista
      || !evidenciaLlamada
    ) return;

    setGuardandoReemplazoEvidenciaTelefono(true);
    try {
      const registro = await reemplazarEvidenciaTelefono(
        integranteId,
        telefonoEvidenciaEnVista.llamadaId,
        telefonoEvidenciaEnVista.tipo,
        telefonoEvidenciaEnVista.telefono,
        evidenciaLlamada,
      );
      setResumenLlamadas(registro.resumen);
      setReemplazoEvidenciaTelefonoVisible(false);
      setTelefonoEvidenciaEnVista(null);
      setEvidenciaTelefonoHeaders(undefined);
      setEvidenciaLlamada(null);
    } catch (error) {
      Alert.alert(
        'No se cambió la evidencia',
        error instanceof Error
          ? error.message
          : 'Revisa tu conexión e intenta guardar la imagen nuevamente.',
      );
    } finally {
      setGuardandoReemplazoEvidenciaTelefono(false);
    }
  };

  const guardarEvidenciasNegocio = async (
    pendientes: EvidenciaNegocioPendiente[],
    mensajeAdicional?: string,
  ) => {
    if (guardandoEvidenciasNegocio || pendientes.length === 0) return;

    setGuardandoEvidenciasNegocio(true);
    setEvidenciasNegocioPendientes(pendientes);
    const fallidas: EvidenciaNegocioPendiente[] = [];

    for (const pendiente of pendientes) {
      try {
        const registro = await registrarEvidenciaNegocio(integranteId, pendiente);
        setEvidenciasNegocio((actuales) => [
          ...actuales.filter((evidencia) => evidencia.id !== registro.evidencia.id),
          {
            id: registro.evidencia.id,
            uri: pendiente.uri,
            registradaAt: registro.evidencia.registrada_at,
          },
        ]);
      } catch {
        fallidas.push(pendiente);
      }
    }

    setEvidenciasNegocioPendientes(fallidas);
    if (fallidas.length > 0) {
      setErrorEvidenciasNegocio(
        `${fallidas.length} ${fallidas.length === 1 ? 'fotografía no se pudo guardar' : 'fotografías no se pudieron guardar'}. Revisa tu conexión y vuelve a intentarlo.`,
      );
    } else {
      setErrorEvidenciasNegocio(mensajeAdicional ?? null);
    }
    setGuardandoEvidenciasNegocio(false);
  };

  const capturarEvidenciaNegocio = async () => {
    if (guardandoEvidenciasNegocio) return;

    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (permiso.status !== 'granted') {
        setErrorEvidenciasNegocio(
          'Permite el acceso a la cámara para tomar fotografías del negocio.',
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: false,
        exif: false,
      });
      const asset = resultado.canceled ? undefined : resultado.assets[0];
      if (!asset) return;

      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        setErrorEvidenciasNegocio(
          'La fotografía supera 10 MB. Vuelve a tomarla con una resolución menor.',
        );
        return;
      }
      if (asset.mimeType && !['image/jpeg', 'image/png'].includes(asset.mimeType)) {
        setErrorEvidenciasNegocio(
          'La cámara generó un formato no compatible. Vuelve a tomar la fotografía.',
        );
        return;
      }

      const mimeType: 'image/jpeg' | 'image/png' = asset.mimeType === 'image/png'
        ? 'image/png'
        : 'image/jpeg';
      const fotoCapturadaAt = new Date().toISOString();
      const ubicacion = await obtenerUbicacionEntrevista();
      const nueva: EvidenciaNegocioPendiente = {
        tipo: 'NEGOCIO',
        uri: asset.uri,
        nombre: asset.fileName
          || `evidencia-negocio-${Date.now()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`,
        mimeType,
        idempotencyKey: crearClaveIdempotenciaEvidenciaNegocio(),
        fotoCapturadaAt,
        ubicacion,
      };

      await guardarEvidenciasNegocio([...evidenciasNegocioPendientes, nueva]);
    } catch (error) {
      setErrorEvidenciasNegocio(
        error instanceof Error
          ? error.message
          : 'No se pudo abrir la cámara. Verifica el permiso e inténtalo nuevamente.',
      );
    }
  };

  const guardarEvidenciasHistorialCredito = async (
    tipo: TipoEvidenciaHistorialCredito,
    pendientes: EvidenciaEntrevistaPendiente[],
  ) => {
    if (guardandoEvidenciasHistorialCredito || pendientes.length === 0) return;

    setGuardandoEvidenciasHistorialCredito(tipo);
    setEvidenciasHistorialCreditoPendientes((actuales) => ({
      ...actuales,
      [tipo]: pendientes,
    }));
    const fallidas: EvidenciaEntrevistaPendiente[] = [];

    for (const pendiente of pendientes) {
      try {
        const registro = await registrarEvidenciaEntrevista(integranteId, pendiente);
        setEvidenciasHistorialCredito((actuales) => ({
          ...actuales,
          [tipo]: [
            ...actuales[tipo].filter((evidencia) => evidencia.id !== registro.evidencia.id),
            {
              id: registro.evidencia.id,
              uri: pendiente.uri,
              registradaAt: registro.evidencia.registrada_at,
            },
          ],
        }));
      } catch {
        fallidas.push(pendiente);
      }
    }

    setEvidenciasHistorialCreditoPendientes((actuales) => ({
      ...actuales,
      [tipo]: fallidas,
    }));
    setErroresEvidenciasHistorialCredito((actuales) => ({
      ...actuales,
      [tipo]: fallidas.length > 0
        ? `${fallidas.length} ${fallidas.length === 1 ? 'fotografía no se pudo guardar' : 'fotografías no se pudieron guardar'}. Revisa tu conexión y vuelve a intentarlo.`
        : null,
    }));
    setGuardandoEvidenciasHistorialCredito(null);
  };

  const capturarEvidenciaHistorialCredito = async (
    tipo: TipoEvidenciaHistorialCredito,
  ) => {
    if (guardandoEvidenciasHistorialCredito) return;

    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (permiso.status !== 'granted') {
        setErroresEvidenciasHistorialCredito((actuales) => ({
          ...actuales,
          [tipo]: 'Permite el acceso a la cámara para tomar la evidencia fotográfica.',
        }));
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: false,
        exif: false,
      });
      const asset = resultado.canceled ? undefined : resultado.assets[0];
      if (!asset) return;

      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        setErroresEvidenciasHistorialCredito((actuales) => ({
          ...actuales,
          [tipo]: 'La fotografía supera 10 MB. Vuelve a tomarla con una resolución menor.',
        }));
        return;
      }
      if (asset.mimeType && !['image/jpeg', 'image/png'].includes(asset.mimeType)) {
        setErroresEvidenciasHistorialCredito((actuales) => ({
          ...actuales,
          [tipo]: 'La cámara generó un formato no compatible. Vuelve a tomar la fotografía.',
        }));
        return;
      }

      const mimeType: 'image/jpeg' | 'image/png' = asset.mimeType === 'image/png'
        ? 'image/png'
        : 'image/jpeg';
      const ubicacion = await obtenerUbicacionEntrevista();
      const nueva: EvidenciaEntrevistaPendiente = {
        tipo,
        uri: asset.uri,
        nombre: asset.fileName
          || `evidencia-historial-credito-${Date.now()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`,
        mimeType,
        idempotencyKey: crearClaveIdempotenciaEvidenciaEntrevista(tipo),
        fotoCapturadaAt: new Date().toISOString(),
        ubicacion,
      };

      await guardarEvidenciasHistorialCredito(
        tipo,
        [...evidenciasHistorialCreditoPendientes[tipo], nueva],
      );
    } catch (error) {
      setErroresEvidenciasHistorialCredito((actuales) => ({
        ...actuales,
        [tipo]: error instanceof Error
          ? error.message
          : 'No se pudo abrir la cámara. Verifica el permiso e inténtalo nuevamente.',
      }));
    }
  };

  const handleConfirmarAccionPosteriorLlamada = async () => {
    if (
      !accionPosteriorLlamada
      || !llamadaContestadaId
      || !evidenciaLlamada
      || guardandoEncuestaLlamada
    ) return;

    setGuardandoEncuestaLlamada(true);
    try {
      const registro = await registrarEncuestaLlamada(
        integranteId,
        llamadaContestadaId,
        respuestasContactoInicial,
        accionPosteriorLlamada,
        evidenciaLlamada,
      );

      setResumenLlamadas(registro.resumen);
      setLlamadaCompletada(registro.resumen.proceso.completado);
      setTelefonoPrincipalConfirmadoValor(
        registro.resumen.telefonos_confirmados?.PRINCIPAL?.telefono ?? null,
      );
      setTelefonoSecundarioConfirmadoValor(
        registro.resumen.telefonos_confirmados?.SECUNDARIO?.telefono ?? null,
      );
      setVistaLlamada('acciones');
      setLlamadaContestadaId(null);
      setEvidenciaLlamada(null);

      if (
        registro.encuesta.completada
        && (
          accionPosteriorLlamada === 'entrevista-corta'
          || accionPosteriorLlamada === 'entrevista-larga'
        )
      ) {
        entrevistaAbiertaRef.current = true;
        setPasoActual('validacion-integrante');
      } else {
        setPasoActual('menu');
      }
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    } catch (error) {
      Alert.alert(
        'No se guardó la llamada',
        error instanceof Error
          ? error.message
          : 'Revisa tu conexión e intenta guardar nuevamente.',
      );
    } finally {
      setGuardandoEncuestaLlamada(false);
    }
  };

  const isDocumentosValidadosCompleto = (): boolean => {
    if (pasoActual !== 'documentos') return true;

    const documentosObligatorios = documentos.filter((doc) => doc.obligatorioRevision);
    return documentosObligatorios.length === TIPOS_DOCUMENTO_REVISION.length
      && documentosObligatorios.every((doc) => (
        doc.estado === 'Capturado' && doc.validacion === 'si'
      ));
  };

  const estanTodosLosDocumentosRevisados = (): boolean => {
    const documentosObligatorios = documentos.filter((doc) => doc.obligatorioRevision);
    return documentosObligatorios.length === TIPOS_DOCUMENTO_REVISION.length
      && documentosObligatorios.every((doc) => (
        doc.estado === 'Capturado'
        && (doc.validacion === 'si' || doc.validacion === 'no')
      ));
  };

  const hayDocumentoRechazado = (): boolean => (
    documentos.some((doc) => doc.obligatorioRevision && doc.validacion === 'no')
  );

  const puedeSolicitarRevisionDocumental = (): boolean => (
    pasoActual === 'documentos'
    && estanTodosLosDocumentosRevisados()
    && hayDocumentoRechazado()
  );

  const handleMarkNeedsDocumentation = async () => {
    if (!usuario?.id) {
      Alert.alert('Sesión no disponible', 'Vuelve a iniciar sesión para guardar la incidencia.');
      return;
    }

    if (!estanTodosLosDocumentosRevisados()) {
      Alert.alert(
        'Revisión incompleta',
        'Revisa los tres documentos obligatorios y responde Sí o No en cada uno antes de regresarlos a Documentación.',
      );
      return;
    }

    const documentosRechazados = documentos
      .filter((doc) => doc.obligatorioRevision && doc.validacion === 'no');
    const tiposResueltos = documentosRechazados
      .map((doc) => (
        esTipoDocumentoRevision(doc.tipo)
          ? doc.tipo
          : TIPO_DOCUMENTO_POR_CLAVE[doc.clave]
      ));

    if (tiposResueltos.some((tipo) => !TIPOS_DOCUMENTO_REVISION.includes(tipo))) {
      Alert.alert(
        'No se identificó el documento',
        'Regresa a la lista, abre nuevamente a la integrante e inténtalo otra vez.',
      );
      return;
    }

    const documentosObservados = Array.from(new Set(tiposResueltos));
    if (documentosObservados.length === 0) {
      Alert.alert('Selecciona un documento', 'Marca cuál documento necesita reemplazarse.');
      return;
    }

    setMarkingNeedsDocumentation(true);
    try {
      await api.patch(`/integrantes/${integranteId}/estado`, {
        estado: 'DOCUMENTANDO',
        documentos_observados: documentosObservados,
      }, VERIFICACION_REQUEST_OPTIONS);
      try {
        await saveNeedsDocumentationProgress(usuario.id, integranteId);
      } catch (error) {
        console.warn('La revisión documental se guardó en servidor, pero no su progreso local.', error);
      }
      setMarkingNeedsDocumentation(false);
      onBack?.();
    } catch (error) {
      setMarkingNeedsDocumentation(false);
      Alert.alert(
        'No se pudo solicitar la revisión',
        error instanceof Error ? error.message : 'Intenta nuevamente.',
      );
    }
  };

  const getNombreCompleto = (): string => {
    if (!solicitudData) return '';
    const partes = [
      solicitudData.nombres,
      solicitudData.apellido_pat,
      solicitudData.apellido_mat,
    ].filter(Boolean);
    return partes.join(' ');
  };

  const getDomicilioCompleto = (): string => {
    if (!solicitudData) return '';
    const calleNumero = [
      solicitudData.dom_calle,
      solicitudData.dom_num_ext ? `Núm. ext. ${solicitudData.dom_num_ext}` : undefined,
    ].filter(Boolean).join(' ');
    const partes = [
      calleNumero,
      solicitudData.dom_num_int ? `Núm. int. ${solicitudData.dom_num_int}` : undefined,
      solicitudData.dom_colonia,
      solicitudData.dom_municipio,
      solicitudData.dom_codigo_postal ? `C.P. ${solicitudData.dom_codigo_postal}` : undefined,
    ].filter(Boolean);
    return partes.join(', ');
  };

  const getModalHeaderTitle = (): string => {
    if (!documentoViewing) return '';

    switch (documentoViewing.clave) {
      case 'ine_integrante':
        return getNombreCompleto() || documentoViewing.nombre;
      case 'comprobante_domicilio':
        return getDomicilioCompleto() || documentoViewing.nombre;
      default:
        return documentoViewing.nombre;
    }
  };

  const getPreguntaValidacion = (): string => {
    if (!documentoViewing) return '';

    switch (documentoViewing.clave) {
      case 'ine_integrante':
        return '¿NOMBRE COINCIDE?';
      case 'comprobante_domicilio':
        return '¿DOMICILIO COINCIDE?';
      case 'solicitud_firmada':
        return '¿COINCIDE FIRMA SOLICITUD?';
      default:
        return '';
    }
  };

  const handleValidacion = (respuesta: 'si' | 'no') => {
    if (!documentoViewing) return;

    // Actualizar el documento con la validación
    setDocumentos(prev => prev.map(doc =>
      doc.clave === documentoViewing.clave
        ? { ...doc, validacion: respuesta }
        : doc
    ));

    // Cerrar el modal
    cerrarDocumentoModal();
  };

  const resolverImagenesDocumento = async (documento: DocumentoItem): Promise<DocumentoItem> => {
    if (documento.uriFrente) return documento;
    if (!documento.ruta) {
      throw new Error(`El documento ${documento.nombre} no tiene una ruta disponible para consulta.`);
    }

    const [remoto, headers] = await Promise.all([
      api.get<DocumentoRemoto>(documento.ruta, VERIFICACION_READ_REQUEST_OPTIONS),
      getVerificacionDocumentHeaders(),
    ]);
    const imagenes = remoto.archivos.filter((archivo) => archivo.mime_type.startsWith('image/'));
    if (imagenes.length === 0) {
      throw new Error(`El documento ${documento.nombre} no contiene imágenes que puedan mostrarse en la aplicación.`);
    }

    return {
      ...documento,
      uriFrente: imagenes[0] ? apiUrl(imagenes[0].url) : undefined,
      uriReverso: imagenes[1] ? apiUrl(imagenes[1].url) : undefined,
      headers,
    };
  };

  const cachearImagenesDocumento = (documento: DocumentoItem) => {
    setDocumentos((prev) => prev.map((item) => (
      item.clave === documento.clave
        ? {
          ...item,
          uriFrente: documento.uriFrente,
          uriReverso: documento.uriReverso,
          headers: documento.headers,
        }
        : item
    )));
  };

  const abrirDocumento = async (documento: DocumentoItem) => {
    try {
      const documentoResuelto = await resolverImagenesDocumento(documento);
      cachearImagenesDocumento(documentoResuelto);
      mostrarDocumentoModal(documentoResuelto);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir el documento',
        error instanceof Error ? error.message : 'Revisa tu conexión e intenta nuevamente.',
      );
    }
  };

  const cargarIneVisita = async () => {
    setLoadingIneVisita(true);
    setErrorIneVisita(null);

    try {
      const ine = documentos.find((documento) => documento.clave === 'ine_integrante');
      if (!ine || ine.estado !== 'Capturado') {
        throw new Error('El INE de la integrante no está disponible.');
      }

      const ineResuelta = await resolverImagenesDocumento(ine);
      const pages: DocumentImageCarouselPage[] = [];
      if (ineResuelta.uriFrente) {
        pages.push({
          uri: ineResuelta.uriFrente,
          label: 'Frente',
          headers: ineResuelta.headers,
        });
      }
      if (ineResuelta.uriReverso) {
        pages.push({
          uri: ineResuelta.uriReverso,
          label: 'Reverso',
          headers: ineResuelta.headers,
        });
      }
      if (pages.length === 0) {
        throw new Error('El INE no contiene imágenes que puedan mostrarse.');
      }

      cachearImagenesDocumento(ineResuelta);
      setIneVisitaPages(pages);
    } catch (error) {
      setIneVisitaPages([]);
      setErrorIneVisita(
        error instanceof Error
          ? error.message
          : 'No se pudo consultar el INE. Revisa tu conexión e intenta nuevamente.',
      );
    } finally {
      setLoadingIneVisita(false);
    }
  };

  const getTituloPaso = (): string => {
    switch (pasoActual) {
      case 'documentos':
        return 'REVISIÓN DOCUMENTAL';
      case 'menu':
        return 'VERIFICACIÓN';
      case 'llamada-integrante':
        return 'LLAMADA';
      case 'visita-vecino':
        return 'VISITA AL VECINO';
      case 'foto-domicilio':
        return 'IMÁGENES DEL DOMICILIO';
      case 'validacion-integrante':
        return 'ENTREVISTA';
      case 'observaciones':
        return 'CONCLUSIONES';
      default:
        return 'VERIFICACIÓN';
    }
  };

  // Función helper para extraer valores numéricos
  const extractNum = (val: string) => Number(val.replace(/\D/g, '') || 0);

  // Calcular totales en tiempo real
  const getTotalIngresos = () => {
    return (
      extractNum(ingresoEmpleo) +
      extractNum(ingresoExterno) +
      extractNum(ingresoNegocio)
    );
  };

  const getTotalGastos = () => {
    return (
      extractNum(gastoLuz) +
      extractNum(gastoGas) +
      extractNum(gastoAgua) +
      extractNum(gastoTelefono) +
      extractNum(gastoCable) +
      extractNum(gastoCelular) +
      extractNum(gastoDespensa) +
      extractNum(gastoCasa) +
      extractNum(gastoEscuela) +
      extractNum(gastoCarro) +
      extractNum(gastoOtros)
    );
  };

  const getDisponible = () => {
    return getTotalIngresos() - getTotalGastos();
  };

  const visitaVecinoListaParaTerminar = Boolean(
    fachadaVisita
      && visitaVecinoActualId
      && vecinoConoceDomicilio
      && evidenciaVisita
      && !evidenciaVisitaPendiente
      && !guardandoResultadoVecino
      && !loadingEvidenciaVisita
      && !guardandoEvidenciaVisita,
  );

  const imagenesDomicilioListasParaTerminar = Boolean(
    imagenesDomicilioPuedeTerminar
      && !loadingImagenesDomicilio
      && !guardandoImagenDomicilio
      && !guardandoRespuestaMedidorLuz,
  );

  const whatsappTelefonoConfirmadoHabilitado = Boolean(
    resumenLlamadas
      && (resumenLlamadas.telefonica.no_contestadas + resumenLlamadas.telefonica.contestadas > 0),
  );

  const telefonoPrincipalEstaConfirmado = (
    telefonoConfirmado.replace(/\D/g, '').length === 10
    && telefonoConfirmado.replace(/\D/g, '') === telefonoPrincipalConfirmadoValor
  );
  const telefonoSecundarioEstaConfirmado = (
    telefonoSecundario.replace(/\D/g, '').length === 10
    && telefonoSecundario.replace(/\D/g, '') === telefonoSecundarioConfirmadoValor
  );

  const paginasEvidenciasNegocio: DocumentImageCarouselPage[] = [
    ...evidenciasNegocio.map((evidencia, index) => ({
      uri: evidencia.uri,
      headers: evidencia.headers,
      label: `Foto ${index + 1}`,
    })),
    ...evidenciasNegocioPendientes.map((evidencia, index) => ({
      uri: evidencia.uri,
      label: `Pendiente ${index + 1}`,
    })),
  ];

  const tipoEvidenciaHistorialCreditoActual: TipoEvidenciaHistorialCredito | null =
    creditoGrupalAnteriorActivo === 'Sí'
      ? 'HISTORIAL_CREDITO_ACTIVO'
      : creditoGrupalAnteriorActivo === 'No'
        ? 'HISTORIAL_CREDITO_INACTIVO'
        : null;
  const evidenciasHistorialCreditoActual = tipoEvidenciaHistorialCreditoActual
    ? evidenciasHistorialCredito[tipoEvidenciaHistorialCreditoActual]
    : [];
  const evidenciasHistorialCreditoPendientesActuales = tipoEvidenciaHistorialCreditoActual
    ? evidenciasHistorialCreditoPendientes[tipoEvidenciaHistorialCreditoActual]
    : [];
  const errorEvidenciasHistorialCreditoActual = tipoEvidenciaHistorialCreditoActual
    ? erroresEvidenciasHistorialCredito[tipoEvidenciaHistorialCreditoActual]
    : null;
  const paginasEvidenciasHistorialCredito: DocumentImageCarouselPage[] = [
    ...paginasComprobanteLineaCredito,
    ...evidenciasHistorialCreditoActual.map((evidencia, index) => ({
      uri: evidencia.uri,
      headers: evidencia.headers,
      label: `Evidencia ${index + 1}`,
    })),
    ...evidenciasHistorialCreditoPendientesActuales.map((evidencia, index) => ({
      uri: evidencia.uri,
      label: `Pendiente ${index + 1}`,
    })),
  ];
  const fotografiasOtraFinancieraGuardadas = paginasComprobanteLineaCredito.length
    + evidenciasHistorialCreditoActual.length;
  const comprobanteLineaCredito = documentos.find(
    (documento) => documento.tipo === 'comprobante_credito',
  );

  const handleTerminarVisitaVecino = () => {
    if (!visitaVecinoListaParaTerminar) return;
    setPasoActual('menu');
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleTerminarImagenesDomicilio = () => {
    if (!imagenesDomicilioListasParaTerminar) return;
    setPasoActual('menu');
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleBackPress = () => {
    if (pasoActual === 'llamada-integrante' && vistaLlamada === 'encuesta') {
      setVistaLlamada('acciones');
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }

    if (pasoActual === 'documentos' && consultandoDocumentos) {
      setConsultandoDocumentos(false);
      setPasoActual('menu');
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }

    if (pasoActual === 'documentos' || pasoActual === 'menu') {
      onBack?.();
      return;
    }

    setPasoActual('menu');
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleSelectProcess = (process: VerificationProcessKey) => {
    if (process === 'documentos') {
      setConsultandoDocumentos(true);
      setPasoActual('documentos');
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }

    setConsultandoDocumentos(false);
    if (process === 'llamada-integrante') {
      setVistaLlamada('acciones');
    }
    if (process === 'validacion-integrante') {
      entrevistaAbiertaRef.current = true;
    }
    setPasoActual(process);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    if (process === 'visita-vecino') {
      if (fachadaVisita) {
        void cargarIneVisita();
      }
    }
  };

  const montosGrupoCompletos = integrantesGrupo.length > 0 && integrantesGrupo.every(
    (integranteGrupo) => integranteGrupo.montoSolicitado != null
      && Number.isFinite(integranteGrupo.montoSolicitado)
      && integranteGrupo.montoSolicitado > 0,
  );
  const montoTotalSolicitadoGrupo = montosGrupoCompletos
    ? integrantesGrupo.reduce(
      (total, integranteGrupo) => total + (integranteGrupo.montoSolicitado ?? 0),
      0,
    )
    : null;

  const handleAcuerdoMontosChange = (respuesta: string) => {
    const companeras = integrantesGrupo.filter(
      (integranteGrupo) => integranteGrupo.id !== integranteId,
    );
    const tieneMontoInvalido = integrantesGrupo.some(
      (integranteGrupo) => integranteGrupo.montoSolicitado == null
        || !Number.isFinite(integranteGrupo.montoSolicitado)
        || integranteGrupo.montoSolicitado <= 0,
    );

    if (companeras.length === 0 || tieneMontoInvalido) {
      Alert.alert(
        'No se pudieron cargar los montos',
        'Actualiza la entrevista e inténtalo nuevamente. No es posible responder sin mostrar todos los montos solicitados.',
      );
      return;
    }

    setAcuerdoMontos(respuesta);
    setCompanerasMontoNoAcordadoIds([]);
    setMotivosDesacuerdoMontosPorIntegrante({});
  };

  const renderImagenesDomicilio = () => (
    <ImagenesDomicilioSection
      imagenes={imagenesDomicilio}
      pendientes={imagenesDomicilioPendientes}
      errores={erroresImagenesDomicilio}
      loading={loadingImagenesDomicilio}
      errorResumen={errorResumenImagenesDomicilio}
      guardandoImagen={guardandoImagenDomicilio}
      respuestaTieneMedidorLuz={respuestaTieneMedidorLuz}
      motivoSinMedidorLuz={motivoSinMedidorLuz}
      guardandoRespuestaMedidorLuz={guardandoRespuestaMedidorLuz}
      abrirMotivosSinMedidorLuz={abrirMotivosSinMedidorLuz}
      versionPopupMotivoMedidor={versionPopupMotivoMedidor}
      onRetryLoad={() => void cargarImagenesDomicilio()}
      onOpenImage={setImagenDomicilioEnVista}
      onSavePending={(pendiente) => void guardarImagenDomicilio(pendiente)}
      onTakeImage={(tipo) => void tomarImagenDomicilio(tipo)}
      onSelectTieneMedidor={handleSeleccionarTieneMedidor}
      onSelectMotivoSinMedidor={handleSeleccionarMotivoSinMedidor}
    />
  );

  if (loading) {
    return (
      <ScreenContainer moduleTheme="verification">
        <AppHeader showBackButton onBackPress={handleBackPress} moduleTheme="verification" />
        <ActivityIndicator style={styles.loader} size="large" />
      </ScreenContainer>
    );
  }

  const creditosParticipadosLabel = integrante?.creditosParticipados == null
    ? 'CICLOS N/D'
    : integrante.creditosParticipados === 1
      ? '1 CICLO'
      : `${integrante.creditosParticipados} CICLOS`;
  const edadLabel = integrante?.edad == null ? 'EDAD N/D' : `${integrante.edad} AÑOS`;
  const distanciaTesoreraLabel = integrante?.distanciaTesoreraAproxKm == null
    ? 'DIST. N/D'
    : `DIST. ${integrante.distanciaTesoreraAproxKm.toFixed(1)} KM`;
  const distanciaTesoreraWarning = integrante?.distanciaTesoreraAproxKm != null
    && integrante.distanciaTesoreraAproxKm > DISTANCIA_MAXIMA_TESORERA_KM;
  const cicloGrupoLabel = integrante?.cicloNumeroActual == null
    ? 'CICLO N/D'
    : `CICLO ${integrante.cicloNumeroActual}`;

  return (
    <ScreenContainer moduleTheme="verification">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
      {/* Contenedor de todo el header fijo */}
      <View
        ref={fixedHeaderContainerRef}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setFixedHeaderHeight(height);
        }}
      >
        <AppHeader showBackButton onBackPress={handleBackPress} moduleTheme="verification" />
        <ScreenTitleBar title="Verificación Individual" moduleTheme="verification" />

        <ContextHeader
          title={nombreGrupo}
          trailingText={cicloGrupoLabel}
          moduleTheme="verification"
          tone="brandAccent"
        />

        {/* Datos del integrante */}
        <View style={styles.fixedSolicitanteContainer}>
          {integrante?.esNuevaConNosotros ? (
            <StatusTab
              flushLeft
              status="newMember"
              accessibilityLabel="Integrante nueva con CRELEALTAD"
            />
          ) : null}
          <Card
            style={[
              styles.integranteCard,
              integrante?.esNuevaConNosotros && styles.integranteCardWithNewTab,
            ]}
          >
            <View style={styles.integranteHeader}>
              <Text allowFontScaling={false} style={styles.integranteName}>
                {integrante?.nombre}
              </Text>

              {integrantePosition && integrantesTotal && (
                <Text allowFontScaling={false} style={styles.positionText}>
                  {integrantePosition}/{integrantesTotal}
                </Text>
              )}
            </View>

            <View style={styles.integranteSummaryRow}>
              {integrante?.esTesorera ? (
                <View style={styles.tesoreraBadge}>
                  <StatusBadge label="TESORERA" leadingMark="T" tone="pending" />
                </View>
              ) : null}

              <View style={styles.integranteMetricsRow}>
                <View
                  accessibilityLabel={integrante?.creditosParticipados == null
                    ? 'Ciclos individuales registrados no disponibles'
                    : `${integrante.creditosParticipados} ${integrante.creditosParticipados === 1 ? 'ciclo individual registrado' : 'ciclos individuales registrados'}`}
                  style={styles.creditHistoryBadge}
                >
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.creditHistoryText}>
                    {creditosParticipadosLabel}
                  </Text>
                </View>

                <View
                  accessibilityLabel={integrante?.edad == null
                    ? 'Edad no disponible'
                    : `${integrante.edad} años${integrante.superaLimiteEdad ? ', supera el límite de 70 años' : ''}`}
                  style={[
                    styles.ageBadge,
                    integrante?.superaLimiteEdad && styles.ageBadgeWarning,
                  ]}
                >
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.metricText}>
                    {edadLabel}
                  </Text>
                </View>

                <View
                  accessibilityLabel={integrante?.distanciaTesoreraAproxKm == null
                    ? 'Distancia al domicilio de la tesorera no disponible'
                    : `Distancia aproximada al domicilio de la tesorera: ${integrante.distanciaTesoreraAproxKm.toFixed(1)} kilómetros${distanciaTesoreraWarning ? ', supera 5 kilómetros' : ''}`}
                  style={[
                    styles.distanceBadge,
                    distanciaTesoreraWarning && styles.distanceBadgeWarning,
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={[
                      styles.distanceText,
                      distanciaTesoreraWarning && styles.distanceTextWarning,
                    ]}
                  >
                    {distanciaTesoreraLabel}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.contactInfoRow}>
              <View style={styles.phoneRowContainer}>
                <TouchableOpacity
                  style={styles.phoneIconButton}
                  onPress={() => handleLlamarIntegrante(integrante?.telefono ?? '', integrante?.nombre ?? '')}
                >
                  <Text allowFontScaling={false} style={styles.phoneIcon}>📞</Text>
                </TouchableOpacity>
                <View style={styles.phoneDisplayContainer}>
                  <Text allowFontScaling={false} style={styles.phoneText}>
                    {formatPhone(integrante?.telefono ?? '')}
                  </Text>
                </View>
              </View>
            </View>

            <CreditAmountsSummary
              previousAmount={integrante?.montoAutorizadoAnterior}
              requestedAmount={integrante?.montoSolicitado}
            />
          </Card>
        </View>

        {/* Contexto de la vista actual. Los procesos ya no forman un wizard lineal. */}
        <View style={styles.wizardProgressContainer}>
          <View style={styles.wizardHeaderOneLine}>
            <Text allowFontScaling={false} style={styles.wizardStepTitleCompact}>
              {getTituloPaso()}
            </Text>
            {pasoActual === 'documentos' ? (
              <Text allowFontScaling={false} style={styles.wizardStepTextCompact}>
                Control previo
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {/* FIN del contenedor de header fijo */}

      {/* Header sticky flotante de GASTOS SEMANALES */}
      {showStickyGastos && pasoActual === 'evaluacion-economica' && fixedHeaderHeight > 0 && (
        <View style={[styles.floatingStickyHeader, { top: fixedHeaderHeight }]}>
          <Text allowFontScaling={false} style={styles.stickyHeaderText}>GASTOS SEMANALES</Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        onScrollBeginDrag={() => Keyboard.dismiss()}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          // Mostrar sticky header cuando:
          // 1. El scroll ha pasado el header de gastos original
          // 2. Pero aún no ha pasado el final de la sección de gastos
          if (gastosHeaderY > 0 && gastosEndY > 0 && fixedHeaderHeight > 0) {
            const headerPassed = scrollY >= gastosHeaderY;
            const stillInGastosSection = scrollY < (gastosEndY - fixedHeaderHeight - 50);
            setShowStickyGastos(headerPassed && stillInGastosSection);
          }
        }}
      >
        {pasoActual === 'menu' && (
          <VerificationProcessMenu
            llamadaCompletada={llamadaCompletada}
            imagenesDomicilioCompletadas={imagenesDomicilioListasParaTerminar}
            visitaVecinoResultado={vecinoConoceDomicilio}
            onSelect={handleSelectProcess}
          />
        )}

        {/* PASO 1: Documentos */}
        {pasoActual === 'documentos' && (
          <DocumentosRevisionSection
            documentos={documentos}
            consultando={consultandoDocumentos}
            todosObligatoriosRevisados={estanTodosLosDocumentosRevisados()}
            onSelect={(documento) => {
              if (documento.estado === 'Capturado' && documento.ruta) {
                void abrirDocumento(documento);
                return;
              }
              Alert.alert(
                'Documento no disponible',
                `El documento "${documento.nombre}" no ha sido capturado por el asesor.`,
              );
            }}
          />
        )}

        {/* PASO 2: Llamada a la integrante */}
        {pasoActual === 'llamada-integrante' && vistaLlamada === 'acciones' && (
          <ContactoInicialStep
            resumenLlamadas={resumenLlamadas}
            errorResumenLlamadas={errorResumenLlamadas}
            onRealizarLlamada={handleRealizarLlamada}
            onRealizarLlamadaWhatsApp={handleRealizarLlamadaWhatsApp}
          />
        )}

        {pasoActual === 'llamada-integrante' && vistaLlamada === 'encuesta' && (
          <EncuestaLlamadaStep
            nombreGrupo={nombreGrupo}
            nombreRegistrado={getNombreCompleto() || integrante?.nombre || 'Nombre no disponible'}
            domicilioRegistrado={getDomicilioCompleto() || 'Domicilio no disponible'}
            respuestas={respuestasContactoInicial}
            accionPosterior={accionPosteriorLlamada}
            evidenciaUri={evidenciaLlamada?.uri ?? null}
            guardando={guardandoEncuestaLlamada}
            onRespuestasChange={setRespuestasContactoInicial}
            onAccionPosteriorChange={setAccionPosteriorLlamada}
            onSeleccionarEvidencia={() => void seleccionarEvidenciaLlamada()}
            onContinuar={handleConfirmarAccionPosteriorLlamada}
          />
        )}

        {pasoActual === 'visita-vecino' && (
          <VisitaVecinoSection
            nombreIntegrante={getNombreCompleto() || integrante?.nombre || 'LA INTEGRANTE'}
            fachada={fachadaVisita}
            fachadaPendiente={fachadaVisitaPendiente}
            loadingFachada={loadingFachadaVisita}
            guardandoFachada={guardandoFachadaVisita}
            errorFachada={errorFachadaVisita}
            inePages={ineVisitaPages}
            loadingIne={loadingIneVisita}
            errorIne={errorIneVisita}
            vecinoConoceDomicilio={vecinoConoceDomicilio}
            visitaActualId={visitaVecinoActualId}
            errorResumenVisita={errorResumenVisitaVecino}
            guardandoResultado={guardandoResultadoVecino}
            evidencia={evidenciaVisita}
            evidenciaPendiente={evidenciaVisitaPendiente}
            loadingEvidencia={loadingEvidenciaVisita}
            guardandoEvidencia={guardandoEvidenciaVisita}
            errorEvidencia={errorEvidenciaVisita}
            onCaptureFachada={() => void capturarFachadaVisita()}
            onSaveFachada={(pendiente) => void guardarFachadaVisita(pendiente)}
            onRetryIne={() => void cargarIneVisita()}
            onRespuestaChange={(value) => void handleRespuestaVisitaVecino(value)}
            onCaptureEvidencia={() => void capturarEvidenciaVisita()}
            onSaveEvidencia={(pendiente) => void guardarEvidenciaVisita(pendiente)}
          />
        )}

        {/* Imágenes del domicilio */}
        {pasoActual === 'foto-domicilio' && (
          renderImagenesDomicilio()
        )}

        {/* PASO 3: Localización */}
        {pasoActual === 'localizacion' && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Localización de la Clienta" />

            <SelectorField
              label="¿Se encontró a la clienta en su domicilio?"
              value={encontradaEnDomicilio}
              options={['Sí', 'No']}
              onSelect={(value) => setEncontradaEnDomicilio(value.toLowerCase())}
              moduleTheme="verification"
            />

            {encontradaEnDomicilio === 'no' && (
              <>
                <SelectorField
                  label="¿Alguien en el domicilio?"
                  value={alguienEnDomicilio}
                  options={['Sí', 'No']}
                  onSelect={(value) => setAlguienEnDomicilio(value.toLowerCase())}
                  moduleTheme="verification"
                />

                {alguienEnDomicilio === 'si' && (
                  <>
                    <TextInput
                      label="Nombre completo de quien recibió"
                      value={nombreQuienRecibio}
                      onChangeText={setNombreQuienRecibio}
                    />
                    <TextInput
                      label="Parentesco"
                      value={parentescoQuienRecibio}
                      onChangeText={setParentescoQuienRecibio}
                    />
                    <View style={styles.infoBox}>
                      <Text allowFontScaling={false} style={styles.infoText}>
                        📞 Se realizará verificación por llamada
                      </Text>
                    </View>
                  </>
                )}

                {alguienEnDomicilio === 'no' && (
                  <View style={styles.warningBox}>
                    <Text allowFontScaling={false} style={styles.warningIcon}>⚠️</Text>
                    <Text allowFontScaling={false} style={styles.warningText}>
                      Cliente no localizada - Preguntar a vecino
                    </Text>
                  </View>
                )}
              </>
            )}

          </Card>
        )}

        {/* PASO 4: Evaluación Económica */}
        {pasoActual === 'evaluacion-economica' && (
          <>
            {/* INGRESOS */}
            <View style={styles.stickyHeader}>
              <Text allowFontScaling={false} style={styles.stickyHeaderText}>INGRESOS SEMANALES</Text>
            </View>
            <Card style={styles.mainCard}>
                    <TextInput
                      label="1. Propios (Sueldo)"
                      value={ingresoEmpleo}
                      onChangeText={(val) => setIngresoEmpleo(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="2. Externos"
                      value={ingresoExterno}
                      onChangeText={(val) => setIngresoExterno(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="3. Negocio"
                      value={ingresoNegocio}
                      onChangeText={(val) => setIngresoNegocio(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />

                    <View style={styles.totalBox}>
                      <Text allowFontScaling={false} style={styles.totalLabel}>
                        TOTAL INGRESOS:
                      </Text>
                      <Text allowFontScaling={false} style={styles.totalValor}>
                        {formatCurrency(
                          Number(ingresoEmpleo.replace(/\D/g, '') || 0) +
                          Number(ingresoExterno.replace(/\D/g, '') || 0) +
                          Number(ingresoNegocio.replace(/\D/g, '') || 0)
                        )}
                      </Text>
                    </View>
                  </Card>

            {/* GASTOS */}
            <View
              ref={gastosHeaderRef}
              style={styles.stickyHeader}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                setGastosHeaderY(y);
              }}
            >
              <Text allowFontScaling={false} style={styles.stickyHeaderText}>GASTOS SEMANALES</Text>
            </View>
            <Card style={styles.mainCard}>
                    <TextInput
                      label="1. Luz"
                      value={gastoLuz}
                      onChangeText={(val) => setGastoLuz(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="2. Gas"
                      value={gastoGas}
                      onChangeText={(val) => setGastoGas(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="3. Agua"
                      value={gastoAgua}
                      onChangeText={(val) => setGastoAgua(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="4. Teléfono"
                      value={gastoTelefono}
                      onChangeText={(val) => setGastoTelefono(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="5. Cable"
                      value={gastoCable}
                      onChangeText={(val) => setGastoCable(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="6. Celular"
                      value={gastoCelular}
                      onChangeText={(val) => setGastoCelular(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="7. Despensa"
                      value={gastoDespensa}
                      onChangeText={(val) => setGastoDespensa(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="8. Casa"
                      value={gastoCasa}
                      onChangeText={(val) => setGastoCasa(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="9. Escuela"
                      value={gastoEscuela}
                      onChangeText={(val) => setGastoEscuela(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="10. Carro"
                      value={gastoCarro}
                      onChangeText={(val) => setGastoCarro(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />
                    <TextInput
                      label="11. Otros"
                      value={gastoOtros}
                      onChangeText={(val) => setGastoOtros(normalizeCurrencyInput(val))}
                      keyboardType="numeric"
                      placeholder="$ 0"
                    />

                    <View style={styles.totalBox}>
                      <Text allowFontScaling={false} style={styles.totalLabel}>
                        TOTAL GASTOS:
                      </Text>
                      <Text allowFontScaling={false} style={styles.totalValor}>
                        {formatCurrency(
                          Number(gastoLuz.replace(/\D/g, '') || 0) +
                          Number(gastoGas.replace(/\D/g, '') || 0) +
                          Number(gastoAgua.replace(/\D/g, '') || 0) +
                          Number(gastoTelefono.replace(/\D/g, '') || 0) +
                          Number(gastoCable.replace(/\D/g, '') || 0) +
                          Number(gastoCelular.replace(/\D/g, '') || 0) +
                          Number(gastoDespensa.replace(/\D/g, '') || 0) +
                          Number(gastoCasa.replace(/\D/g, '') || 0) +
                          Number(gastoEscuela.replace(/\D/g, '') || 0) +
                          Number(gastoCarro.replace(/\D/g, '') || 0) +
                          Number(gastoOtros.replace(/\D/g, '') || 0)
                        )}
                      </Text>
                    </View>
                  </Card>

            {/* Marcador del final de la sección de gastos */}
            <View
              ref={gastosEndRef}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                setGastosEndY(y);
              }}
            />

            {/* Balance informativo: las políticas de capacidad y pago aún no están aprobadas. */}
            <Card style={styles.mainCard}>
              <Text allowFontScaling={false} style={styles.capacidadPagoTitulo}>
                BALANCE CAPTURADO
              </Text>

              {/* RESTA */}
              <View style={styles.restaBox}>
                <Text allowFontScaling={false} style={styles.restaLabel}>
                  RESTA = TOTAL INGRESOS - TOTAL GASTOS
                </Text>
                <View style={styles.restaCalculo}>
                  <Text allowFontScaling={false} style={styles.restaTexto}>
                    {formatCurrency(getTotalIngresos())} - {formatCurrency(getTotalGastos())} =
                  </Text>
                  <Text allowFontScaling={false} style={[
                    styles.restaResultado,
                    getDisponible() < 0 && styles.restaResultadoNegativo
                  ]}>
                    {formatCurrency(getDisponible())}
                  </Text>
                </View>
              </View>

              <Text allowFontScaling={false} style={styles.helpText}>
                Este balance no emite una decisión. El pago semanal y la capacidad de pago se habilitarán
                cuando sus parámetros y fórmula estén aprobados y versionados por CRELEALTAD.
              </Text>
            </Card>
          </>
        )}

        {/* PASO 5: Referencias */}
        {pasoActual === 'referencias' && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Referencias Adicionales" />
            <Text allowFontScaling={false} style={styles.helpText}>
              Captura 2 referencias personales
            </Text>

            <Text allowFontScaling={false} style={styles.subsectionTitle}>Referencia 1</Text>
            <TextInput
              label="Nombre completo"
              value={ref1Nombre}
              onChangeText={setRef1Nombre}
            />
            <TextInput
              label="Parentesco"
              value={ref1Parentesco}
              onChangeText={setRef1Parentesco}
            />
            <TextInput
              label="Teléfono"
              value={ref1Telefono}
              onChangeText={setRef1Telefono}
              keyboardType="phone-pad"
            />

            <Text allowFontScaling={false} style={styles.subsectionTitle}>Referencia 2</Text>
            <TextInput
              label="Nombre completo"
              value={ref2Nombre}
              onChangeText={setRef2Nombre}
            />
            <TextInput
              label="Parentesco"
              value={ref2Parentesco}
              onChangeText={setRef2Parentesco}
            />
            <TextInput
              label="Teléfono"
              value={ref2Telefono}
              onChangeText={setRef2Telefono}
              keyboardType="phone-pad"
            />

          </Card>
        )}

        {/* PASO 6: Preguntas Generales */}
        {pasoActual === 'preguntas-generales' && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Preguntas Generales" />

            <SelectorField
              label="¿Conoce a las integrantes del grupo?"
              value={conoceIntegrantes}
              options={['Sí', 'No', 'Algunas']}
              onSelect={setConoceIntegrantes}
              moduleTheme="verification"
            />

            <SelectorField
              label="¿Conoce los montos solicitados?"
              value={conoceMontos}
              options={['Sí', 'No']}
              onSelect={setConoceMontos}
              moduleTheme="verification"
            />

            <SelectorField
              label="¿Conoce quién es la tesorera?"
              value={conoceTesorera}
              options={['Sí', 'No']}
              onSelect={setConoceTesorera}
              moduleTheme="verification"
            />

            <SelectorField
              label="¿Conoce el domicilio de otras integrantes?"
              value={conoceDomicilio}
              options={['Sí', 'No', 'Algunas']}
              onSelect={setConoceDomicilio}
              moduleTheme="verification"
            />

            <TextInput
              label="Antigüedad en el domicilio (años)"
              value={antiguedadDomicilio}
              onChangeText={setAntiguedadDomicilio}
              keyboardType="numeric"
            />

            <SelectorField
              label="Tipo de domicilio"
              value={tipoDomicilio}
              options={['Propio', 'Rentado', 'Prestado', 'Familiar']}
              onSelect={setTipoDomicilio}
              moduleTheme="verification"
            />

            <SelectorField
              label="¿Tiene negocio propio?"
              value={tieneNegocio}
              options={['Sí', 'No']}
              onSelect={setTieneNegocio}
              moduleTheme="verification"
            />

            <SelectorField
              label="¿Tiene otro crédito activo?"
              value={tieneOtroCredito}
              options={['Sí', 'No']}
              onSelect={setTieneOtroCredito}
              moduleTheme="verification"
            />

          </Card>
        )}

        {/* PASO 7: Preguntas Tesorera */}
        {pasoActual === 'preguntas-tesorera' && integrante?.esTesorera && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Preguntas para la Tesorera" />
            <View style={styles.tesoreraHeader}>
              <StatusBadge label="TESORERA" leadingMark="T" tone="pending" />
              <Text allowFontScaling={false} style={styles.tesoreraTitle}>
                Preguntas adicionales para la tesorera del grupo
              </Text>
            </View>

            <SelectorField
              label="¿Ella formó el grupo?"
              value={formoGrupo}
              options={['Sí', 'No']}
              onSelect={setFormoGrupo}
              moduleTheme="verification"
            />

            <SelectorField
              label="¿Conoce todos los montos solicitados?"
              value={conoceMontosTesorera}
              options={['Sí', 'No', 'Algunos']}
              onSelect={setConoceMontosTesorera}
              moduleTheme="verification"
            />

            <TextInput
              label="Lugar donde se hará el cobro"
              value={lugarCobro}
              onChangeText={setLugarCobro}
              placeholder="Ej: Casa de la tesorera, oficina, etc."
            />

          </Card>
        )}

        {/* PASO 8: Control de Pagos */}
        {pasoActual === 'control-pagos' && integrante?.esRenovacion && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Control de Pagos" />
            <Text allowFontScaling={false} style={styles.helpText}>
              Fotografiar ambas hojas del control de pagos
            </Text>
            <View style={styles.warningBox}>
              <Text allowFontScaling={false} style={styles.warningIcon}>⚠️</Text>
              <Text allowFontScaling={false} style={styles.warningText}>
                Sin carrete permitido - solo cámara en vivo
              </Text>
            </View>

            <View style={styles.fotoControlContainer}>
              <View style={styles.fotoControlItem}>
                <Text allowFontScaling={false} style={styles.fotoControlLabel}>Hoja 1</Text>
                {fotoControlPagos1 ? (
                  <>
                    <Image source={{ uri: fotoControlPagos1, headers: evidenciaEntrevistaHeaders }} style={styles.fotoControlImage} />
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => handleTomarFoto?.(setFotoControlPagos1)}
                      activeOpacity={0.8}
                    >
                      <Text allowFontScaling={false} style={styles.backButtonText}>Retomar</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => handleTomarFoto?.(setFotoControlPagos1)}
                    activeOpacity={0.8}
                  >
                    <Text allowFontScaling={false} style={styles.continueButtonText}>📷 Foto Hoja 1</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.fotoControlItem}>
                <Text allowFontScaling={false} style={styles.fotoControlLabel}>Hoja 2</Text>
                {fotoControlPagos2 ? (
                  <>
                    <Image source={{ uri: fotoControlPagos2 }} style={styles.fotoControlImage} />
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => handleTomarFoto?.(setFotoControlPagos2)}
                      activeOpacity={0.8}
                    >
                      <Text allowFontScaling={false} style={styles.backButtonText}>Retomar</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => handleTomarFoto?.(setFotoControlPagos2)}
                    activeOpacity={0.8}
                  >
                    <Text allowFontScaling={false} style={styles.continueButtonText}>📷 Foto Hoja 2</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {(!fotoControlPagos1 || !fotoControlPagos2) && (
              <>
                <Text allowFontScaling={false} style={styles.orText}>O bien</Text>
                <TextInput
                  label="Si no tiene control de pagos, explica por qué"
                  value={motivoSinControl}
                  onChangeText={setMotivoSinControl}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

          </Card>
        )}

        {/* PASO 9: Autoevaluación */}
        {pasoActual === 'autoevaluacion' && integrante?.esRenovacion && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Autoevaluación del Crédito" />
            <Text allowFontScaling={false} style={styles.helpText}>
              Pregunta a la clienta sobre su experiencia
            </Text>

            <SelectorField
              label="¿Cómo fue el trato del asesor?"
              value={tratoAsesor}
              options={['Excelente', 'Bueno', 'Regular', 'Malo']}
              onSelect={setTratoAsesor}
              moduleTheme="verification"
            />

            <SelectorField
              label="¿Cómo califica el servicio?"
              value={calidadServicio}
              options={['Excelente', 'Bueno', 'Regular', 'Malo']}
              onSelect={setCalidadServicio}
              moduleTheme="verification"
            />

            <SelectorField
              label="¿Recomendaría CRELEALTAD?"
              value={recomendaria}
              options={['Sí', 'No', 'Tal vez']}
              onSelect={setRecomendaria}
              moduleTheme="verification"
            />

          </Card>
        )}

        {/* PASO: Validacion de Integrante (Preguntas Generales) */}
        {pasoActual === 'validacion-integrante' && (
          <Card style={styles.mainCard}>
            <EntrevistaPreguntasGeneralesSection
              guardando={guardandoEntrevista}
              errorGuardado={errorGuardadoEntrevista}
              entrevistaCargada={entrevistaCargada}
              entrevistaConfirmada={Boolean(ultimaEntrevistaConfirmadaRef.current) && estadoSyncEntrevista === 'synced'}
              guardadoLocalPendiente={estadoSyncEntrevista === 'pending'}
              conoceAsesora={conoceAsesora}
              comoConocioAsesora={comoConocioAsesora}
              conoceIntegrantes={conoceIntegrantes}
              tiempoConoceIntegrantes={tiempoConoceIntegrantes}
              sabeMontosCompaneras={sabeMontosCompaneras}
              acuerdoMontos={acuerdoMontos}
              integrantesGrupo={integrantesGrupo}
              integranteId={integranteId}
              montoTotalSolicitadoGrupo={montoTotalSolicitadoGrupo}
              companerasMontoNoAcordadoIds={companerasMontoNoAcordadoIds}
              motivosDesacuerdoMontosPorIntegrante={motivosDesacuerdoMontosPorIntegrante}
              conoceTesoreraDelGrupo={conoceTesoreraDelGrupo}
              quienEsTesorera={quienEsTesorera}
              domicilioRecoleccion={domicilioRecoleccion}
              tieneFamiliarGrupo={tieneFamiliarGrupo}
              familiaresGrupoIds={familiaresGrupoIds}
              onRecuperarEntrevista={() => void cargarEntrevistaGuardada()}
              onReintentarGuardado={() => void reintentarGuardadoEntrevista()}
              onConoceAsesoraChange={(respuesta) => {
                setConoceAsesora(respuesta);
                if (respuesta === 'No') setComoConocioAsesora('');
              }}
              onComoConocioAsesoraChange={setComoConocioAsesora}
              onConoceIntegrantesChange={setConoceIntegrantes}
              onTiempoConoceIntegrantesChange={setTiempoConoceIntegrantes}
              onSabeMontosCompanerasChange={setSabeMontosCompaneras}
              onAcuerdoMontosChange={handleAcuerdoMontosChange}
              onCompanerasMontoNoAcordadoChange={setCompanerasMontoNoAcordadoIds}
              onMotivosDesacuerdoChange={setMotivosDesacuerdoMontosPorIntegrante}
              onConoceTesoreraChange={(respuesta) => {
                setConoceTesoreraDelGrupo(respuesta);
                setQuienEsTesorera(respuesta === 'No' ? NO_CONOCE_TESORERA_VALUE : '');
              }}
              onQuienEsTesoreraChange={setQuienEsTesorera}
              onDomicilioRecoleccionChange={setDomicilioRecoleccion}
              onTieneFamiliarGrupoChange={(respuesta) => {
                setTieneFamiliarGrupo(respuesta);
                if (respuesta === 'No') setFamiliaresGrupoIds([]);
              }}
              onFamiliaresGrupoChange={setFamiliaresGrupoIds}
            />

            <EntrevistaHistorialCrediticioSection
              historialInterno={integrante?.historialCrediticioInterno}
              tieneOtroCreditoGrupal={tieneOtroCreditoGrupal}
              financieraCreditoGrupal={financieraCreditoGrupal}
              creditoGrupalAnteriorActivo={creditoGrupalAnteriorActivo}
              valorFichaCreditoGrupal={valorFichaCreditoGrupal}
              semanaActualCreditoGrupal={semanaActualCreditoGrupal}
              mesDesembolsoCreditoGrupal={mesDesembolsoCreditoGrupal}
              mesUltimoPagoCreditoGrupal={mesUltimoPagoCreditoGrupal}
              anioUltimoPagoCreditoGrupal={anioUltimoPagoCreditoGrupal}
              semanasDesdeUltimoPagoCreditoGrupal={semanasDesdeUltimoPagoCreditoGrupal}
              numeroCiclosCreditoGrupal={numeroCiclosCreditoGrupal}
              tasaCreditoGrupal={tasaCreditoGrupal}
              nombreAsesoraCreditoGrupal={nombreAsesoraCreditoGrupal}
              telefonoAsesoraCreditoGrupal={telefonoAsesoraCreditoGrupal}
              motivoNoRenovacionCreditoGrupal={motivoNoRenovacionCreditoGrupal}
              tipoEvidenciaActual={tipoEvidenciaHistorialCreditoActual}
              tipoEvidenciaGuardando={guardandoEvidenciasHistorialCredito}
              loadingEvidencias={loadingEvidenciasHistorialCredito}
              loadingComprobante={loadingComprobanteLineaCredito}
              evidenciasPendientes={evidenciasHistorialCreditoPendientesActuales.length}
              fotografiasGuardadas={fotografiasOtraFinancieraGuardadas}
              paginasEvidencias={paginasEvidenciasHistorialCredito}
              errorEvidencias={errorEvidenciasHistorialCreditoActual}
              errorComprobante={errorComprobanteLineaCredito}
              onTieneOtroCreditoGrupalChange={setTieneOtroCreditoGrupal}
              onFinancieraCreditoGrupalChange={setFinancieraCreditoGrupal}
              onCreditoGrupalAnteriorActivoChange={setCreditoGrupalAnteriorActivo}
              onValorFichaCreditoGrupalChange={setValorFichaCreditoGrupal}
              onSemanaActualCreditoGrupalChange={setSemanaActualCreditoGrupal}
              onMesDesembolsoCreditoGrupalChange={setMesDesembolsoCreditoGrupal}
              onUltimoPagoCreditoGrupalChange={(month, year) => {
                setMesUltimoPagoCreditoGrupal(month);
                setAnioUltimoPagoCreditoGrupal(year);
              }}
              onNumeroCiclosCreditoGrupalChange={setNumeroCiclosCreditoGrupal}
              onTasaCreditoGrupalChange={setTasaCreditoGrupal}
              onNombreAsesoraCreditoGrupalChange={setNombreAsesoraCreditoGrupal}
              onTelefonoAsesoraCreditoGrupalChange={setTelefonoAsesoraCreditoGrupal}
              onMotivoNoRenovacionCreditoGrupalChange={setMotivoNoRenovacionCreditoGrupal}
              onLimpiarCreditoGrupal={() => {
                setFinancieraCreditoGrupal('');
                setCreditoGrupalAnteriorActivo('');
                setValorFichaCreditoGrupal('');
                setSemanaActualCreditoGrupal('');
                setMesDesembolsoCreditoGrupal('');
                setMesUltimoPagoCreditoGrupal('');
                setAnioUltimoPagoCreditoGrupal('');
                setNumeroCiclosCreditoGrupal('');
                setNombreAsesoraCreditoGrupal('');
                setTelefonoAsesoraCreditoGrupal('');
                setTasaCreditoGrupal('');
                setMotivoNoRenovacionCreditoGrupal('');
              }}
              onLimpiarRutaCreditoGrupal={() => {
                setValorFichaCreditoGrupal('');
                setSemanaActualCreditoGrupal('');
                setMesDesembolsoCreditoGrupal('');
                setMesUltimoPagoCreditoGrupal('');
                setAnioUltimoPagoCreditoGrupal('');
                setNumeroCiclosCreditoGrupal('');
                setNombreAsesoraCreditoGrupal('');
                setTelefonoAsesoraCreditoGrupal('');
                setTasaCreditoGrupal('');
                setMotivoNoRenovacionCreditoGrupal('');
              }}
              onReintentarComprobante={() => void cargarComprobanteLineaCredito(
                comprobanteLineaCredito,
              )}
              onCapturarEvidencia={(tipo) => void capturarEvidenciaHistorialCredito(tipo)}
              onReintentarEvidencias={(tipo) => void guardarEvidenciasHistorialCredito(
                tipo,
                evidenciasHistorialCreditoPendientes[tipo],
              )}
            />

            <EntrevistaDatosPersonalesSection
              nombreIntegrante={[
                solicitudData?.nombres,
                solicitudData?.apellido_pat,
              ].filter(Boolean).join(' ').trim() || integrante?.nombre?.trim() || 'La integrante'}
              viveEnDomicilioDeclarado={viveEnDomicilioDeclarado}
              motivoNoViveEnDomicilio={motivoNoViveEnDomicilio}
              tipoDomicilio={tipoDomicilio}
              familiarDomicilio={familiarDomicilio}
              aniosEnDomicilio={aniosEnDomicilio}
              personasVivenCasa={personasVivenCasa}
              quienViveConUsted={quienViveConUsted}
              quienesVivenConUstedSabenDelCredito={quienesVivenConUstedSabenDelCredito}
              tieneOtroIngresoHogar={tieneOtroIngresoHogar}
              otroIngresoSemanal={otroIngresoSemanal}
              imagenesDomicilio={renderImagenesDomicilio()}
              telefonoConfirmado={telefonoConfirmado}
              telefonoSecundario={telefonoSecundario}
              telefonoPrincipalEstaConfirmado={telefonoPrincipalEstaConfirmado}
              telefonoSecundarioEstaConfirmado={telefonoSecundarioEstaConfirmado}
              onViveEnDomicilioChange={setViveEnDomicilioDeclarado}
              onMotivoNoViveEnDomicilioChange={setMotivoNoViveEnDomicilio}
              onTipoDomicilioChange={setTipoDomicilio}
              onFamiliarDomicilioChange={setFamiliarDomicilio}
              onAniosEnDomicilioChange={setAniosEnDomicilio}
              onPersonasVivenCasaChange={setPersonasVivenCasa}
              onQuienViveConUstedChange={setQuienViveConUsted}
              onQuienesVivenConUstedSabenDelCreditoChange={setQuienesVivenConUstedSabenDelCredito}
              onTieneOtroIngresoHogarChange={setTieneOtroIngresoHogar}
              onOtroIngresoSemanalChange={setOtroIngresoSemanal}
              onTelefonoConfirmadoChange={setTelefonoConfirmado}
              onTelefonoSecundarioChange={setTelefonoSecundario}
              onConfirmarTelefonoPrincipal={() => handleSeleccionarCanalTelefono(
                telefonoConfirmado,
                'PRINCIPAL',
              )}
              onConfirmarTelefonoSecundario={() => handleSeleccionarCanalTelefono(
                telefonoSecundario,
                'SECUNDARIO',
              )}
              onVerEvidenciaTelefonoPrincipal={() => void abrirEvidenciaTelefono('PRINCIPAL')}
              onVerEvidenciaTelefonoSecundario={() => void abrirEvidenciaTelefono('SECUNDARIO')}
            />

            <EntrevistaIngresosSection
              capacidadPagoSemanal={capacidadPagoSemanal}
              motivoCredito={motivoCredito}
              fuentesIngresoPersonal={fuentesIngresoPersonal}
              ingresosSemanalesDeclarados={ingresosSemanalesDeclarados}
              lugarTrabajo={lugarTrabajo}
              antiguedadLaboral={antiguedadLaboral}
              tipoNegocio={tipoNegocio}
              ingresoLibreSemanalNegocio={ingresoLibreSemanalNegocio}
              ubicacionNegocio={ubicacionNegocio}
              guardandoEvidenciasNegocio={guardandoEvidenciasNegocio}
              loadingEvidenciasNegocio={loadingEvidenciasNegocio}
              evidenciasNegocioPendientes={evidenciasNegocioPendientes.length}
              evidenciasNegocioGuardadas={evidenciasNegocio.length}
              paginasEvidenciasNegocio={paginasEvidenciasNegocio}
              errorEvidenciasNegocio={errorEvidenciasNegocio}
              onCapacidadPagoSemanalChange={setCapacidadPagoSemanal}
              onMotivoCreditoChange={setMotivoCredito}
              onFuentesIngresoPersonalChange={setFuentesIngresoPersonal}
              onIngresosSemanalesDeclaradosChange={setIngresosSemanalesDeclarados}
              onLugarTrabajoChange={setLugarTrabajo}
              onAntiguedadLaboralChange={setAntiguedadLaboral}
              onTipoNegocioChange={setTipoNegocio}
              onIngresoLibreSemanalNegocioChange={setIngresoLibreSemanalNegocio}
              onUbicacionNegocioChange={setUbicacionNegocio}
              onLimpiarSueldo={() => {
                setIngresosSemanalesDeclarados('');
                setLugarTrabajo('');
                setAntiguedadLaboral('');
              }}
              onLimpiarNegocio={() => {
                setTipoNegocio('');
                setIngresoLibreSemanalNegocio('');
                setUbicacionNegocio('');
              }}
              onCapturarEvidenciaNegocio={() => void capturarEvidenciaNegocio()}
              onReintentarEvidenciasNegocio={() => void guardarEvidenciasNegocio(
                evidenciasNegocioPendientes,
              )}
            />

            <EntrevistaEncuestasSection
              mostrarControlTesorera={Boolean(
                integrante?.esTesorera && integrante.tieneHistorialInterno === true,
              )}
              mostrarEncuestaServicio={integrante?.tieneHistorialInterno === true}
              tieneControlPagos={tieneControlPagos}
              motivoSinControl={motivoSinControl}
              asesoraAcudioSemanalmente={asesoraAcudioSemanalmente}
              firmabanControlSemanalmente={firmabanControlSemanalmente}
              tratoAsesoraTesorera={tratoAsesoraTesorera}
              conocePremioTesorera={conocePremioTesorera}
              opinionCredito={opinionCredito}
              tratoDesembolso={tratoDesembolso}
              rapidezDesembolso={rapidezDesembolso}
              informacionCreditoClara={informacionCreditoClara}
              recomendaria={recomendaria}
              razonRecomendacion={razonRecomendacion}
              motivoRecomendacion={motivoRecomendacion}
              guardandoEvidencia={guardandoEvidenciaEntrevista}
              fotoControlPagos={fotoControlPagos1}
              fotoControlPagosPendiente={evidenciaControlPagosPendiente?.uri ?? null}
              fotoFolleto={fotoFolletoPremioTesorera}
              fotoFolletoPendiente={evidenciaFolletoPendiente?.uri ?? null}
              headersEvidencia={evidenciaEntrevistaHeaders}
              onTieneControlPagosChange={setTieneControlPagos}
              onMotivoSinControlChange={setMotivoSinControl}
              onAsesoraAcudioSemanalmenteChange={setAsesoraAcudioSemanalmente}
              onFirmabanControlSemanalmenteChange={setFirmabanControlSemanalmente}
              onTratoAsesoraTesoreraChange={setTratoAsesoraTesorera}
              onConocePremioTesoreraChange={(respuesta) => {
                setConocePremioTesorera(respuesta);
                if (respuesta === 'Sí') setFotoFolletoPremioVisible(false);
              }}
              onOpinionCreditoChange={setOpinionCredito}
              onTratoDesembolsoChange={setTratoDesembolso}
              onRapidezDesembolsoChange={setRapidezDesembolso}
              onInformacionCreditoClaraChange={setInformacionCreditoClara}
              onRecomendariaChange={setRecomendaria}
              onRazonRecomendacionChange={setRazonRecomendacion}
              onMotivoRecomendacionChange={setMotivoRecomendacion}
              onAbrirControlPagos={() => setFotoControlPagosVisible(true)}
              onCapturarControlPagos={abrirOpcionesFotoControlPagos}
              onReintentarControlPagos={() => {
                if (!evidenciaControlPagosPendiente) return;
                void guardarEvidenciaEspecialEntrevista(
                  evidenciaControlPagosPendiente,
                  setFotoControlPagos1,
                  setEvidenciaControlPagosPendiente,
                );
              }}
              onAbrirFolleto={() => setFotoFolletoPremioVisible(true)}
              onCapturarFolleto={() => void capturarYGuardarEvidenciaEntrevista(
                'FOLLETO_PREMIO_TESORERA',
                setFotoFolletoPremioTesorera,
                setEvidenciaFolletoPendiente,
              )}
              onReintentarFolleto={() => {
                if (!evidenciaFolletoPendiente) return;
                void guardarEvidenciaEspecialEntrevista(
                  evidenciaFolletoPendiente,
                  setFotoFolletoPremioTesorera,
                  setEvidenciaFolletoPendiente,
                );
              }}
            />
          </Card>
        )}

        {/* Conclusiones del verificador */}
        {pasoActual === 'observaciones' && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Conclusiones del verificador" />

            <SelectorField
              label="¿Hay inconsistencias?"
              value={hayInconsistencias}
              options={['Sí', 'No']}
              onSelect={setHayInconsistencias}
              moduleTheme="verification"
            />

            <SelectorField
              label="¿Realmente vive ahí?"
              value={realmenteViveAhi}
              options={['Sí', 'No', 'Dudoso']}
              onSelect={setRealmenteViveAhi}
              moduleTheme="verification"
            />

            <SelectorField
              label="¿Recomienda otorgar el crédito?"
              value={recomendacion}
              options={['Sí', 'No', 'Con reservas']}
              onSelect={setRecomendacion}
              moduleTheme="verification"
            />

            <TextInput
              label="Observaciones adicionales"
              value={observacionesAdicionales}
              onChangeText={setObservacionesAdicionales}
              multiline
              numberOfLines={4}
              placeholder="Escribe cualquier observación adicional relevante..."
            />

          </Card>
        )}

        {/* La decisión permanece bloqueada hasta contar con contrato persistente y permisos aprobados. */}
        {pasoActual === 'decision' && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Finalización pendiente" />
            <StatusCard status="verificationObservations">
              <Text allowFontScaling={false} style={styles.resultadoLabel}>
                La verificación todavía no puede cerrarse
              </Text>
              <Text allowFontScaling={false} style={styles.helpText}>
                La revisión puede consultarse, pero aprobar, reducir monto o rechazar permanecerá
                bloqueado hasta contar con persistencia, auditoría y permisos funcionales aprobados.
              </Text>
            </StatusCard>
          </Card>
        )}
      </ScrollView>

      {/* Navegación fija: cada proceso regresa al concentrador, sin imponer orden. */}
      <View style={styles.navigationButtons}>
        {pasoActual === 'documentos' && consultandoDocumentos ? (
          <SecondaryButton title="← Volver a procesos" onPress={handleBackPress} />
        ) : pasoActual === 'documentos' && hayDocumentoRechazado() ? (
          <SecondaryButton
            title={markingNeedsDocumentation ? 'Guardando…' : '← Revisar documentación'}
            tone="danger"
            disabled={markingNeedsDocumentation || !puedeSolicitarRevisionDocumental()}
            onPress={handleMarkNeedsDocumentation}
          />
        ) : pasoActual === 'documentos' ? (
          <PrimaryButton
            title={isDocumentosValidadosCompleto() ? 'Abrir procesos' : 'Revisa todos los documentos'}
            moduleTheme="verification"
            onPress={abrirProcesos}
            disabled={!isDocumentosValidadosCompleto()}
          />
        ) : pasoActual === 'menu' ? (
          <SecondaryButton title="← Atrás" onPress={onBack} />
        ) : pasoActual === 'llamada-integrante' && vistaLlamada === 'encuesta' ? (
          <SecondaryButton title="← Volver a llamadas" onPress={handleBackPress} />
        ) : pasoActual === 'visita-vecino' ? (
          <PrimaryButton
            title="Terminar visita al vecino"
            moduleTheme="verification"
            disabled={!visitaVecinoListaParaTerminar}
            accessibilityLabel="Terminar visita al vecino. Se habilita al guardar la respuesta y la fotografía de evidencia."
            onPress={handleTerminarVisitaVecino}
          />
        ) : pasoActual === 'foto-domicilio' ? (
          <PrimaryButton
            title="Terminar imágenes del domicilio"
            moduleTheme="verification"
            disabled={!imagenesDomicilioListasParaTerminar}
            accessibilityLabel="Terminar imágenes del domicilio. Se habilita al guardar la fachada y confirmar la respuesta sobre el medidor de luz; si existe, también requiere su fotografía."
            onPress={handleTerminarImagenesDomicilio}
          />
        ) : (
          <SecondaryButton title="← Volver a procesos" onPress={handleBackPress} />
        )}
      </View>

      <VerificacionDocumentoModal
        visible={showDocumentModal}
        documento={documentoViewing}
        consultando={consultandoDocumentos}
        ladoSeleccionado={ladoSeleccionado}
        titulo={getModalHeaderTitle()}
        preguntaValidacion={getPreguntaValidacion()}
        onLadoSeleccionadoChange={setLadoSeleccionado}
        onClose={cerrarDocumentoModal}
        onValidar={handleValidacion}
      />

      <VerificacionLlamadaModals
        selectorNumeroVisible={selectorNumeroLlamadaVisible}
        canalParaNumero={canalParaSeleccionarNumero}
        telefonosDisponibles={obtenerTelefonosLlamadaDisponibles(integrante)}
        selectorCanalVisible={selectorCanalTelefonoVisible}
        telefonoSeleccionado={telefonoSeleccionadoParaContacto}
        whatsappHabilitado={whatsappTelefonoConfirmadoHabilitado}
        confirmacionEvidenciaVisible={confirmacionTelefonoEvidenciaVisible}
        confirmacionPendiente={confirmacionTelefonoPendiente}
        evidenciaSeleccionada={evidenciaLlamada}
        guardandoConfirmacion={guardandoConfirmacionTelefono}
        evidenciaTelefonoVisible={evidenciaTelefonoVisible}
        telefonoEvidencia={telefonoEvidenciaEnVista}
        evidenciaTelefonoHeaders={evidenciaTelefonoHeaders}
        reemplazoEvidenciaVisible={reemplazoEvidenciaTelefonoVisible}
        guardandoReemplazo={guardandoReemplazoEvidenciaTelefono}
        resultadoVisible={showLlamadaModal}
        guardandoResultado={guardandoResultadoLlamada}
        onCloseSelectorNumero={cerrarSelectorNumeroLlamada}
        onSeleccionarNumero={handleSeleccionarNumeroLlamada}
        onCloseSelectorCanal={cerrarSelectorCanalTelefono}
        onLlamadaTelefonica={handleLlamadaTelefonoSeleccionado}
        onLlamadaWhatsApp={handleWhatsAppTelefonoSeleccionado}
        onCloseConfirmacionEvidencia={cerrarEvidenciaConfirmacionTelefono}
        onSeleccionarEvidencia={() => void seleccionarEvidenciaLlamada()}
        onGuardarConfirmacion={() => void guardarConfirmacionTelefono()}
        onCloseEvidenciaTelefono={cerrarEvidenciaTelefono}
        onIniciarReemplazo={iniciarReemplazoEvidenciaTelefono}
        onCloseReemplazo={cerrarReemplazoEvidenciaTelefono}
        onGuardarReemplazo={() => void guardarReemplazoEvidenciaTelefono()}
        onResultadoPositivo={() => handleResultadoLlamada('si-contesto')}
        onResultadoNegativo={() => handleResultadoLlamada('no-contesto')}
        onDismissResultado={handleDismissResultadoLlamada}
      />

      <EntrevistaEvidenceViewers
        controlPagosVisible={fotoControlPagosVisible}
        controlPagos={fotoControlPagos1 || evidenciaControlPagosPendiente ? {
          uri: evidenciaControlPagosPendiente?.uri || fotoControlPagos1 || '',
          headers: evidenciaControlPagosPendiente ? undefined : evidenciaEntrevistaHeaders,
        } : null}
        imagenDomicilio={imagenDomicilioEnVista}
        folletoVisible={fotoFolletoPremioVisible}
        folleto={fotoFolletoPremioTesorera || evidenciaFolletoPendiente ? {
          uri: evidenciaFolletoPendiente?.uri || fotoFolletoPremioTesorera || '',
          headers: evidenciaFolletoPendiente ? undefined : evidenciaEntrevistaHeaders,
        } : null}
        onCloseControlPagos={() => setFotoControlPagosVisible(false)}
        onCloseImagenDomicilio={() => setImagenDomicilioEnVista(null)}
        onCloseFolleto={() => setFotoFolletoPremioVisible(false)}
      />

      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  fixedSolicitanteContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  integranteCard: {
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray[900],
    marginBottom: 0,
  },
  integranteCardWithNewTab: {
    borderTopLeftRadius: 0,
  },
  integranteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  integranteSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tesoreraBadge: {
    flexShrink: 0,
  },
  integranteMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginLeft: 'auto',
  },
  creditHistoryBadge: {
    flexShrink: 0,
    backgroundColor: colors.successSoft,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  creditHistoryText: {
    color: colors.primary,
    ...typography.caption,
    fontWeight: '700',
  },
  ageBadge: {
    flexShrink: 0,
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[500],
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ageBadgeWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  metricText: {
    color: colors.textPrimary,
    ...typography.caption,
    fontWeight: '700',
  },
  distanceBadge: {
    flexShrink: 0,
    backgroundColor: colors.infoSoft,
    borderColor: colors.info,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  distanceText: {
    color: colors.info,
    ...typography.caption,
    fontWeight: '700',
  },
  distanceBadgeWarning: {
    backgroundColor: colors.dangerSoft,
    borderColor: statusColors.rejected.background,
  },
  distanceTextWarning: {
    color: statusColors.rejected.background,
  },
  integranteName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
    textAlign: 'left',
  },
  positionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[600],
    textAlign: 'right',
  },
  contactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.sm,
  },
  phoneRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  phoneDisplayContainer: {
    backgroundColor: colors.infoSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  phoneIconButton: {
    backgroundColor: colors.infoSoft,
    padding: 8,
    borderRadius: 8,
  },
  phoneIcon: {
    fontSize: 20,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
  },
  // Barra de progreso del wizard (igual que Documentación)
  wizardProgressContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wizardHeaderOneLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  wizardStepTitleCompact: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[900],
    flex: 1,
  },
  wizardStepTextCompact: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FDE047', // Amarillo brillante (igual que Documentación)
    borderRadius: radius.pill,
  },
  mainCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  stickyHeader: {
    backgroundColor: moduleThemes.verification.headerAccent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: moduleThemes.verification.titleBarBg,
  },
  stickyHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: moduleThemes.verification.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  floatingStickyHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: moduleThemes.verification.headerAccent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: moduleThemes.verification.titleBarBg,
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  helpText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.warning,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  warningIcon: {
    fontSize: 24,
  },
  photoPurposeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  infoBox: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  fotoPreview: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  fotoImage: {
    width: '100%',
    height: 300,
    borderRadius: radius.md,
    backgroundColor: colors.gray[100],
  },
  capacidadPagoTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: spacing.lg,
    letterSpacing: 0.5,
  },
  totalBox: {
    backgroundColor: colors.gray[100],
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[900],
    textTransform: 'uppercase',
  },
  totalValor: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  restaBox: {
    backgroundColor: colors.gray[100],
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginBottom: spacing.sm,
  },
  restaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gray[700],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  restaCalculo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  restaTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
    textTransform: 'uppercase',
  },
  restaResultado: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
  },
  restaResultadoNegativo: {
    color: colors.error,
  },
  pagoSemanalBox: {
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.warning,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  pagoSemanalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gray[800],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pagoSemanalValor: {
    fontSize: 24,
    fontWeight: '700',
    color: moduleThemes.verification.headerBg,
    marginBottom: spacing.xs,
  },
  pagoSemanalFormula: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.gray[600],
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  resultadoBox: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultadoBoxVerde: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  resultadoBoxRojo: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.error,
  },
  resultadoLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  resultadoLabelVerde: {
    color: colors.success,
  },
  resultadoLabelRojo: {
    color: colors.error,
  },
  resultadoValor: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  resultadoValorVerde: {
    color: colors.success,
  },
  resultadoValorRojo: {
    color: colors.error,
  },
  resultadoFormula: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  resultadoIndicador: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    width: '100%',
    alignItems: 'center',
  },
  resultadoIndicadorTexto: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resultadoIndicadorTextoVerde: {
    color: colors.success,
  },
  resultadoIndicadorTextoRojo: {
    color: colors.error,
  },
  tesoreraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.warning,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  tesoreraTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[800],
  },
  fotoControlContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  fotoControlItem: {
    flex: 1,
    gap: spacing.sm,
  },
  fotoControlLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  fotoControlImage: {
    width: '100%',
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.gray[100],
  },
  orText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  decisionAprobado: {
    backgroundColor: colors.successSoft,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  decisionRechazado: {
    backgroundColor: colors.dangerSoft,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.error,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  decisionIcon: {
    fontSize: 48,
  },
  decisionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  decisionMonto: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.success,
  },
  montoComparacion: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  montoSolicitado: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  montoAutorizadoText: {
    fontSize: 16,
    fontWeight: '700',
    color: moduleThemes.verification.headerBg,
  },
  imageOptionsContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  imageOptionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  imageOptionButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  imageOptionButtonSelected: {
    backgroundColor: colors.warningLight,
    borderColor: moduleThemes.verification.headerBg,
    borderWidth: 3,
  },
  miniImage: {
    width: '100%',
    height: 120,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  imageOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  imageOptionTextSelected: {
    color: moduleThemes.verification.headerBg,
    fontWeight: '700',
  },
  mainImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: colors.white,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButton: {
    flex: 1,
    backgroundColor: moduleThemes.verification.headerBg, // Amarillo/dorado del módulo
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#D4B57E', // Amarillo claro del módulo (tono disabled)
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: moduleThemes.verification.headerBg, // Amarillo/dorado del módulo
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: moduleThemes.verification.headerBg, // Amarillo/dorado del módulo
    fontSize: 16,
    fontWeight: '600',
  },
});
