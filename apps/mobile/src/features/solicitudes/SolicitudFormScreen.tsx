import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Alert,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader, Card, CreditAmountsSummary, PrimaryButton, ScreenContainer, ScreenTitleBar } from '../../components/ui';
import type { DocumentImageCarouselPage } from '../../components/ui';
import { apiUrl } from '../../config/api';
import {
  api,
  ApiError,
  getAuthorizationHeaders,
} from '../../services/api-client';
import { usePendingReviews } from '../../context/PendingReviewsContext';
import { useProcessing } from '../../context/ProcessingContext';
import { DEFAULT_STATE } from '../../catalogs';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import {
  formatISODateToDDMMMYYYY,
  formatPhone,
  normalizeDigits,
  normalizePhone,
} from '../../utils/input';
import { llamar } from '../../utils/phone';
import { MAX_SOLICITUD_AMOUNT } from '../../config/parameters';
import { esRutaDocumentoServidor } from '../../utils/documents';
import { geocodificarDomicilio } from '../../services/domicilio-distance';
import {
  CodigoPostalApiResponse,
  IntegranteApiResponse,
  SolicitudApiResponse,
} from './solicitud-api.types';
import {
  buildAutoSavePayload,
  buildIntegrantePayload,
  buildSolicitudStepPayload,
  compactPayload,
} from './solicitud-payload.mapper';
import { SolicitudBeneficiarioStep } from './SolicitudBeneficiarioStep';
import { SolicitudDomicilioStep } from './SolicitudDomicilioStep';
import { SolicitudDocumentacionStep } from './SolicitudDocumentacionStep';
import { SolicitudInformacionPersonalStep } from './SolicitudInformacionPersonalStep';
import { SolicitudNegocioStep } from './SolicitudNegocioStep';
import { SolicitudReferenciasStep } from './SolicitudReferenciasStep';
import { SolicitudValidacionesStep } from './SolicitudValidacionesStep';
import { SolicitudDocumentOverlays } from './SolicitudDocumentOverlays';
import {
  DOCUMENTOS_REQUERIDOS,
  RUTAS_DOCUMENTO,
  subirDocumentoAlServidor,
  type DocumentStatus,
  type DocumentoCarouselState,
  type DocumentoRemoto,
  type DocumentoRequerido,
  type DocumentoViewerState,
} from './solicitud-documentos';
import {
  getMontoSolicitadoError,
  isSolicitudStepComplete,
  normalizeCurpInput,
  validateCurpField,
  validateFechaNacimientoField,
  validateSolicitudStep,
  WIZARD_STEPS,
  type ComparacionMontoPaso6,
  type MontoReferencia,
  type SelectValue,
  type SelectorFieldKey,
  type SolicitudErrors,
  type SolicitudFormData,
} from './solicitud-form.model';


interface SolicitudFormScreenProps {
  integranteId: string;
  integranteNombre?: string;
  groupName?: string;
  integrantePosition?: number;
  integrantesTotal?: number;
  initialStep?: number;
  onSaved?: () => void;
  onBack?: () => void;
  onDataChange?: (data: { nombre?: string; telefono?: string; montoSolicitado?: number }) => void;
}




export const SolicitudFormScreen: React.FC<SolicitudFormScreenProps> = ({
  integranteId,
  integranteNombre,
  groupName,
  integrantePosition,
  integrantesTotal,
  initialStep,
  onSaved,
  onBack,
  onDataChange,
}) => {
  const { refresh: refreshPendingReviews } = usePendingReviews();
  const { run } = useProcessing();
  const documentationTheme = moduleThemes.documentation;
  const [currentStep, setCurrentStep] = useState(initialStep ?? 1);
  const [documentos, setDocumentos] = useState<DocumentoRequerido[]>(DOCUMENTOS_REQUERIDOS);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);
  const [documentUploadError, setDocumentUploadError] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<{ uri: string; titulo: string } | null>(null);
  const [documentViewer, setDocumentViewer] = useState<DocumentoViewerState | null>(null);
  const [documentCarousel, setDocumentCarousel] = useState<DocumentoCarouselState | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    uris: string[];
    documentoId: string;
    titulo: string;
  } | null>(null);
  const previewCarouselPages = useMemo<DocumentImageCarouselPage[]>(() => {
    if (!previewImage) return [];
    const esIneDoble = previewImage.uris.length === 2 && previewImage.documentoId.includes('ine');
    return previewImage.uris.map((uri, index) => ({
      uri,
      label: esIneDoble
        ? index === 0 ? 'Frente' : 'Reverso'
        : `Foto ${index + 1}`,
    }));
  }, [previewImage]);
  const [form, setForm] = useState<SolicitudFormData>({
    // Datos iniciales (pre-cargados del integrante)
    nombres: '',
    apellido_pat: '',
    apellido_mat: '',
    telefonoInicial: '',
    telefonoSecundario: '',
    montoSolicitado: '',

    fecha_nac: '',
    curp: '',
    nacionalidad: '',
    estado_nacimiento: '',
    genero: '',
    estado_civil: '',
    ocupacion: '',
    nivel_estudio: '',

    calle: '',
    numeroExterior: '',
    numeroInterior: '',
    colonia: '',
    municipio: '',
    estado: DEFAULT_STATE,
    codigoPostal: '',
    entreCalles: '',
    telefono: '',

    referencia1NombreCompleto: '',
    referencia1Parentesco: '',
    referencia1Telefono: '',
    referencia1Direccion: '',
    referencia2NombreCompleto: '',
    referencia2Parentesco: '',
    referencia2Telefono: '',
    referencia2Direccion: '',

    parejaNombreCompleto: '',
    parejaActividadEconomica: '',
    pareja_ingreso_semanal: '',

    negocioCalle: '',
    negocioNumeroExterior: '',
    negocioNumeroInterior: '',
    negocio_colonia: '',
    negocio_municipio: '',
    negocioEstado: DEFAULT_STATE,
    negocioCodigoPostal: '',
    negocioDesdeCuando: '',
    negocio_ingreso_semanal: '',
    negocio_otros_ingresos: '',
    negocio_gastos: '',
    negocio_total: '',
    negocio_giro: '',

    beneficiarioNombreCompleto: '',
    beneficiario_parentesco: '',
    beneficiario_telefono: '',
    beneficiario_direccion: '',

    tieneMedidorLuzSinAdeudo: '',
    viveMaximo5KmTesorera: '',
  });

  const [errors, setErrors] = useState<SolicitudErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fechaNacimientoInput, setFechaNacimientoInput] = useState('');
  const [isLoadingSolicitud, setIsLoadingSolicitud] = useState(true);
  const [solicitudLoadError, setSolicitudLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [integrante, setIntegrante] = useState<{
    nombre: string;
    telefono: string;
    montoSolicitado: number | null;
    montoAutorizadoAnterior?: number | null;
  } | null>(null);
  const [montoReferencia, setMontoReferencia] = useState<MontoReferencia | null>(null);
  const [montoMaximoSolicitable, setMontoMaximoSolicitable] = useState(MAX_SOLICITUD_AMOUNT);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const scrollViewRef = React.useRef<ScrollView>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const documentOperationRef = useRef<string | null>(null);

  const runSerializedSave = useCallback((operation: () => Promise<void>): Promise<void> => {
    const next = saveQueueRef.current.then(operation, operation);
    saveQueueRef.current = next.catch(() => undefined);
    return next;
  }, []);

  const comparacionMontoPaso6 = useMemo<ComparacionMontoPaso6>(() => {
    if (montoReferencia?.origen !== 'CICLO_ANTERIOR' || montoReferencia.monto == null) {
      return null;
    }

    const montoActual = Number(form.montoSolicitado);
    if (!Number.isFinite(montoActual) || montoActual <= 0 || montoActual === montoReferencia.monto) {
      return null;
    }

    return {
      tendencia: montoActual > montoReferencia.monto ? 'AUMENTA' : 'DISMINUYE',
      diferencia: Math.abs(montoActual - montoReferencia.monto),
    };
  }, [form.montoSolicitado, montoReferencia]);

  useEffect(() => {
    setCurrentStep(initialStep ?? 1);
  }, [integranteId, initialStep]);

  // Estados para colonias del domicilio
  const [coloniasDisponiblesDomicilio, setColoniasDisponiblesDomicilio] = useState<string[]>([]);
  const [loadingColoniasDomicilio, setLoadingColoniasDomicilio] = useState(false);

  // Estados para colonias del negocio
  const [coloniasDisponiblesNegocio, setColoniasDisponiblesNegocio] = useState<string[]>([]);
  const [loadingColoniasNegocio, setLoadingColoniasNegocio] = useState(false);

  // Función de auto-guardado
  const performAutoSave = useCallback(async () => {
    setAutoSaveStatus('saving');
    const datosSolicitante = compactPayload(buildIntegrantePayload(form, true));
    const datosSolicitud = buildAutoSavePayload(form, montoMaximoSolicitable);

    try {
      await runSerializedSave(async () => {
        if (Object.keys(datosSolicitante).length > 0) {
          await api.patch(`/integrantes/${integranteId}`, datosSolicitante, {
            showProcessing: false,
          });
        }
        if (Object.keys(datosSolicitud).length > 0) {
          await api.patch(`/solicitudes/integrante/${integranteId}`, datosSolicitud, {
            showProcessing: false,
          });
        }
      });

      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }
  }, [form, integranteId, montoMaximoSolicitable, runSerializedSave]);

  // Auto-guardado en tiempo real (debounced)
  useEffect(() => {
    // No guardar en la carga inicial
    if (isInitialLoadRef.current || isLoadingSolicitud) {
      return undefined;
    }

    // Limpiar timer anterior
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Configurar nuevo timer (esperar 1.5 segundos de inactividad)
    autoSaveTimerRef.current = setTimeout(() => {
      void performAutoSave();
    }, 1500);

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [form, isLoadingSolicitud, performAutoSave]); // Se ejecuta cada vez que cambia el formulario

  // Cargar solicitud existente si ya fue guardada
  useEffect(() => {
    const loadExistingSolicitud = async () => {
      let integranteData: any = null;
      let limiteMontoSolicitable = MAX_SOLICITUD_AMOUNT;

      setIsLoadingSolicitud(true);
      setSolicitudLoadError(null);
      isInitialLoadRef.current = true;
      setDocumentos(DOCUMENTOS_REQUERIDOS.map((documento) => ({ ...documento })));
      setMontoReferencia(null);

      try {
        // Cargar datos del integrante
        integranteData = await api.get<IntegranteApiResponse>(`/integrantes/${integranteId}`);
        if (integranteData) {
          setIntegrante({
            ...integranteData,
            montoSolicitado: integranteData.montoSolicitado == null
              ? null
              : Number(integranteData.montoSolicitado),
            montoAutorizadoAnterior: integranteData.montoAutorizadoAnterior == null
              ? null
              : Number(integranteData.montoAutorizadoAnterior),
          });

          const limiteApi = Number(integranteData.montoMaximoSolicitable);
          limiteMontoSolicitable = Number.isFinite(limiteApi) && limiteApi > 0
            ? limiteApi
            : MAX_SOLICITUD_AMOUNT;
          setMontoMaximoSolicitable(limiteMontoSolicitable);

          const origenReferencia = integranteData.origenMontoReferenciaPaso6
            ?? (integranteData.esRenovacion ? 'CICLO_ANTERIOR' : 'PROSPECCION');
          const montoReferenciaValor = integranteData.montoReferenciaPaso6 == null
            ? null
            : Number(integranteData.montoReferenciaPaso6);
          setMontoReferencia({
            origen: origenReferencia,
            monto: montoReferenciaValor != null && montoReferenciaValor > 0
              ? montoReferenciaValor
              : null,
          });

          // Pre-cargar datos iniciales del integrante en el formulario
          setForm((current) => ({
            ...current,
            nombres: integranteData.nombres || '',
            apellido_pat: integranteData.apellido_pat || '',
            apellido_mat: integranteData.apellido_mat || '',
            telefonoInicial: integranteData.telefono || '',
            telefonoSecundario: integranteData.telefonoSecundario || '',
            montoSolicitado: '',
          }));
        }

        try {
          const data = await api.get<SolicitudApiResponse>(`/solicitudes/integrante/${integranteId}`);
          if (data) {
            // Parsear la fecha de nacimiento de ISO a DD,MMM,YYYY para display
            const fecha_nac_display = data.fecha_nac ? formatISODateToDDMMMYYYY(data.fecha_nac) : '';

            const montoFormal = data.monto_solicitado;
            const montoInicial = data.monto_solicitado_confirmado_at && montoFormal != null
              ? String(Number(montoFormal))
              : '';

            setErrors((current) => ({
              ...current,
              montoSolicitado: getMontoSolicitadoError(
                montoInicial,
                limiteMontoSolicitable,
                false,
              ),
            }));

            setForm({
              // Datos básicos de identidad (fuente: tabla integrantes o solicitud)
              nombres: data.nombres || integranteData?.nombres || '',
              apellido_pat: integranteData?.apellido_pat || '',
              apellido_mat: integranteData?.apellido_mat || '',
              telefonoInicial: integranteData?.telefono || '',
              telefonoSecundario: integranteData?.telefonoSecundario || '',
              montoSolicitado: montoInicial,

              fecha_nac: data.fecha_nac || '',
              curp: data.curp || '',
              nacionalidad: data.nacionalidad || '',
              estado_nacimiento: data.estado_nacimiento || '',
              genero: data.genero || '',
              estado_civil: data.estado_civil || '',
              ocupacion: data.ocupacion || '',
              nivel_estudio: data.nivel_estudio || '',

              calle: data.dom_calle || '',
              numeroExterior: data.dom_num_ext || '',
              numeroInterior: data.dom_num_int || '',
              colonia: data.dom_colonia || '',
              municipio: data.dom_municipio || '',
              estado: data.dom_estado || DEFAULT_STATE,
              codigoPostal: data.dom_codigo_postal || '',
              entreCalles: data.dom_entre_calles || '',
              telefono: data.telefono || '',

              referencia1NombreCompleto: data.ref1_nombre || '',
              referencia1Parentesco: data.ref1_parentesco || '',
              referencia1Telefono: data.ref1_telefono || '',
              referencia1Direccion: data.ref1_direccion || '',
              referencia2NombreCompleto: data.ref2_nombre || '',
              referencia2Parentesco: data.ref2_parentesco || '',
              referencia2Telefono: data.ref2_telefono || '',
              referencia2Direccion: data.ref2_direccion || '',

              parejaNombreCompleto: data.pareja_nombre || '',
              parejaActividadEconomica: data.pareja_actividad || '',
              pareja_ingreso_semanal: data.pareja_ingreso_semanal ? String(data.pareja_ingreso_semanal) : '',

              negocioCalle: data.negocio_domicilio || '',
              negocioNumeroExterior: data.negocio_num_ext || '',
              negocioNumeroInterior: data.negocio_num_int || '',
              negocio_colonia: data.negocio_colonia || '',
              negocio_municipio: data.negocio_municipio || '',
              negocioEstado: data.negocio_estado || DEFAULT_STATE,
              negocioCodigoPostal: data.negocio_codigo_postal || '',
              negocioDesdeCuando: data.negocio_desde_cuando || '',
              negocio_ingreso_semanal: data.negocio_ingreso_semanal ? String(data.negocio_ingreso_semanal) : '',
              negocio_otros_ingresos: data.negocio_otros_ingresos ? String(data.negocio_otros_ingresos) : '',
              negocio_gastos: data.negocio_gastos ? String(data.negocio_gastos) : '',
              negocio_total: data.negocio_total ? String(data.negocio_total) : '',
              negocio_giro: data.negocio_giro || '',

              beneficiarioNombreCompleto: data.beneficiario_nombre || '',
              beneficiario_parentesco: data.beneficiario_parentesco || '',
              beneficiario_telefono: data.beneficiario_telefono || '',
              beneficiario_direccion: data.beneficiario_direccion || '',

              tieneMedidorLuzSinAdeudo: data.tiene_medidor_luz || '',
              viveMaximo5KmTesorera: data.vive_max_5km_tesorera || '',
            });

            setFechaNacimientoInput(fecha_nac_display);

            // Actualizar estado de documentos según los campos doc_*_ruta
            const cargarDocumentosAsync = async () => {
              const documentosActualizados = await Promise.all(
                DOCUMENTOS_REQUERIDOS.map(async (doc) => {
                  let status: DocumentStatus = doc.status;
                  let uriFrente: string | undefined;
                  let uriReverso: string | undefined;
                  const rutaDB = data[RUTAS_DOCUMENTO[doc.id]] as string | undefined;

                  if (esRutaDocumentoServidor(rutaDB)) {
                    status = 'SINCRONIZADO';
                  } else if (rutaDB?.startsWith('storage:')) {
                    status = 'PENDIENTE_SUBIR';
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
                  } else if (!doc.obligatorio) {
                    status = 'OPCIONAL';
                  } else {
                    status = 'PENDIENTE';
                  }

                   return {
                     ...doc,
                     status,
                     uriFrente,
                     uriReverso,
                     urisLocales: [uriFrente, uriReverso].filter((uri): uri is string => Boolean(uri)),
                     rutaServidor: esRutaDocumentoServidor(rutaDB) ? rutaDB : undefined,
                   };
                })
              );
              setDocumentos(documentosActualizados);

              // Las versiones anteriores de esta pantalla guardaban documentos como
               // referencias locales. Al encontrarlas, termina la subida que la usuaria ya inició.
               for (const documento of documentosActualizados) {
                 const urisLocales = documento.urisLocales?.length
                   ? documento.urisLocales
                   : [documento.uriFrente, documento.uriReverso]
                       .filter((uri): uri is string => Boolean(uri));
                 if (documento.status !== 'PENDIENTE_SUBIR' || urisLocales.length === 0) continue;
                 setUploadingDocId(documento.id);
                setDocumentos((actuales) => actuales.map((actual) =>
                  actual.id === documento.id ? { ...actual, status: 'SUBIENDO' } : actual
                ));
                try {
                   const remoto = await subirDocumentoAlServidor(
                     integranteId,
                     documento.id,
                     urisLocales,
                   );
                  setDocumentos((actuales) => actuales.map((actual) =>
                    actual.id === documento.id
                      ? { ...actual, status: 'SINCRONIZADO', rutaServidor: remoto.ruta }
                      : actual
                  ));
                } catch {
                  setDocumentos((actuales) => actuales.map((actual) =>
                    actual.id === documento.id ? { ...actual, status: 'ERROR' } : actual
                  ));
                }
              }
              setUploadingDocId(null);
            };

            await cargarDocumentosAsync();
          } else if ((initialStep ?? 1) > 1) {
            throw new Error(
              'La solicitud reporta avances, pero el servidor no devolvió sus datos. Intenta nuevamente.',
            );
          }
        } catch (solicitudError) {
          if (solicitudError instanceof ApiError && solicitudError.status === 404) {
          } else {
            throw solicitudError;
          }
        }
      } catch (error) {
        setSolicitudLoadError(
          error instanceof Error
            ? error.message
            : 'No se pudo recuperar la información guardada.',
        );
      } finally {
        setIsLoadingSolicitud(false);
        // Marcar que la carga inicial terminó (para activar auto-guardado)
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 500);
      }
    };

    loadExistingSolicitud();
  }, [integranteId, initialStep, loadAttempt]);

  // Cargar colonias del DOMICILIO desde el API cuando cambia el código postal
  useEffect(() => {
    const cargarColoniasDomicilio = async () => {
      if (form.codigoPostal.length !== 5) {
        setColoniasDisponiblesDomicilio([]);
        return;
      }

      setLoadingColoniasDomicilio(true);
      try {
        const data = await api.get<CodigoPostalApiResponse>(
          `/codigos-postales/colonias?codigo=${form.codigoPostal}`,
          { showProcessing: false },
        );
        setColoniasDisponiblesDomicilio(data.colonias || []);
        // Llenar automáticamente el municipio
        if (data.municipio) {
          setForm((prev) => ({ ...prev, municipio: data.municipio }));
        }
      } catch {
        setColoniasDisponiblesDomicilio([]);
      } finally {
        setLoadingColoniasDomicilio(false);
      }
    };

    cargarColoniasDomicilio();
  }, [form.codigoPostal]);

  // Cargar colonias del NEGOCIO desde el API cuando cambia el código postal
  useEffect(() => {
    const cargarColoniasNegocio = async () => {
      if (form.negocioCodigoPostal.length !== 5) {
        setColoniasDisponiblesNegocio([]);
        return;
      }

      setLoadingColoniasNegocio(true);
      try {
        const data = await api.get<CodigoPostalApiResponse>(
          `/codigos-postales/colonias?codigo=${form.negocioCodigoPostal}`,
          { showProcessing: false },
        );
        setColoniasDisponiblesNegocio(data.colonias || []);
        // Llenar automáticamente el municipio del negocio
        if (data.municipio) {
          setForm((prev) => ({ ...prev, negocio_municipio: data.municipio }));
        }
      } catch {
        setColoniasDisponiblesNegocio([]);
      } finally {
        setLoadingColoniasNegocio(false);
      }
    };

    cargarColoniasNegocio();
  }, [form.negocioCodigoPostal]);

  // NO validar/limpiar colonias - permitir que se mantengan aunque no estén en la lista actual
  // Esto evita que se borren colonias ya guardadas cuando se recarga el formulario
  // useEffect(() => {
  //   if (coloniasDisponiblesDomicilio.length > 0 && form.colonia && !coloniasDisponiblesDomicilio.includes(form.colonia)) {
  //     updateField('colonia', '');
  //   }
  // }, [coloniasDisponiblesDomicilio]);

  // useEffect(() => {
  //   if (coloniasDisponiblesNegocio.length > 0 && form.negocio_colonia && !coloniasDisponiblesNegocio.includes(form.negocio_colonia)) {
  //     updateField('negocio_colonia', '');
  //   }
  // }, [coloniasDisponiblesNegocio]);

  useEffect(() => {
    if (form.nacionalidad !== 'EXTRANJERA') {
      return;
    }

    setForm((current) => {
      if (!current.estado_nacimiento) {
        return current;
      }

      return {
        ...current,
        estado_nacimiento: '',
      };
    });

    setErrors((current) => ({
      ...current,
      estado_nacimiento: undefined,
    }));
  }, [form.nacionalidad]);

  useEffect(() => {
    const ingresoSemanal = Number(form.negocio_ingreso_semanal || 0);
    const otrosIngresos = Number(form.negocio_otros_ingresos || 0);
    const gastos = Number(form.negocio_gastos || 0);
    const totalCalculado = ingresoSemanal + otrosIngresos - gastos;
    const totalString = String(totalCalculado);

    setForm((current) => {
      if (current.negocio_total === totalString) {
        return current;
      }

      return {
        ...current,
        negocio_total: totalString,
      };
    });

    setErrors((current) => {
      if (!current.negocio_total) {
        return current;
      }

      return {
        ...current,
        negocio_total: undefined,
      };
    });
  }, [form.negocio_ingreso_semanal, form.negocio_otros_ingresos, form.negocio_gastos]);


  const updateField = (field: string, value: string) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    if (['nombres', 'apellido_pat', 'apellido_mat'].includes(field)) {
      onDataChange?.({
        nombre: [nextForm.nombres, nextForm.apellido_pat, nextForm.apellido_mat]
          .filter(Boolean)
          .join(' '),
      });
    } else if (field === 'telefonoInicial') {
      onDataChange?.({ telefono: value });
    } else if (field === 'montoSolicitado') {
      const monto = Number(value);
      onDataChange?.({ montoSolicitado: Number.isFinite(monto) ? monto : 0 });
    }
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const updateOption = (field: SelectorFieldKey, value: SelectValue) => {
    updateField(field, value.toUpperCase());
  };

  const updatePhoneField = (
    field: 'telefono' | 'referencia1Telefono' | 'referencia2Telefono' | 'beneficiario_telefono',
    value: string,
  ) => {
    updateField(field, normalizePhone(value));
  };

  const updateMoneyField = (
    field: 'pareja_ingreso_semanal' | 'negocio_ingreso_semanal' | 'negocio_otros_ingresos' | 'negocio_gastos' | 'negocio_total',
    value: string,
  ) => {
    updateField(field, normalizeDigits(value));
  };

  const updateMontoSolicitado = (value: string) => {
    const montoNormalizado = normalizeDigits(value);
    setForm((current) => ({ ...current, montoSolicitado: montoNormalizado }));
    setErrors((current) => ({
      ...current,
      montoSolicitado: getMontoSolicitadoError(
        montoNormalizado,
        montoMaximoSolicitable,
        false,
      ),
    }));
  };

  const handleCurpBlur = () => {
    setErrors((current) => ({
      ...current,
      curp: validateCurpField(form.curp),
    }));
  };

  const handleCurpChange = (value: string) => {
    updateField('curp', normalizeCurpInput(value));
  };

  const handleSelectorSelect = (field: SelectorFieldKey, value: string) => {
    updateOption(field, value);
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const isStepComplete = (step: number): boolean => (
    isSolicitudStepComplete(step, form, documentos, montoMaximoSolicitable)
  );

  // Validación por paso
  const validateCurrentStep = useCallback((): boolean => {
    const nextErrors = validateSolicitudStep(currentStep, form, montoMaximoSolicitable);

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [currentStep, form, montoMaximoSolicitable]);

  const saveCurrentStep = useCallback(async () => {
    if (isLoadingSolicitud || solicitudLoadError) {
      return;
    }

    if (currentStep === 6) {
      const montoError = getMontoSolicitadoError(form.montoSolicitado, montoMaximoSolicitable);
      if (montoError) {
        setErrors((current) => ({ ...current, montoSolicitado: montoError }));
        throw new Error(montoError);
      }
    }

    // Cada navegación persiste únicamente el paso visible. Así, retroceder desde
    // Documentación nunca puede reemplazar los seis pasos anteriores con vacíos.
    await runSerializedSave(async () => {
      if (currentStep === 1) {
        await api.patch(`/integrantes/${integranteId}`, buildIntegrantePayload(form, true));
      } else if (currentStep === 2) {
        await api.patch(`/integrantes/${integranteId}`, buildIntegrantePayload(form, false));
      }

      const solicitudData = buildSolicitudStepPayload(form, currentStep);
      if (currentStep === 2) {
        const coordenadas = await geocodificarDomicilio({
          calle: form.calle,
          numeroExterior: form.numeroExterior,
          colonia: form.colonia,
          municipio: form.municipio,
          estado: form.estado,
          codigoPostal: form.codigoPostal,
        });
        Object.assign(solicitudData, {
          dom_latitud: coordenadas?.latitud ?? null,
          dom_longitud: coordenadas?.longitud ?? null,
          dom_geocodificacion_fuente: coordenadas ? 'GEOCODIFICADOR_DISPOSITIVO' : null,
          dom_geocodificacion_fecha: coordenadas ? new Date().toISOString() : null,
        });
      }
      if (Object.keys(solicitudData).length > 0) {
        await api.patch(`/solicitudes/integrante/${integranteId}`, solicitudData);
      }
    });
  }, [currentStep, form, integranteId, isLoadingSolicitud, montoMaximoSolicitable, runSerializedSave, solicitudLoadError]);

  const handleContinuar = useCallback(async () => {
    if (validateCurrentStep()) {
      // Guardar el paso actual antes de avanzar
      await saveCurrentStep();
      // Scroll al inicio del formulario
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length));
    }
  }, [currentStep, saveCurrentStep]);

  const handleAtras = useCallback(async () => {
    // Guardar el paso actual antes de retroceder
    try {
      await saveCurrentStep();
    } catch (error) {
      Alert.alert(
        'No se pudo guardar',
        error instanceof Error ? error.message : 'Revisa tu conexión antes de continuar.',
      );
      return;
    }
    // Scroll al inicio del formulario
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [saveCurrentStep]);

  const iniciarOperacionDocumento = (documentoId: string): boolean => {
    if (documentOperationRef.current !== null) {
      return false;
    }

    documentOperationRef.current = documentoId;
    setUploadingDocId(documentoId);
    return true;
  };

  const finalizarOperacionDocumento = (documentoId: string) => {
    if (documentOperationRef.current === documentoId) {
      documentOperationRef.current = null;
    }
    setUploadingDocId((actual) => actual === documentoId ? null : actual);
  };

  const handleSubirDocumento = async (documentoId: string) => {
    if (!iniciarOperacionDocumento(documentoId)) {
      return;
    }
    setDocumentUploadError(null);

    try {
      const documentoPendiente = documentos.find((documento) => documento.id === documentoId);
      const urisPendientes = documentoPendiente?.urisLocales?.length
        ? documentoPendiente.urisLocales
        : [documentoPendiente?.uriFrente, documentoPendiente?.uriReverso]
            .filter((uri): uri is string => Boolean(uri));
      if (
        urisPendientes.length > 0 &&
        documentoPendiente?.status === 'PENDIENTE_SUBIR'
      ) {
        finalizarOperacionDocumento(documentoId);
        await guardarDocumento(
          documentoId,
          urisPendientes,
        );
        return;
      }

      // Solicitar permisos para acceder a la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar imágenes.');
        finalizarOperacionDocumento(documentoId);
        return;
      }

      // Para INEs, capturar frente y reverso
      const esINE = documentoId === 'ine_integrante' || documentoId === 'ine_beneficiario';

      if (esINE) {
        // Capturar frente del INE
        Alert.alert(
          'INE - Frente',
          'Selecciona la foto del FRENTE de la INE',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => finalizarOperacionDocumento(documentoId) },
            {
              text: 'Seleccionar',
              onPress: () => {
                // El selector nativo debe abrirse sin el overlay global; algunos
                // dispositivos dejan ese modal encima al volver de la galería.
                void (async () => {
                  const frenteResult = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: false,
                    quality: 0.9,
                    base64: false,
                    aspect: [1.6, 1], // Proporción de INE
                  });

                  if (frenteResult.canceled || !frenteResult.assets[0]) {
                    finalizarOperacionDocumento(documentoId);
                    return;
                  }

                  // Ahora capturar reverso
                  Alert.alert(
                    'INE - Reverso',
                    'Ahora selecciona la foto del REVERSO de la INE',
                    [
                      { text: 'Cancelar', style: 'cancel', onPress: () => finalizarOperacionDocumento(documentoId) },
                      {
                        text: 'Seleccionar',
                        onPress: () => {
                          void (async () => {
                            const reversoResult = await ImagePicker.launchImageLibraryAsync({
                              mediaTypes: ['images'],
                              allowsEditing: false,
                              quality: 0.9,
                              base64: false,
                              aspect: [1.6, 1], // Proporción de INE
                            });

                            if (reversoResult.canceled || !reversoResult.assets[0]) {
                              finalizarOperacionDocumento(documentoId);
                              return;
                            }

                            // Mostrar previsualización antes de guardar
                            setPreviewImage({
                              uris: [frenteResult.assets[0].uri, reversoResult.assets[0].uri],
                              documentoId,
                              titulo: 'INE (Frente y Reverso)',
                            });
                            finalizarOperacionDocumento(documentoId);
                          })();
                        },
                      },
                    ],
                  );
                })();
              },
            }
          ]
        );
      } else {
        const permiteMultiples = documentoId === 'comprobante_linea_credito';
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          allowsMultipleSelection: permiteMultiples,
          selectionLimit: permiteMultiples ? 0 : 1,
          orderedSelection: permiteMultiples,
          quality: 0.9,
          base64: false,
        });

        if (result.canceled || result.assets.length === 0) {
          finalizarOperacionDocumento(documentoId);
          return;
        }

        // Mostrar previsualización antes de guardar
        const nombreDoc = DOCUMENTOS_REQUERIDOS.find(d => d.id === documentoId)?.nombre || 'Documento';
        setPreviewImage({
          uris: result.assets.map((asset) => asset.uri),
          documentoId,
          titulo: nombreDoc,
        });
        finalizarOperacionDocumento(documentoId);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al subir el documento');
      finalizarOperacionDocumento(documentoId);
    }
  };

  const handleConfirmarDocumento = async () => {
    if (!previewImage) return;

    const guardado = await guardarDocumento(
      previewImage.documentoId,
      previewImage.uris,
    );
    if (guardado) {
      setPreviewImage(null);
    }
  };

  const handleCancelarDocumento = () => {
    if (documentOperationRef.current !== null) {
      return;
    }
    setDocumentUploadError(null);
    setPreviewImage(null);
  };

  const guardarDocumento = async (
    documentoId: string,
    uris: string[],
  ): Promise<boolean> => {
    if (!iniciarOperacionDocumento(documentoId)) {
      return false;
    }

    setDocumentos((prev) => prev.map((doc) =>
      doc.id === documentoId
        ? {
            ...doc,
            status: 'SUBIENDO',
            uriFrente: uris[0],
            uriReverso: uris[1],
            urisLocales: uris,
          }
        : doc
    ));

    try {
      const remoto = await subirDocumentoAlServidor(integranteId, documentoId, uris);
      setDocumentos((prev) =>
        prev.map((doc) =>
          doc.id === documentoId
            ? {
                ...doc,
                status: 'SINCRONIZADO',
                uriFrente: uris[0],
                uriReverso: uris[1],
                urisLocales: uris,
                rutaServidor: remoto.ruta,
              }
            : doc
        )
      );

      setDocumentUploadError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Revisa tu conexión e intenta nuevamente.';
      setDocumentos((prev) => prev.map((doc) =>
        doc.id === documentoId ? { ...doc, status: 'ERROR' } : doc
      ));
      setDocumentUploadError(message);
      if (!previewImage || previewImage.documentoId !== documentoId) {
        Alert.alert('No se pudo subir', message);
      }
      return false;
    } finally {
      finalizarOperacionDocumento(documentoId);
    }
  };

  const handleVerDocumento = async (documento: DocumentoRequerido) => {
    if (openingDocId !== null) return;
    setOpeningDocId(documento.id);
    try {
      const urisLocales = documento.urisLocales?.length
        ? documento.urisLocales
        : [documento.uriFrente, documento.uriReverso]
            .filter((uri): uri is string => Boolean(uri));

      if (documento.id === 'comprobante_linea_credito' && urisLocales.length > 0) {
        setDocumentCarousel({
          title: documento.nombre,
          pages: urisLocales.map((uri, index) => ({
            uri,
            label: `Foto ${index + 1}`,
          })),
        });
        return;
      }

      if (documento.uriFrente && documento.uriReverso) {
        Alert.alert(
          documento.nombre,
          'Selecciona qué lado deseas ver',
          [
            {
              text: 'Frente',
              onPress: () => setViewingImage({ uri: documento.uriFrente!, titulo: `${documento.nombre} - Frente` }),
            },
            {
              text: 'Reverso',
              onPress: () => setViewingImage({ uri: documento.uriReverso!, titulo: `${documento.nombre} - Reverso` }),
            },
            {
              text: 'Cancelar',
              style: 'cancel',
            },
          ]
        );
        return;
      }

      if (documento.uriFrente) {
        setViewingImage({ uri: documento.uriFrente, titulo: documento.nombre });
        return;
      }

      if (!documento.rutaServidor) return;
      const [remoto, headers] = await Promise.all([
        api.get<DocumentoRemoto>(documento.rutaServidor, { showProcessing: false }),
        getAuthorizationHeaders(),
      ]);
      if (documento.id === 'comprobante_linea_credito') {
        const imagenes = remoto.archivos.filter((archivo) => archivo.mime_type.startsWith('image/'));
        if (imagenes.length === 0) {
          throw new Error('El comprobante no contiene imágenes que puedan mostrarse.');
        }
        setDocumentCarousel({
          title: documento.nombre,
          pages: imagenes.map((archivo, index) => ({
            uri: apiUrl(archivo.url),
            headers,
            label: `Foto ${index + 1}`,
          })),
        });
        return;
      }
      setDocumentViewer({
        title: documento.nombre,
        pages: remoto.archivos.map((archivo) => ({
          uri: apiUrl(archivo.url),
          headers,
          mimeType: archivo.mime_type,
        })),
      });
    } catch (error) {
      Alert.alert(
        'No se pudo abrir',
        error instanceof Error ? error.message : 'Intenta nuevamente.',
      );
    } finally {
      setOpeningDocId((actual) => actual === documento.id ? null : actual);
    }
  };

  useEffect(() => {
    if (!previewImage && !documentCarousel) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (documentOperationRef.current !== null) return true;
      if (documentCarousel) {
        setDocumentCarousel(null);
      } else {
        setDocumentUploadError(null);
        setPreviewImage(null);
      }
      return true;
    });

    return () => subscription.remove();
  }, [documentCarousel, previewImage]);

  const handleMarcarCapturado = async () => {
    setIsSubmitting(true);
    setAutoSaveStatus('saving');

    try {
      // El auto-save ya guardó todo. Solo intentamos cambiar el estado.
      // El backend validará que tenga los 7 pasos completos y devolverá
      // pasosIncompletos y camposFaltantes si falta algo.

      await api.patch(`/integrantes/${integranteId}/estado`, { estado: 'SUJETA_CREDITO' });
      await refreshPendingReviews();

      setAutoSaveStatus('saved');
      Alert.alert('Éxito', 'Solicitud marcada como Sujeta a Crédito');
      onSaved?.();
    } catch (error) {
      setAutoSaveStatus('error');
      const details = error instanceof ApiError && typeof error.data === 'object' && error.data !== null
        ? error.data as {
            message?: string;
            pasosIncompletos?: string[];
            camposFaltantes?: Record<string, string[]>;
          }
        : undefined;

      // Mostrar mensaje detallado si el backend rechazó por pasos incompletos
      if (details?.pasosIncompletos) {
        const pasos = details.pasosIncompletos.join('\n');
        const campos = Object.entries(details.camposFaltantes ?? {})
          .map(([paso, campos]) => `${paso}: ${campos.join(', ')}`)
          .join('\n');

        Alert.alert(
          'Solicitud Incompleta',
          `Faltan los siguientes pasos:\n\n${pasos}\n\nCampos faltantes:\n${campos}`,
          [{ text: 'Entendido' }]
        );
      } else {
        Alert.alert(
          'Error',
          details?.message || (error instanceof Error ? error.message : 'Error inesperado'),
        );
      }
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }
  };



  const handleLlamarIntegrante = (telefono: string, nombre: string) => {
    llamar(telefono, nombre);
  };

  // Guardar automáticamente antes de salir
  const handleBack = async () => {
    // Guardar antes de salir
    try {
      await saveCurrentStep();
    } catch {
      // Si falla el guardado, igual salir
    }

    // Ejecutar callback de salida
    onBack?.();
  };

  const progressPercentage = (currentStep / WIZARD_STEPS.length) * 100;

  // Componente interno para campos de teléfono con ícono de llamada
  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={handleBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Capturar Solicitud" moduleTheme="documentation" />

      {/* Banner del grupo */}
      <View style={styles.grupoBanner}>
        <Text allowFontScaling={false} style={styles.grupoBannerText}>{groupName || 'Cargando grupo...'}</Text>
      </View>

      {isLoadingSolicitud ? (
        <View style={styles.loadStateContainer}>
          <ActivityIndicator size="large" color={documentationTheme.primary} />
          <Text allowFontScaling={false} style={styles.loadStateTitle}>Recuperando información guardada</Text>
          <Text allowFontScaling={false} style={styles.loadStateText}>Espera antes de consultar o modificar los pasos.</Text>
        </View>
      ) : solicitudLoadError ? (
        <View style={styles.loadStateContainer}>
          <Text allowFontScaling={false} style={styles.loadStateTitle}>No se pudo abrir la solicitud</Text>
          <Text allowFontScaling={false} style={styles.loadStateText}>{solicitudLoadError}</Text>
          <PrimaryButton title="Intentar nuevamente" onPress={() => setLoadAttempt((attempt) => attempt + 1)} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
        >
        {/* Tarjeta del integrante */}
        <View style={styles.fixedSolicitanteContainer}>
          <Card style={styles.integranteCard}>
            <View style={styles.integranteHeader}>
              {/* Nombre a la izquierda - Actualización inmediata */}
              <Text allowFontScaling={false} style={styles.integranteName}>
                {integrante?.nombre || integranteNombre || 'Sin nombre'}
              </Text>

              {/* Número a la derecha */}
              {integrantePosition && integrantesTotal && (
                <Text allowFontScaling={false} style={styles.positionText}>
                  {integrantePosition}/{integrantesTotal}
                </Text>
              )}
            </View>

            {/* Teléfono e importes del ciclo */}
            {integrante && (
              <>
                <View style={styles.contactInfoRow}>
                  {/* Teléfono - Ícono fuera del recuadro celeste */}
                  <View style={styles.phoneRowContainer}>
                    <TouchableOpacity
                      style={styles.phoneIconButton}
                      onPress={() => handleLlamarIntegrante(integrante.telefono, integrante.nombre)}
                    >
                      <Text allowFontScaling={false} style={styles.phoneIcon}>📞</Text>
                    </TouchableOpacity>
                    <View style={styles.phoneDisplayContainer}>
                      <Text allowFontScaling={false} style={styles.phoneText}>{formatPhone(integrante.telefono ?? '')}</Text>
                    </View>
                  </View>
                </View>
                <CreditAmountsSummary
                  previousAmount={integrante.montoAutorizadoAnterior}
                  requestedAmount={
                    form.montoSolicitado.trim()
                      && Number.isFinite(Number(form.montoSolicitado))
                      && Number(form.montoSolicitado) > 0
                      ? Number(form.montoSolicitado)
                      : null
                  }
                />
              </>
            )}
          </Card>
        </View>

        {/* Barra de progreso del wizard */}
        <View style={styles.wizardProgressContainer}>
          <View style={styles.wizardHeaderOneLine}>
            <Text allowFontScaling={false} style={styles.wizardStepTitleCompact}>
              {WIZARD_STEPS[currentStep - 1].title}
            </Text>
            <Text allowFontScaling={false} style={styles.wizardStepTextCompact}>
              Paso {currentStep} de {WIZARD_STEPS.length}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {/* Indicador de autosave */}
        <View style={styles.autoSaveIndicatorContainer}>
          {autoSaveStatus === 'saving' && (
            <Text allowFontScaling={false} style={styles.autoSaveTextSaving}>Guardando...</Text>
          )}
          {autoSaveStatus === 'saved' && (
            <Text allowFontScaling={false} style={styles.autoSaveTextSaved}>Guardado ✓</Text>
          )}
          {autoSaveStatus === 'error' && (
            <Text allowFontScaling={false} style={styles.autoSaveTextError}>Error al guardar</Text>
          )}
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => Keyboard.dismiss()}
        >
          <Card>
            {/* PASO 1: INFORMACIÓN PERSONAL */}
            {currentStep === 1 && (
              <SolicitudInformacionPersonalStep
                values={{
                  nombres: form.nombres,
                  apellidoPat: form.apellido_pat,
                  apellidoMat: form.apellido_mat,
                  telefono: form.telefonoInicial,
                  fechaNacimientoInput,
                  curp: form.curp,
                  genero: form.genero,
                  estadoCivil: form.estado_civil,
                  nivelEstudio: form.nivel_estudio,
                  nacionalidad: form.nacionalidad,
                  estadoNacimiento: form.estado_nacimiento,
                  ocupacion: form.ocupacion,
                }}
                errors={errors}
                onFieldChange={updateField}
                onFechaNacimientoChange={(displayValue, isoValue) => {
                  setFechaNacimientoInput(displayValue);
                  if (isoValue == null) return;
                  updateField('fecha_nac', isoValue);
                  setErrors((currentErrors) => ({
                    ...currentErrors,
                    fecha_nac: validateFechaNacimientoField(isoValue),
                  }));
                }}
                onCurpChange={handleCurpChange}
                onCurpBlur={handleCurpBlur}
                onSelect={handleSelectorSelect}
              />
            )}

            {/* PASO 2: DOMICILIO PARTICULAR */}
            {currentStep === 2 && (
              <SolicitudDomicilioStep
                values={{
                  calle: form.calle,
                  numeroExterior: form.numeroExterior,
                  numeroInterior: form.numeroInterior,
                  entreCalles: form.entreCalles,
                  codigoPostal: form.codigoPostal,
                  colonia: form.colonia,
                  municipio: form.municipio,
                  telefono: form.telefonoInicial,
                  telefonoSecundario: form.telefonoSecundario,
                }}
                errors={errors}
                coloniasDisponibles={coloniasDisponiblesDomicilio}
                loadingColonias={loadingColoniasDomicilio}
                nombreIntegrante={integranteNombre || form.nombres || 'Integrante'}
                onFieldChange={updateField}
                onSelect={handleSelectorSelect}
              />
            )}

            {/* PASO 3: REFERENCIAS */}
            {currentStep === 3 && (
              <SolicitudReferenciasStep
                referencia1={{
                  nombreCompleto: form.referencia1NombreCompleto,
                  parentesco: form.referencia1Parentesco,
                  telefono: form.referencia1Telefono,
                  direccion: form.referencia1Direccion,
                }}
                referencia2={{
                  nombreCompleto: form.referencia2NombreCompleto,
                  parentesco: form.referencia2Parentesco,
                  telefono: form.referencia2Telefono,
                  direccion: form.referencia2Direccion,
                }}
                pareja={{
                  nombreCompleto: form.parejaNombreCompleto,
                  actividadEconomica: form.parejaActividadEconomica,
                  ingresoSemanal: form.pareja_ingreso_semanal,
                }}
                errors={errors}
                onFieldChange={updateField}
                onPhoneChange={updatePhoneField}
                onMoneyChange={updateMoneyField}
                onSelect={handleSelectorSelect}
              />
            )}

            {/* PASO 4: NEGOCIO O TRABAJO */}
            {currentStep === 4 && (
              <SolicitudNegocioStep
                values={{
                  calle: form.negocioCalle,
                  numeroExterior: form.negocioNumeroExterior,
                  numeroInterior: form.negocioNumeroInterior,
                  codigoPostal: form.negocioCodigoPostal,
                  colonia: form.negocio_colonia,
                  municipio: form.negocio_municipio,
                  desdeCuando: form.negocioDesdeCuando,
                  giro: form.negocio_giro,
                  ingresoSemanal: form.negocio_ingreso_semanal,
                  otrosIngresos: form.negocio_otros_ingresos,
                  gastos: form.negocio_gastos,
                  total: form.negocio_total,
                }}
                errors={errors}
                coloniasDisponibles={coloniasDisponiblesNegocio}
                loadingColonias={loadingColoniasNegocio}
                onFieldChange={updateField}
                onMoneyChange={updateMoneyField}
                onSelect={handleSelectorSelect}
              />
            )}

            {/* PASO 5: BENEFICIARIO */}
            {currentStep === 5 && (
              <SolicitudBeneficiarioStep
                nombreCompleto={form.beneficiarioNombreCompleto}
                parentesco={form.beneficiario_parentesco}
                telefono={form.beneficiario_telefono}
                direccion={form.beneficiario_direccion}
                errors={{
                  nombreCompleto: errors.beneficiarioNombreCompleto,
                  parentesco: errors.beneficiario_parentesco,
                  telefono: errors.beneficiario_telefono,
                  direccion: errors.beneficiario_direccion,
                }}
                onNombreCompletoChange={(value) => updateField('beneficiarioNombreCompleto', value)}
                onParentescoChange={(value) => handleSelectorSelect('beneficiario_parentesco', value)}
                onTelefonoChange={(value) => updatePhoneField('beneficiario_telefono', value)}
                onDireccionChange={(value) => updateField('beneficiario_direccion', value)}
              />
            )}

            {/* PASO 6: VALIDACIONES Y MONTO */}
            {currentStep === 6 && (
              <SolicitudValidacionesStep
                tieneMedidorLuzSinAdeudo={form.tieneMedidorLuzSinAdeudo}
                viveMaximo5KmTesorera={form.viveMaximo5KmTesorera}
                fechaNacimiento={form.fecha_nac}
                montoReferencia={montoReferencia}
                comparacionMonto={comparacionMontoPaso6}
                montoMaximoSolicitable={montoMaximoSolicitable}
                montoSolicitado={form.montoSolicitado}
                errors={{
                  tieneMedidorLuzSinAdeudo: errors.tieneMedidorLuzSinAdeudo,
                  viveMaximo5KmTesorera: errors.viveMaximo5KmTesorera,
                  montoSolicitado: errors.montoSolicitado,
                }}
                onTieneMedidorChange={(value) => handleSelectorSelect('tieneMedidorLuzSinAdeudo', value)}
                onViveMaximo5KmChange={(value) => handleSelectorSelect('viveMaximo5KmTesorera', value)}
                onMontoSolicitadoChange={updateMontoSolicitado}
              />
            )}

            {/* PASO 7: DOCUMENTACIÓN */}
            {currentStep === 7 && (
              <SolicitudDocumentacionStep
                documentos={documentos}
                openingDocId={openingDocId}
                uploadingDocId={uploadingDocId}
                onView={(documento) => void handleVerDocumento(documento)}
                onUpload={(documentoId) => void handleSubirDocumento(documentoId)}
              />
            )}
          </Card>
        </ScrollView>

        {/* Botones de navegación fijos en la parte inferior */}
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                void run(handleAtras, 'Guardando…');
              }}
              activeOpacity={0.8}
            >
              <Text allowFontScaling={false} style={styles.backButtonText}>← Atrás</Text>
            </TouchableOpacity>
          )}

          {currentStep < WIZARD_STEPS.length ? (
            <TouchableOpacity
              style={[
                styles.continueButton,
                !isStepComplete(currentStep) && styles.continueButtonIncomplete
              ]}
              onPress={() => {
                void run(handleContinuar, 'Guardando…');
              }}
              disabled={!isStepComplete(currentStep)}
              activeOpacity={0.8}
            >
              <Text allowFontScaling={false} style={styles.continueButtonText}>Continuar →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.continueButton,
                (!isStepComplete(currentStep) || isSubmitting) && styles.continueButtonIncomplete
              ]}
              onPress={() => {
                void run(handleMarcarCapturado, 'Guardando…');
              }}
              disabled={!isStepComplete(currentStep) || isSubmitting}
              activeOpacity={0.8}
            >
              <Text allowFontScaling={false} style={styles.continueButtonText}>
                {isSubmitting ? 'Guardando...' : 'COMPLETO ✓'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        </KeyboardAvoidingView>
      )}

      <SolicitudDocumentOverlays
        viewingImage={viewingImage}
        previewImage={previewImage}
        previewCarouselPages={previewCarouselPages}
        documentCarousel={documentCarousel}
        documentViewer={documentViewer}
        uploadingDocId={uploadingDocId}
        documentUploadError={documentUploadError}
        onCloseViewingImage={() => setViewingImage(null)}
        onCancelPreview={handleCancelarDocumento}
        onConfirmPreview={() => void handleConfirmarDocumento()}
        onCloseCarousel={() => setDocumentCarousel(null)}
        onCloseViewer={() => setDocumentViewer(null)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  loadStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadStateTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  loadStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: { padding: spacing.lg, gap: spacing.md, paddingBottom: 400 },
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
    color: '#FDE047',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fixedSolicitanteContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  integranteCard: {
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: '#000000',
    marginBottom: 0,
  },
  integranteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
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
    color: '#666',
    textAlign: 'right',
  },
  contactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    color: colors.primary,
    flex: 1,
  },
  wizardStepTextCompact: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  wizardHeader: {
    marginBottom: spacing.sm,
  },
  wizardStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  wizardStepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FDE047',
    borderRadius: radius.pill,
  },
  autoSaveIndicatorContainer: {
    minHeight: 28,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  autoSaveTextSaving: {
    ...typography.caption,
    color: '#666',
    fontWeight: '600',
  },
  autoSaveTextSaved: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  autoSaveTextError: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
  navigationButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButton: {
    flex: 1,
    backgroundColor: moduleThemes.documentation.headerBg,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonIncomplete: {
    backgroundColor: '#A8C5B5',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: moduleThemes.documentation.headerBg,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: moduleThemes.documentation.headerBg,
    fontSize: 16,
    fontWeight: '600',
  },
});
