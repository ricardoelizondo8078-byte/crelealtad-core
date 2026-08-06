import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader, Card, DatePickerField, FormField, PrimaryButton, ScreenContainer, ScreenTitleBar, SecondaryButton, SelectorField, StickySectionHeader } from '../../components/ui';
import { apiUrl } from '../../config/api';
import { api } from '../../services/api-client';
import {
  ANTIGUEDAD_NEGOCIO_OPTIONS,
  DEFAULT_STATE,
  ESTADO_CIVIL_OPTIONS,
  ESTADOS_MEXICO_OPTIONS,
  GENERO_OPTIONS,
  NACIONALIDADES_OPTIONS,
  NUEVO_LEON_MUNICIPALITIES,
  NIVEL_ESTUDIO_OPTIONS,
  PARENTESCO_OPTIONS,
  findPostalCodeEntry,
  getColoniasByPostalCode,
} from '../../catalogs';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  formatDateDDMMYYYY,
  formatISODateToDDMMYYYY,
  formatISODateToDDMMMYYYY,
  formatPhone,
  normalizeDigits,
  normalizePhone,
  normalizeUppercaseLettersOnly,
  normalizeUppercaseText,
  toISODateFromDDMMYYYY,
  validatePhone10,
  validateRealDate,
} from '../../utils/input';
import { llamar } from '../../utils/phone';
import { MAX_SOLICITUD_AMOUNT } from '../../config/parameters';
import { validateCURP } from '../../utils/validation';

type SelectValue = string;
type SelectorFieldKey =
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
  | 'viveMaximo5KmTesorera'
  | 'tiene_menos_70_anios';

interface SolicitudFormScreenProps {
  integranteId: string;
  integranteNombre?: string;
  groupName?: string;
  integrantePosition?: number;
  integrantesTotal?: number;
  initialStep?: number;
  onSaved?: () => void;
  onSavedGoToDocumentos?: () => void;
  onBack?: () => void;
  onDataChange?: (data: { nombre?: string; telefono?: string; montoSolicitado?: number }) => void;
}

interface SolicitudErrors {
  [key: string]: string | undefined;
}

const yesNoOptions = ['SI', 'NO'] as const;

const normalizeCurpInput = (value: string): string => value.replace(/\s+/g, '').toUpperCase().slice(0, 18);

// Definición de pasos del wizard
const WIZARD_STEPS = [
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

// Tipos de documentos requeridos
type DocumentStatus = 'PENDIENTE' | 'CARGADO' | 'OPCIONAL';

interface DocumentoRequerido {
  id: string;
  nombre: string;
  obligatorio: boolean;
  status: DocumentStatus;
  uriFrente?: string;  // URI local de la imagen frente
  uriReverso?: string; // URI local de la imagen reverso (solo para INEs)
}

const DOCUMENTOS_REQUERIDOS: DocumentoRequerido[] = [
  { id: 'ine_integrante', nombre: 'INE Integrante', obligatorio: true, status: 'PENDIENTE' },
  { id: 'comprobante_domicilio', nombre: 'Comprobante de Domicilio', obligatorio: true, status: 'PENDIENTE' },
  { id: 'ine_beneficiario', nombre: 'INE Beneficiario', obligatorio: true, status: 'PENDIENTE' },
  { id: 'solicitud_firmada', nombre: 'Solicitud Firmada', obligatorio: true, status: 'PENDIENTE' },
  { id: 'comprobante_linea_credito', nombre: 'Comprobante Línea de Crédito', obligatorio: false, status: 'OPCIONAL' },
];

const PhoneFieldWithCall = React.memo(({
  value,
  onChange,
  placeholder = 'Teléfono',
  nombre,
  relacion
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  nombre?: string;
  relacion?: string;
}) => {
  const digitos = value?.replace(/\D/g, '') ?? '';
  const esValido = digitos.length === 10;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <TextInput allowFontScaling={false}
        style={[{
          borderWidth: 1,
          borderColor: '#D1D9D5',
          borderRadius: 4,
          padding: 12,
          backgroundColor: '#F5F8F6'
        }, { flex: 1 }]}
        placeholder={placeholder}
        value={formatPhone(value)}
        onChangeText={(v) => onChange(normalizePhone(v))}
        keyboardType="numeric"
        maxLength={14}
      />
      {esValido && (
        <TouchableOpacity
          onPress={() => llamar(value, nombre, relacion)}
          style={{
            backgroundColor: '#EFF6FF',
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Text allowFontScaling={false} style={{ fontSize: 20 }}>📞</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export const SolicitudFormScreen: React.FC<SolicitudFormScreenProps> = ({
  integranteId,
  integranteNombre,
  groupName,
  integrantePosition,
  integrantesTotal,
  initialStep,
  onSaved,
  onSavedGoToDocumentos,
  onBack,
  onDataChange,
}) => {
  const documentationTheme = moduleThemes.documentation;
  const [currentStep, setCurrentStep] = useState(initialStep ?? 1);
  const [documentos, setDocumentos] = useState<DocumentoRequerido[]>(DOCUMENTOS_REQUERIDOS);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<{ uri: string; titulo: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<{ uri: string; reversoUri?: string; documentoId: string; titulo: string } | null>(null);
  const [form, setForm] = useState({
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
    tiene_menos_70_anios: '',
  });

  const [errors, setErrors] = useState<SolicitudErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fechaNacimientoInput, setFechaNacimientoInput] = useState('');
  const [isLoadingSolicitud, setIsLoadingSolicitud] = useState(true);
  const [integrante, setIntegrante] = useState<{ nombre: string; telefono: string; montoSolicitado: number } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const scrollViewRef = React.useRef<ScrollView>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Estados para colonias del domicilio
  const [coloniasDisponiblesDomicilio, setColoniasDisponiblesDomicilio] = useState<string[]>([]);
  const [loadingColoniasDomicilio, setLoadingColoniasDomicilio] = useState(false);

  // Estados para colonias del negocio
  const [coloniasDisponiblesNegocio, setColoniasDisponiblesNegocio] = useState<string[]>([]);
  const [loadingColoniasNegocio, setLoadingColoniasNegocio] = useState(false);

  // Función de auto-guardado
  const performAutoSave = useCallback(async () => {
    setAutoSaveStatus('saving');

    const camposBasicos = ['nombres', 'apellido_pat', 'apellido_mat', 'telefonoInicial', 'telefonoSecundario', 'montoSolicitado'];
    const datosSolicitante: any = {};
    const datosSolicitud: any = {};

    Object.keys(form).forEach((key) => {
      const value = form[key as keyof typeof form];
      if (value && String(value).trim()) {
        if (camposBasicos.includes(key)) {
          if (key === 'telefonoInicial') {
            datosSolicitante.telefono = value;
          } else if (key === 'telefonoSecundario') {
            datosSolicitante.telefonoSecundario = value;
          } else if (key === 'montoSolicitado') {
            datosSolicitante.montoSolicitado = Number(value);
          } else {
            datosSolicitante[key] = value;
          }
        } else {
          // Mapear campos de validación directamente como string
          if (key === 'tieneMedidorLuzSinAdeudo') {
            datosSolicitud.tiene_medidor_luz = value;
          } else if (key === 'viveMaximo5KmTesorera') {
            datosSolicitud.vive_max_5km_tesorera = value;
          } else if (key === 'tiene_menos_70_anios') {
            datosSolicitud.tiene_menos_70_anios = value;
          } else if (key === 'estado') {
            datosSolicitud.dom_estado = value;
          } else if (key === 'negocioEstado') {
            datosSolicitud.negocio_estado = value;
          } else {
            datosSolicitud[key] = value;
          }
        }
      }
    });

    try {
      // Guardar datos básicos
      if (Object.keys(datosSolicitante).length > 0) {

        console.log('🔄 AUTO-SAVE datos integrante:', JSON.stringify(datosSolicitante, null, 2));

        await api.patch(`/integrantes/${integranteId}`, datosSolicitante);
      }

      // Guardar formulario
      if (Object.keys(datosSolicitud).length > 0) {
        await api.patch(`/solicitudes/${integranteId}`, datosSolicitud);
      }

      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error auto-guardado:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }
  }, [form, integranteId]);

  // Auto-guardado en tiempo real (debounced)
  useEffect(() => {
    // No guardar en la carga inicial
    if (isInitialLoadRef.current || isLoadingSolicitud) {
      return;
    }

    // Limpiar timer anterior
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Configurar nuevo timer (esperar 1.5 segundos de inactividad)
    autoSaveTimerRef.current = setTimeout(() => {
      console.log('🔄 Auto-guardado activado');
      performAutoSave();
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

      try {
        // Cargar datos del integrante
        integranteData = await api.get(`/integrantes/${integranteId}`);
        if (integranteData) {
          setIntegrante(integranteData);

          // Pre-cargar datos iniciales del integrante en el formulario
          setForm((current) => ({
            ...current,
            nombres: integranteData.nombres || '',
            apellido_pat: integranteData.apellido_pat || '',
            apellido_mat: integranteData.apellido_mat || '',
            telefonoInicial: integranteData.telefono || '',
            telefonoSecundario: integranteData.telefonoSecundario || '',
            montoSolicitado: String(integranteData.montoSolicitado || ''),
          }));
        }

        try {
          const data = await api.get(`/solicitudes/solicitante/${integranteId}`);
          if (data) {
            // Parsear la fecha de nacimiento de ISO a DD,MMM,YYYY para display
            const fecha_nac_display = data.fecha_nac ? formatISODateToDDMMMYYYY(data.fecha_nac) : '';

            // BUG 3 FIX: Datos básicos SIEMPRE vienen de integranteData (tabla integrantes)
            // El formulario (data) NO tiene estos campos
            const montoFromIntegrante = integranteData?.montoSolicitado ? String(Number(integranteData.montoSolicitado)) : '';

            setForm({
              // Datos básicos de identidad (fuente: tabla integrantes o solicitud)
              nombres: data.nombres || integranteData?.nombres || '',
              apellido_pat: integranteData?.apellido_pat || '',
              apellido_mat: integranteData?.apellido_mat || '',
              telefonoInicial: integranteData?.telefono || '',
              telefonoSecundario: integranteData?.telefonoSecundario || '',
              montoSolicitado: montoFromIntegrante,

              fecha_nac: data.fecha_nac || '',
              curp: data.curp || '',
              nacionalidad: data.nacionalidad || '',
              estado_nacimiento: data.estado_nacimiento || '',
              genero: data.genero || '',
              estado_civil: data.estado_civil || '',
              ocupacion: data.ocupacion || '',
              nivel_estudio: data.nivel_estudio || '',

              calle: data.dom_calle || data.calle || '',
              numeroExterior: data.dom_num_ext || data.numeroExterior || '',
              numeroInterior: data.dom_num_int || data.numeroInterior || '',
              colonia: data.dom_colonia || data.colonia || '',
              municipio: data.dom_municipio || data.municipio || '',
              estado: data.estado || DEFAULT_STATE,
              codigoPostal: data.dom_codigo_postal || data.codigoPostal || '',
              entreCalles: data.dom_entre_calles || data.entreCalles || '',
              telefono: data.telefono || '',

              referencia1NombreCompleto: data.ref1_nombre || data.referencia1NombreCompleto || '',
              referencia1Parentesco: data.ref1_parentesco || data.referencia1Parentesco || '',
              referencia1Telefono: data.ref1_telefono || data.referencia1Telefono || '',
              referencia1Direccion: data.ref1_direccion || data.referencia1Direccion || '',
              referencia2NombreCompleto: data.ref2_nombre || data.referencia2NombreCompleto || '',
              referencia2Parentesco: data.ref2_parentesco || data.referencia2Parentesco || '',
              referencia2Telefono: data.ref2_telefono || data.referencia2Telefono || '',
              referencia2Direccion: data.ref2_direccion || data.referencia2Direccion || '',

              parejaNombreCompleto: data.pareja_nombre || data.parejaNombreCompleto || '',
              parejaActividadEconomica: data.pareja_actividad || data.parejaActividadEconomica || '',
              pareja_ingreso_semanal: data.pareja_ingreso_semanal ? String(data.pareja_ingreso_semanal) : '',

              negocioCalle: data.negocio_domicilio || data.negocioCalle || '',
              negocioNumeroExterior: data.negocio_num_ext || data.negocioNumeroExterior || '',
              negocioNumeroInterior: data.negocio_num_int || data.negocioNumeroInterior || '',
              negocio_colonia: data.negocio_colonia || '',
              negocio_municipio: data.negocio_municipio || '',
              negocioEstado: data.negocio_estado || data.negocioEstado || DEFAULT_STATE,
              negocioCodigoPostal: data.negocio_codigo_postal || data.negocioCodigoPostal || '',
              negocioDesdeCuando: data.negocio_desde_cuando || data.negocioDesdeCuando || '',
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
              tiene_menos_70_anios: data.tiene_menos_70_anios || '',
            });

            setFechaNacimientoInput(fecha_nac_display);

            // Actualizar estado de documentos según los campos doc_*_ruta
            const cargarDocumentosAsync = async () => {
              const documentosActualizados = await Promise.all(
                DOCUMENTOS_REQUERIDOS.map(async (doc) => {
                  let status: DocumentStatus = doc.status;
                  let uriFrente: string | undefined;
                  let uriReverso: string | undefined;

                  // Función auxiliar para validar si una ruta es válida (no es mobile-temp)
                  const esRutaValida = (ruta: string) => ruta && !ruta.startsWith('mobile-temp:');

                  let rutaDB: string | undefined;

                  // Obtener la ruta de la BD según el documento
                  if (doc.id === 'ine_integrante') rutaDB = data.doc_ine_ruta;
                  else if (doc.id === 'comprobante_domicilio') rutaDB = data.doc_comprobante_ruta;
                  else if (doc.id === 'ine_beneficiario') rutaDB = data.doc_ine_beneficiario_ruta;
                  else if (doc.id === 'solicitud_firmada') rutaDB = data.doc_solicitud_firmada_ruta;

                  // Si la ruta es válida y empieza con "storage:", cargar desde AsyncStorage
                  if (rutaDB && esRutaValida(rutaDB) && rutaDB.startsWith('storage:')) {
                    status = 'CARGADO';
                    const storageKey = rutaDB.split('|')[0].replace('storage:', '');
                    try {
                      const stored = await AsyncStorage.getItem(storageKey);
                      if (stored) {
                        const documentData = JSON.parse(stored);
                        uriFrente = documentData.frente;
                        uriReverso = documentData.reverso;
                      }
                    } catch (error) {
                      console.error('Error cargando documento desde AsyncStorage:', error);
                    }
                  } else if (!doc.obligatorio) {
                    status = 'OPCIONAL';
                  } else {
                    status = 'PENDIENTE';
                  }

                  return { ...doc, status, uriFrente, uriReverso };
                })
              );
              setDocumentos(documentosActualizados);
            };

            cargarDocumentosAsync();
          }
        } catch (solicitudError) {
          // Si no hay solicitud, solo mantener datos del integrante
          console.log('No hay solicitud guardada aún');
        }
      } catch (error) {
        console.error('Error cargando solicitud:', error);
      } finally {
        setIsLoadingSolicitud(false);
        // Marcar que la carga inicial terminó (para activar auto-guardado)
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 500);
      }
    };

    loadExistingSolicitud();
  }, [integranteId]);

  // Cargar colonias del DOMICILIO desde el API cuando cambia el código postal
  useEffect(() => {
    const cargarColoniasDomicilio = async () => {
      if (form.codigoPostal.length !== 5) {
        setColoniasDisponiblesDomicilio([]);
        return;
      }

      setLoadingColoniasDomicilio(true);
      try {
        const data = await api.get(`/codigos-postales/colonias?codigo=${form.codigoPostal}`);
        setColoniasDisponiblesDomicilio(data.colonias || []);
        // Llenar automáticamente el municipio
        if (data.municipio) {
          setForm((prev) => ({ ...prev, municipio: data.municipio }));
        }
      } catch (error) {
        console.error('Error cargando colonias domicilio:', error);
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
        const data = await api.get(`/codigos-postales/colonias?codigo=${form.negocioCodigoPostal}`);
        setColoniasDisponiblesNegocio(data.colonias || []);
        // Llenar automáticamente el municipio del negocio
        if (data.municipio) {
          setForm((prev) => ({ ...prev, negocio_municipio: data.municipio }));
        }
      } catch (error) {
        console.error('Error cargando colonias negocio:', error);
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
    setForm((current) => ({ ...current, [field]: value }));
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

  const validateCurpField = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Campo obligatorio';
    }

    if (value.trim().length !== 18 || !validateCURP(value)) {
      return 'CURP inválida';
    }

    return undefined;
  };

  const validateFechaNacimientoField = (value: string): string | undefined => {
    if (!value.trim()) {
      return 'Campo obligatorio';
    }

    const ddmmyyyy = formatISODateToDDMMYYYY(value);
    if (!ddmmyyyy || !validateRealDate(ddmmyyyy)) {
      return 'Fecha inválida';
    }

    return undefined;
  };

  const handleCurpBlur = () => {
    setErrors((current) => ({
      ...current,
      curp: validateCurpField(form.curp),
    }));
  };

  const handleFechaNacimientoBlur = () => {
    if (!fechaNacimientoInput.trim()) {
      updateField('fecha_nac', '');
      setErrors((current) => ({
        ...current,
        fecha_nac: 'Campo obligatorio',
      }));
      return;
    }

    if (!validateRealDate(fechaNacimientoInput)) {
      updateField('fecha_nac', '');
      setErrors((current) => ({
        ...current,
        fecha_nac: 'Fecha inválida',
      }));
      return;
    }

    const normalizedDate = toISODateFromDDMMYYYY(fechaNacimientoInput);
    updateField('fecha_nac', normalizedDate);
    setFechaNacimientoInput(formatISODateToDDMMMYYYY(normalizedDate));
    setErrors((current) => ({
      ...current,
      fecha_nac: validateFechaNacimientoField(normalizedDate),
    }));
  };

  const handleFechaNacimientoFocus = () => {
    if (form.fecha_nac) {
      const editableDate = formatISODateToDDMMYYYY(form.fecha_nac);
      setFechaNacimientoInput(editableDate || fechaNacimientoInput);
    }
  };

  const handleFechaNacimientoChange = (value: string) => {
    const maskedDate = formatDateDDMMYYYY(value);
    setFechaNacimientoInput(maskedDate);

    if (validateRealDate(maskedDate)) {
      updateField('fecha_nac', toISODateFromDDMMYYYY(maskedDate));
    } else {
      updateField('fecha_nac', '');
    }
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

  // Verificar si el paso actual está completo (todos los campos obligatorios llenos)
  const isStepComplete = (step: number): boolean => {
    if (step === 1) {
      // PASO 1: Información Personal
      return !!(
        form.nombres.trim() &&
        form.apellido_pat.trim() &&
        form.apellido_mat.trim() &&
        form.telefonoInicial.trim() &&
        form.fecha_nac.trim() &&
        form.curp.trim() &&
        form.genero.trim() &&
        form.estado_civil.trim() &&
        form.ocupacion.trim() &&
        form.nivel_estudio.trim() &&
        form.nacionalidad.trim()
      );
    } else if (step === 2) {
      // PASO 2: Domicilio Particular
      return !!(
        form.calle.trim() &&
        form.numeroExterior.trim() &&
        form.entreCalles.trim() &&
        form.colonia.trim() &&
        form.municipio.trim()
      );
    } else if (step === 3) {
      // PASO 3: Referencias
      return !!(
        form.referencia1NombreCompleto.trim() &&
        form.referencia1Parentesco.trim() &&
        form.referencia1Telefono.trim() &&
        form.referencia1Direccion.trim() &&
        form.referencia2NombreCompleto.trim() &&
        form.referencia2Parentesco.trim() &&
        form.referencia2Telefono.trim() &&
        form.referencia2Direccion.trim()
      );
    } else if (step === 4) {
      // PASO 4: Negocio o Trabajo
      return !!(
        form.negocioCalle.trim() &&
        form.negocioNumeroExterior.trim() &&
        form.negocio_colonia.trim() &&
        form.negocio_municipio.trim() &&
        form.negocioDesdeCuando.trim() &&
        form.negocio_giro.trim() &&
        form.negocio_ingreso_semanal.trim() &&
        form.negocio_gastos.trim()
      );
    } else if (step === 5) {
      // PASO 5: Beneficiario
      return !!(
        form.beneficiarioNombreCompleto.trim() &&
        form.beneficiario_parentesco.trim() &&
        form.beneficiario_telefono.trim() &&
        form.beneficiario_direccion.trim()
      );
    } else if (step === 6) {
      // PASO 6: Validaciones y Monto
      return !!(
        form.tieneMedidorLuzSinAdeudo &&
        form.viveMaximo5KmTesorera &&
        form.montoSolicitado.trim()
      );
    } else if (step === 7) {
      // PASO 7: Documentación - todos los documentos obligatorios deben estar CARGADOS
      const documentosObligatorios = documentos.filter(doc => doc.obligatorio);
      const documentosCargados = documentosObligatorios.filter(doc => doc.status === 'CARGADO');
      return documentosCargados.length === documentosObligatorios.length;
    }
    return false;
  };

  // Validación por paso
  const validateCurrentStep = useCallback((): boolean => {
    const nextErrors: SolicitudErrors = {};

    if (currentStep === 1) {
      // PASO 1: Información Personal
      if (!form.nombres.trim()) nextErrors.nombres = 'Campo obligatorio';
      if (!form.apellido_pat.trim()) nextErrors.apellido_pat = 'Campo obligatorio';
      if (!form.apellido_mat.trim()) nextErrors.apellido_mat = 'Campo obligatorio';
      if (!form.telefonoInicial.trim()) nextErrors.telefonoInicial = 'Campo obligatorio';
      if (!validatePhone10(form.telefonoInicial)) nextErrors.telefonoInicial = 'Debe tener 10 dígitos';
      if (!form.fecha_nac.trim()) nextErrors.fecha_nac = 'Campo obligatorio';
      if (!form.curp.trim()) nextErrors.curp = 'Campo obligatorio';
      if (!form.genero.trim()) nextErrors.genero = 'Campo obligatorio';
      if (!form.estado_civil.trim()) nextErrors.estado_civil = 'Campo obligatorio';
      if (!form.ocupacion.trim()) nextErrors.ocupacion = 'Campo obligatorio';
      if (!form.nivel_estudio.trim()) nextErrors.nivel_estudio = 'Campo obligatorio';
      if (!form.nacionalidad.trim()) nextErrors.nacionalidad = 'Campo obligatorio';
      if (form.nacionalidad === 'MEXICANA' && !form.estado_nacimiento.trim()) {
        nextErrors.estado_nacimiento = 'Campo obligatorio';
      }

      const fechaError = validateFechaNacimientoField(form.fecha_nac);
      if (fechaError) nextErrors.fecha_nac = fechaError;

      const curpError = validateCurpField(form.curp);
      if (curpError) nextErrors.curp = curpError;
    } else if (currentStep === 2) {
      // PASO 2: Domicilio Particular
      if (!form.calle.trim()) nextErrors.calle = 'Campo obligatorio';
      if (!form.numeroExterior.trim()) nextErrors.numeroExterior = 'Campo obligatorio';
      if (!form.colonia.trim()) nextErrors.colonia = 'Campo obligatorio';
      if (!form.municipio.trim()) nextErrors.municipio = 'Campo obligatorio';
      if (!form.codigoPostal.trim()) nextErrors.codigoPostal = 'Campo obligatorio';
      if (form.codigoPostal.trim().length !== 5) nextErrors.codigoPostal = 'Debe tener 5 dígitos';
      if (!form.entreCalles.trim()) nextErrors.entreCalles = 'Campo obligatorio';
    } else if (currentStep === 3) {
      // PASO 3: Referencias
      if (!form.referencia1NombreCompleto.trim()) nextErrors.referencia1NombreCompleto = 'Campo obligatorio';
      if (!form.referencia1Parentesco.trim()) nextErrors.referencia1Parentesco = 'Campo obligatorio';
      if (!form.referencia1Telefono.trim()) nextErrors.referencia1Telefono = 'Campo obligatorio';
      if (!validatePhone10(form.referencia1Telefono)) nextErrors.referencia1Telefono = 'Debe tener 10 dígitos';
      if (!form.referencia1Direccion.trim()) nextErrors.referencia1Direccion = 'Campo obligatorio';

      if (!form.referencia2NombreCompleto.trim()) nextErrors.referencia2NombreCompleto = 'Campo obligatorio';
      if (!form.referencia2Parentesco.trim()) nextErrors.referencia2Parentesco = 'Campo obligatorio';
      if (!form.referencia2Telefono.trim()) nextErrors.referencia2Telefono = 'Campo obligatorio';
      if (!validatePhone10(form.referencia2Telefono)) nextErrors.referencia2Telefono = 'Debe tener 10 dígitos';
      if (!form.referencia2Direccion.trim()) nextErrors.referencia2Direccion = 'Campo obligatorio';
    } else if (currentStep === 4) {
      // PASO 4: Negocio o Trabajo
      if (!form.negocioCalle.trim()) nextErrors.negocioCalle = 'Campo obligatorio';
      if (!form.negocioNumeroExterior.trim()) nextErrors.negocioNumeroExterior = 'Campo obligatorio';
      if (!form.negocio_colonia.trim()) nextErrors.negocio_colonia = 'Campo obligatorio';
      if (!form.negocio_municipio.trim()) nextErrors.negocio_municipio = 'Campo obligatorio';
      if (!form.negocioCodigoPostal.trim()) nextErrors.negocioCodigoPostal = 'Campo obligatorio';
      if (form.negocioCodigoPostal.trim().length !== 5) nextErrors.negocioCodigoPostal = 'Debe tener 5 dígitos';
      if (!form.negocioDesdeCuando.trim()) nextErrors.negocioDesdeCuando = 'Campo obligatorio';
      if (!form.negocio_giro.trim()) nextErrors.negocio_giro = 'Campo obligatorio';
      if (!form.negocio_ingreso_semanal.trim()) nextErrors.negocio_ingreso_semanal = 'Campo obligatorio';
      if (!form.negocio_gastos.trim()) nextErrors.negocio_gastos = 'Campo obligatorio';
      if (!form.negocio_total.trim()) nextErrors.negocio_total = 'Campo obligatorio';
    } else if (currentStep === 5) {
      // PASO 5: Beneficiario
      if (!form.beneficiarioNombreCompleto.trim()) nextErrors.beneficiarioNombreCompleto = 'Campo obligatorio';
      if (!form.beneficiario_parentesco.trim()) nextErrors.beneficiario_parentesco = 'Campo obligatorio';
      if (!form.beneficiario_telefono.trim()) nextErrors.beneficiario_telefono = 'Campo obligatorio';
      if (!validatePhone10(form.beneficiario_telefono)) nextErrors.beneficiario_telefono = 'Debe tener 10 dígitos';
      if (!form.beneficiario_direccion.trim()) nextErrors.beneficiario_direccion = 'Campo obligatorio';
    } else if (currentStep === 6) {
      // PASO 6: Validaciones y Monto
      if (!form.tieneMedidorLuzSinAdeudo) nextErrors.tieneMedidorLuzSinAdeudo = 'Campo obligatorio';
      if (!form.viveMaximo5KmTesorera) nextErrors.viveMaximo5KmTesorera = 'Campo obligatorio';
      if (!form.tiene_menos_70_anios) nextErrors.tiene_menos_70_anios = 'Campo obligatorio';
      if (!form.montoSolicitado.trim()) nextErrors.montoSolicitado = 'Campo obligatorio';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [currentStep, form]);

  const saveCurrentStep = useCallback(async () => {
    try {
      // Guardar datos básicos del integrante (siempre)
      const integranteData = {
        nombres: form.nombres,
        apellido_pat: form.apellido_pat,
        apellido_mat: form.apellido_mat,
        telefono: form.telefonoInicial,
        telefonoSecundario: form.telefonoSecundario,
        montoSolicitado: Number(form.montoSolicitado),
      };

      console.log('📤 PATCH /integrantes - Datos a enviar:', JSON.stringify(integranteData, null, 2));
      console.log('🔍 VERIFICAR telefonoSecundario:', form.telefonoSecundario);

      try {
        await api.patch(`/integrantes/${integranteId}`, integranteData);
        console.log('✅ Integrante actualizado correctamente');
      } catch (error: any) {
        console.error('❌ Error al guardar integrante:', error);
      }

      // Guardar datos de la solicitud (todos los pasos) - TODOS LOS CAMPOS
      const solicitudData: any = {
        // PASO 1: Información Personal
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

        // PASO 2: Domicilio Particular
        dom_calle: form.calle,
        dom_num_ext: form.numeroExterior,
        dom_num_int: form.numeroInterior,
        dom_entre_calles: form.entreCalles,
        dom_colonia: form.colonia,
        dom_municipio: form.municipio,
        dom_estado: form.estado,
        dom_codigo_postal: form.codigoPostal,
        dom_telefono: form.telefonoInicial,

        // PASO 3: Referencias
        ref1_nombre: form.referencia1NombreCompleto,
        ref1_parentesco: form.referencia1Parentesco,
        ref1_telefono: form.referencia1Telefono,
        ref1_direccion: form.referencia1Direccion,
        ref2_nombre: form.referencia2NombreCompleto,
        ref2_parentesco: form.referencia2Parentesco,
        ref2_telefono: form.referencia2Telefono,
        ref2_direccion: form.referencia2Direccion,

        // Pareja (si aplica)
        pareja_nombre: form.parejaNombreCompleto,
        pareja_actividad: form.parejaActividadEconomica,
        pareja_ingreso_semanal: form.pareja_ingreso_semanal ? Number(form.pareja_ingreso_semanal) : null,

        // PASO 4: Negocio o Trabajo
        negocio_domicilio: form.negocioCalle,
        negocio_num_ext: form.negocioNumeroExterior,
        negocio_num_int: form.negocioNumeroInterior,
        negocio_colonia: form.negocio_colonia,
        negocio_municipio: form.negocio_municipio,
        negocio_estado: form.negocioEstado,
        negocio_codigo_postal: form.negocioCodigoPostal,
        negocio_giro: form.negocio_giro,
        negocio_desde_cuando: form.negocioDesdeCuando,
        negocio_ingreso_semanal: form.negocio_ingreso_semanal ? Number(form.negocio_ingreso_semanal) : null,
        negocio_otros_ingresos: form.negocio_otros_ingresos ? Number(form.negocio_otros_ingresos) : null,
        negocio_gastos: form.negocio_gastos ? Number(form.negocio_gastos) : null,
        negocio_total: form.negocio_total ? Number(form.negocio_total) : null,

        // PASO 5: Beneficiario
        beneficiario_nombre: form.beneficiarioNombreCompleto,
        beneficiario_parentesco: form.beneficiario_parentesco,
        beneficiario_telefono: form.beneficiario_telefono,
        beneficiario_direccion: form.beneficiario_direccion,

        // PASO 6: Validaciones (enviar como string 'SI' o 'NO')
        tiene_medidor_luz: form.tieneMedidorLuzSinAdeudo || null,
        vive_max_5km_tesorera: form.viveMaximo5KmTesorera || null,
        tiene_menos_70_anios: form.tiene_menos_70_anios || null,

        // Monto solicitado
        monto_solicitado: form.montoSolicitado ? Number(form.montoSolicitado) : null,
      };

      // Intentar PATCH primero, si falla hacer POST
      try {
        console.log('💾 ========================================');
        console.log('💾 GUARDANDO SOLICITUD');
        console.log('💾 Integrante ID:', integranteId);
        console.log('💾 PAYLOAD COMPLETO QUE SE VA A ENVIAR:');
        console.log(JSON.stringify(solicitudData, null, 2));
        console.log('💾 ========================================');

        try {
          await api.patch(`/solicitudes/integrante/${integranteId}`, solicitudData);
          console.log('💾 ✅ Solicitud actualizada con PATCH');
        } catch (patchError: any) {
          if (patchError.status === 404) {
            console.log('💾 ⚠️ 404 - Creando nueva solicitud con POST');
            await api.post('/solicitudes', {
              integrante_id: integranteId,
              ...solicitudData,
            });
            console.log('💾 ✅ Solicitud creada con POST');
          } else if (patchError.status === 400) {
            console.error('❌ ERROR 400 - Validación fallida');
            console.error('Status:', patchError.status);
            console.error('Message:', patchError.message);
            console.error('Detalle completo:', JSON.stringify(patchError, null, 2));
            if (patchError.response?.data) {
              console.error('Body de respuesta:', JSON.stringify(patchError.response.data, null, 2));
            }
            Alert.alert(
              'Error de validación',
              `El servidor rechazó los datos. Revisa la consola para detalles.\n\n${JSON.stringify(patchError.response?.data || patchError.message, null, 2)}`
            );
            throw patchError;
          } else {
            console.error('❌ Error inesperado:', patchError);
            throw patchError;
          }
        }

        console.log('💾 ✅ GUARDADO COMPLETADO');
        console.log('💾 ========================================');
      } catch (err) {
        console.error('❌ Error guardando solicitud:', err);
      }

      console.log('✅ Guardado completado');
    } catch (error) {
      console.error('❌ Error guardando paso:', error);
    }
  }, [form, integranteId, currentStep]);

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
    } catch (e) {
      // Si falla el guardado, igual retroceder
    }
    // Scroll al inicio del formulario
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, [saveCurrentStep]);

  const handleSubirDocumento = async (documentoId: string) => {
    try {
      setUploadingDocId(documentoId);

      // Solicitar permisos para acceder a la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar imágenes.');
        setUploadingDocId(null);
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
            { text: 'Cancelar', style: 'cancel', onPress: () => setUploadingDocId(null) },
            {
              text: 'Seleccionar',
              onPress: async () => {
                const frenteResult = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'],
                  allowsEditing: false,
                  quality: 0.9,
                  base64: false,
                  aspect: [1.6, 1], // Proporción de INE
                });

                if (frenteResult.canceled || !frenteResult.assets[0]) {
                  setUploadingDocId(null);
                  return;
                }

                // Ahora capturar reverso
                Alert.alert(
                  'INE - Reverso',
                  'Ahora selecciona la foto del REVERSO de la INE',
                  [
                    { text: 'Cancelar', style: 'cancel', onPress: () => setUploadingDocId(null) },
                    {
                      text: 'Seleccionar',
                      onPress: async () => {
                        const reversoResult = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ['images'],
                          allowsEditing: false,
                          quality: 0.9,
                          base64: false,
                          aspect: [1.6, 1], // Proporción de INE
                        });

                        if (reversoResult.canceled || !reversoResult.assets[0]) {
                          setUploadingDocId(null);
                          return;
                        }

                        // Mostrar previsualización antes de guardar
                        setPreviewImage({
                          uri: frenteResult.assets[0].uri,
                          reversoUri: reversoResult.assets[0].uri,
                          documentoId,
                          titulo: 'INE (Frente y Reverso)',
                        });
                        setUploadingDocId(null);
                      }
                    }
                  ]
                );
              }
            }
          ]
        );
      } else {
        // Para otros documentos, solo una imagen
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.9,
          base64: false,
        });

        if (result.canceled || !result.assets[0]) {
          setUploadingDocId(null);
          return;
        }

        // Mostrar previsualización antes de guardar
        const nombreDoc = DOCUMENTOS_REQUERIDOS.find(d => d.id === documentoId)?.nombre || 'Documento';
        setPreviewImage({
          uri: result.assets[0].uri,
          documentoId,
          titulo: nombreDoc,
        });
        setUploadingDocId(null);
      }
    } catch (error) {
      console.error('Error subiendo documento:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al subir el documento');
      setUploadingDocId(null);
    }
  };

  const handleConfirmarDocumento = async () => {
    if (!previewImage) return;

    try {
      await guardarDocumento(previewImage.documentoId, previewImage.uri, previewImage.reversoUri);
      setPreviewImage(null);
    } catch (error) {
      console.error('Error guardando documento:', error);
      Alert.alert('Error', 'No se pudo guardar el documento');
    }
  };

  const handleCancelarDocumento = () => {
    setPreviewImage(null);
  };

  const guardarDocumento = async (documentoId: string, frenteUri: string, reversoUri?: string) => {
    try {
      // Mapear ID del documento a campos en la base de datos
      const fieldMap: Record<string, { ruta: string; fecha: string }> = {
        'ine_integrante': { ruta: 'doc_ine_ruta', fecha: 'doc_ine_fecha' },
        'comprobante_domicilio': { ruta: 'doc_comprobante_ruta', fecha: 'doc_comprobante_fecha' },
        'ine_beneficiario': { ruta: 'doc_ine_beneficiario_ruta', fecha: 'doc_ine_beneficiario_fecha' },
        'solicitud_firmada': { ruta: 'doc_solicitud_firmada_ruta', fecha: 'doc_solicitud_firmada_fecha' },
        'comprobante_linea_credito': { ruta: 'doc_comprobante_credito_ruta', fecha: 'doc_comprobante_credito_fecha' },
      };

      const fields = fieldMap[documentoId];
      if (!fields) {
        throw new Error(`Documento desconocido: ${documentoId}`);
      }

      // Guardar las URIs en AsyncStorage para persistencia
      const storageKey = `documento_${integranteId}_${documentoId}`;
      const documentData = {
        frente: frenteUri,
        reverso: reversoUri,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(documentData));

      // Guardar referencia en la BD (guardamos la key de AsyncStorage)
      const rutaGuardada = reversoUri
        ? `storage:${storageKey}|frente-reverso`
        : `storage:${storageKey}|frente`;
      const fechaCaptura = new Date().toISOString().split('T')[0];

      // Actualizar campos en la tabla solicitudes
      await api.patch(`/solicitudes/${integranteId}`, {
        [fields.ruta]: rutaGuardada,
        [fields.fecha]: fechaCaptura,
      });

      // Actualizar el estado del documento a CARGADO y guardar las URIs
      setDocumentos((prev) =>
        prev.map((doc) =>
          doc.id === documentoId
            ? {
                ...doc,
                status: 'CARGADO',
                uriFrente: frenteUri,
                uriReverso: reversoUri,
              }
            : doc
        )
      );

      Alert.alert('Éxito', reversoUri ? 'INE (frente y reverso) cargada correctamente' : 'Documento cargado correctamente');
    } catch (error) {
      console.error('Error guardando documento:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Error al guardar el documento');
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleVerDocumento = (documento: DocumentoRequerido) => {
    if (!documento.uriFrente) {
      Alert.alert(
        'Imagen no disponible',
        'Este documento fue cargado en una versión anterior y necesita ser actualizado. Por favor, sube la imagen nuevamente.'
      );
      return;
    }

    // Si es INE y tiene reverso, mostrar opciones
    if (documento.uriReverso) {
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
    } else {
      setViewingImage({ uri: documento.uriFrente, titulo: documento.nombre });
    }
  };

  const handleMarcarCapturado = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    setAutoSaveStatus('saving');

    try {
      // 1. Guardar formulario completo
      const payload = {
        integrante_id: integranteId,  // Campo correcto esperado por el backend
        solicitanteId: integranteId,  // Legacy para compatibilidad
        ...form,
        telefono: form.telefonoInicial,
        domicilio: `${form.calle} ${form.numeroExterior}${form.numeroInterior ? ` INT ${form.numeroInterior}` : ''}, ${form.colonia}, ${form.municipio}, ${form.estado}, CP ${form.codigoPostal}`,
        // Campos de negocio ya incluidos en form, no hace falta duplicarlos aquí
      };

      console.log('📤 Enviando payload final a POST /solicitudes');
      console.log('integranteId:', integranteId);

      await api.post('/solicitudes', payload);

      // 2. Cambiar estado a SUJETA_CREDITO
      await api.patch(`/integrantes/${integranteId}/estado`, { estado: 'SUJETA_CREDITO' });

      setAutoSaveStatus('saved');
      Alert.alert('Éxito', 'Solicitud capturada y marcada como Sujeta a Crédito');
      onSaved?.();
    } catch (error) {
      console.error('Error marcando capturado:', error);
      setAutoSaveStatus('error');
      Alert.alert('Error', error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }
  };

  const renderSelectCard = (
    field: SelectorFieldKey,
    label: string,
    value: string,
    options: readonly string[],
    error?: string,
    helperText = 'Selecciona una opción',
    placeholder = 'Seleccionar opción',
  ) => (
    <Card style={styles.optionCard}>
      <SelectorField
        label={label}
        required
        helperText={helperText}
        value={value}
        placeholder={placeholder}
        options={options}
        errorText={error}
        onSelect={(nextValue) => handleSelectorSelect(field, nextValue)}
      />
    </Card>
  );

  const renderReadOnlyField = (label: string, value: string, helperText?: string, errorText?: string) => (
    <FormField label={label} required helperText={helperText} errorText={errorText}>
      <View style={styles.readOnlyField}>
        <Text allowFontScaling={false} style={styles.valueText}>{value}</Text>
      </View>
    </FormField>
  );

  const renderFixedState = () => (
    <FormField label="Estado">
      <View style={styles.readOnlyField}>
        <Text allowFontScaling={false} style={styles.valueText}>{DEFAULT_STATE}</Text>
      </View>
    </FormField>
  );

  const renderMunicipioSelector = (field: 'municipio' | 'negocio_municipio', value: string, error?: string) =>
    renderSelectCard(field, 'Municipio', value, NUEVO_LEON_MUNICIPALITIES, error, 'Selecciona un municipio', 'Seleccionar municipio');

  const renderEdadConPregunta = () => {
    let edadTexto = '';
    if (form.fecha_nac) {
      const hoy = new Date();
      const nacimiento = new Date(form.fecha_nac);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mesActual = hoy.getMonth();
      const mesNacimiento = nacimiento.getMonth();
      if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      edadTexto = `${edad} años`;
    }

    return (
      <Card style={styles.optionCard}>
        <View style={styles.edadPreguntaContainer}>
          <View style={{ flex: 1 }}>
            <SelectorField
              label="¿La integrante tiene menos de 70 años?"
              required
              helperText="Selecciona una opción"
              value={form.tiene_menos_70_anios}
              placeholder="Seleccionar opción"
              options={yesNoOptions}
              errorText={errors.tiene_menos_70_anios}
              onSelect={(nextValue) => handleSelectorSelect('tiene_menos_70_anios', nextValue)}
            />
          </View>
          {edadTexto && (
            <View style={styles.edadBurbuja}>
              <Text allowFontScaling={false} style={styles.edadBurbujaTexto}>{edadTexto}</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const handleLlamarIntegrante = (telefono: string, nombre: string) => {
    llamar(telefono, nombre);
  };

  // Guardar automáticamente antes de salir
  const handleBack = async () => {
    // Guardar antes de salir
    try {
      await saveCurrentStep();
    } catch (e) {
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

            {/* Teléfono y Monto */}
            {integrante && (
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

                {/* Monto */}
                <View style={styles.montoContainer}>
                  <Text allowFontScaling={false} style={styles.montoIcon}>💰</Text>
                  <Text allowFontScaling={false} style={styles.montoText}>{formatCurrency(integrante.montoSolicitado)}</Text>
                </View>
              </View>
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
              <>
                <FormField label="Nombre(s)" required errorText={errors.nombres}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Nombre(s) completo(s)"
                    value={form.nombres}
                    onChangeText={(value) => updateField('nombres', normalizeUppercaseLettersOnly(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Apellido paterno" required errorText={errors.apellido_pat}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Apellido paterno"
                    value={form.apellido_pat}
                    onChangeText={(value) => updateField('apellido_pat', normalizeUppercaseLettersOnly(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Apellido materno" required errorText={errors.apellido_mat}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Apellido materno"
                    value={form.apellido_mat}
                    onChangeText={(value) => updateField('apellido_mat', normalizeUppercaseLettersOnly(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.telefonoInicial}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Teléfono"
                    value={formatPhone(form.telefonoInicial ?? '')}
                    onChangeText={(value) => updateField('telefonoInicial', normalizePhone(value))}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                </FormField>

                <DatePickerField
                  label="Fecha de nacimiento"
                  required
                  value={fechaNacimientoInput}
                  onChange={(value) => {
                    setFechaNacimientoInput(value);
                    // Convertir de DD-MMM-YYYY a DD/MM/YYYY para procesamiento
                    const parts = value.split('-');
                    if (parts.length === 3) {
                      const monthMap: { [key: string]: string } = {
                        'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
                        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
                        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
                      };
                      const ddmmyyyy = `${parts[0]}/${monthMap[parts[1]] || '01'}/${parts[2]}`;
                      const isoDate = toISODateFromDDMMYYYY(ddmmyyyy);
                      updateField('fecha_nac', isoDate);
                      setErrors({ ...errors, fecha_nac: validateFechaNacimientoField(isoDate) });
                    }
                  }}
                  errorText={errors.fecha_nac}
                />

                <FormField label="CURP" required helperText="18 caracteres" errorText={errors.curp}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="CURP"
                    value={form.curp}
                    onChangeText={handleCurpChange}
                    onBlur={handleCurpBlur}
                    autoCapitalize="characters"
                    maxLength={18}
                  />
                </FormField>

                {renderSelectCard('genero', 'Género', form.genero, GENERO_OPTIONS, errors.genero)}
                {renderSelectCard('estado_civil', 'Estado civil', form.estado_civil, ESTADO_CIVIL_OPTIONS, errors.estado_civil)}
                {renderSelectCard('nivel_estudio', 'Nivel de estudios', form.nivel_estudio, NIVEL_ESTUDIO_OPTIONS, errors.nivel_estudio)}
                {renderSelectCard('nacionalidad', 'Nacionalidad', form.nacionalidad, NACIONALIDADES_OPTIONS, errors.nacionalidad)}

                {form.nacionalidad === 'MEXICANA'
                  ? renderSelectCard('estado_nacimiento', 'Estado de nacimiento', form.estado_nacimiento, ESTADOS_MEXICO_OPTIONS, errors.estado_nacimiento, 'Selecciona una opción', 'Seleccionar estado')
                  : (
                    <FormField label="Estado de nacimiento" helperText="No aplica para nacionalidad extranjera">
                      <View style={styles.readOnlyField}>
                        <Text allowFontScaling={false} style={styles.valueText}>NO APLICA</Text>
                      </View>
                    </FormField>
                  )}

                <FormField label="Ocupación" required errorText={errors.ocupacion}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Ocupación"
                    value={form.ocupacion}
                    onChangeText={(value) => updateField('ocupacion', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>
              </>
            )}

            {/* PASO 2: DOMICILIO PARTICULAR */}
            {currentStep === 2 && (
              <>
                <FormField label="Calle" required errorText={errors.calle}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Calle"
                    value={form.calle}
                    onChangeText={(value) => updateField('calle', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Número exterior" required errorText={errors.numeroExterior}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Número exterior"
                    value={form.numeroExterior}
                    onChangeText={(value) => updateField('numeroExterior', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Número interior" helperText="Opcional">
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Número interior"
                    value={form.numeroInterior}
                    onChangeText={(value) => updateField('numeroInterior', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Entre calles" required errorText={errors.entreCalles}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Entre calles"
                    value={form.entreCalles}
                    onChangeText={(value) => updateField('entreCalles', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField
                  label="Código postal"
                  required
                  helperText={loadingColoniasDomicilio ? 'Buscando colonias...' : form.codigoPostal.length === 5 && coloniasDisponiblesDomicilio.length === 0 ? 'Código postal no encontrado' : '5 dígitos'}
                  errorText={errors.codigoPostal}
                >
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Código postal"
                    value={form.codigoPostal}
                    onChangeText={(value) => updateField('codigoPostal', normalizeDigits(value, 5))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </FormField>

                {coloniasDisponiblesDomicilio.length > 0
                  ? renderSelectCard('colonia', 'Colonia', form.colonia, coloniasDisponiblesDomicilio, errors.colonia, `${coloniasDisponiblesDomicilio.length} colonias disponibles`, 'Seleccionar colonia')
                  : (
                    <FormField label="Colonia" required errorText={errors.colonia}>
                      <TextInput allowFontScaling={false}
                        style={styles.input}
                        placeholder="Colonia"
                        value={form.colonia}
                        onChangeText={(value) => updateField('colonia', normalizeUppercaseText(value))}
                        autoCapitalize="characters"
                      />
                    </FormField>
                  )}

                {renderMunicipioSelector('municipio', form.municipio, errors.municipio)}

                {renderFixedState()}

                <FormField label="Teléfono" required helperText="10 dígitos">
                  <PhoneFieldWithCall
                    value={form.telefonoInicial}
                    onChange={(value) => updateField('telefonoInicial', value)}
                    placeholder="Teléfono"
                    nombre={integranteNombre || form.primerNombre || 'Integrante'}
                    relacion="Integrante - Teléfono Principal"
                  />
                </FormField>

                <FormField label="Teléfono secundario" helperText="Opcional, 10 dígitos">
                  <PhoneFieldWithCall
                    value={form.telefonoSecundario}
                    onChange={(value) => updateField('telefonoSecundario', value)}
                    placeholder="Teléfono secundario (opcional)"
                    nombre={integranteNombre || form.primerNombre || 'Integrante'}
                    relacion="Integrante - Teléfono Secundario"
                  />
                </FormField>
              </>
            )}

            {/* PASO 3: REFERENCIAS */}
            {currentStep === 3 && (
              <>
                <View style={styles.sectionRow}>
                  <Text allowFontScaling={false} style={styles.sectionTitle}>REFERENCIA 1</Text>
                </View>

                <FormField label="Nombre completo" required errorText={errors.referencia1NombreCompleto}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Nombre completo"
                    value={form.referencia1NombreCompleto}
                    onChangeText={(value) => updateField('referencia1NombreCompleto', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                {renderSelectCard('referencia1Parentesco', 'Parentesco', form.referencia1Parentesco, PARENTESCO_OPTIONS, errors.referencia1Parentesco)}

                <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.referencia1Telefono}>
                  <PhoneFieldWithCall
                    value={form.referencia1Telefono}
                    onChange={(value) => updatePhoneField('referencia1Telefono', value)}
                    placeholder="Teléfono"
                    nombre={form.referencia1NombreCompleto || 'Referencia 1'}
                    relacion={form.referencia1Parentesco ? `Referencia 1 - Parentesco: ${form.referencia1Parentesco}` : 'Referencia 1'}
                  />
                </FormField>

                <FormField label="Dirección" required errorText={errors.referencia1Direccion}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Dirección"
                    value={form.referencia1Direccion}
                    onChangeText={(value) => updateField('referencia1Direccion', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <View style={styles.sectionRow}>
                  <Text allowFontScaling={false} style={styles.sectionTitle}>REFERENCIA 2</Text>
                </View>

                <FormField label="Nombre completo" required errorText={errors.referencia2NombreCompleto}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Nombre completo"
                    value={form.referencia2NombreCompleto}
                    onChangeText={(value) => updateField('referencia2NombreCompleto', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                {renderSelectCard('referencia2Parentesco', 'Parentesco', form.referencia2Parentesco, PARENTESCO_OPTIONS, errors.referencia2Parentesco)}

                <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.referencia2Telefono}>
                  <PhoneFieldWithCall
                    value={form.referencia2Telefono}
                    onChange={(value) => updatePhoneField('referencia2Telefono', value)}
                    placeholder="Teléfono"
                    nombre={form.referencia2NombreCompleto || 'Referencia 2'}
                    relacion={form.referencia2Parentesco ? `Referencia 2 - Parentesco: ${form.referencia2Parentesco}` : 'Referencia 2'}
                  />
                </FormField>

                <FormField label="Dirección" required errorText={errors.referencia2Direccion}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Dirección"
                    value={form.referencia2Direccion}
                    onChangeText={(value) => updateField('referencia2Direccion', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <View style={styles.sectionRow}>
                  <Text allowFontScaling={false} style={styles.sectionTitle}>DATOS DE SU PAREJA</Text>
                </View>

                <FormField label="Nombre completo" helperText="Opcional">
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Nombre completo"
                    value={form.parejaNombreCompleto}
                    onChangeText={(value) => updateField('parejaNombreCompleto', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Actividad económica" helperText="Opcional">
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Actividad económica"
                    value={form.parejaActividadEconomica}
                    onChangeText={(value) => updateField('parejaActividadEconomica', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Ingreso semanal" helperText="Solo números">
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="$ 0"
                    value={form.pareja_ingreso_semanal ? formatCurrency(form.pareja_ingreso_semanal) : ''}
                    onChangeText={(value) => updateMoneyField('pareja_ingreso_semanal', value)}
                    keyboardType="numeric"
                  />
                </FormField>
              </>
            )}

            {/* PASO 4: NEGOCIO O TRABAJO */}
            {currentStep === 4 && (
              <>
                <FormField label="Calle" required errorText={errors.negocioCalle}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Calle"
                    value={form.negocioCalle}
                    onChangeText={(value) => updateField('negocioCalle', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Número exterior" required errorText={errors.negocioNumeroExterior}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Número exterior"
                    value={form.negocioNumeroExterior}
                    onChangeText={(value) => updateField('negocioNumeroExterior', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Número interior" helperText="Opcional">
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Número interior"
                    value={form.negocioNumeroInterior}
                    onChangeText={(value) => updateField('negocioNumeroInterior', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField
                  label="Código postal"
                  required
                  helperText={loadingColoniasNegocio ? 'Buscando colonias...' : form.negocioCodigoPostal.length === 5 && coloniasDisponiblesNegocio.length === 0 ? 'Código postal no encontrado' : '5 dígitos'}
                  errorText={errors.negocioCodigoPostal}
                >
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Código postal"
                    value={form.negocioCodigoPostal}
                    onChangeText={(value) => updateField('negocioCodigoPostal', normalizeDigits(value, 5))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </FormField>

                {coloniasDisponiblesNegocio.length > 0
                  ? renderSelectCard('negocio_colonia', 'Colonia', form.negocio_colonia, coloniasDisponiblesNegocio, errors.negocio_colonia, `${coloniasDisponiblesNegocio.length} colonias disponibles`, 'Seleccionar colonia')
                  : (
                    <FormField label="Colonia" required errorText={errors.negocio_colonia}>
                      <TextInput allowFontScaling={false}
                        style={styles.input}
                        placeholder="Colonia"
                        value={form.negocio_colonia}
                        onChangeText={(value) => updateField('negocio_colonia', normalizeUppercaseText(value))}
                        autoCapitalize="characters"
                      />
                    </FormField>
                  )}

                {renderMunicipioSelector('negocio_municipio', form.negocio_municipio, errors.negocio_municipio)}

                {renderFixedState()}

                {renderSelectCard(
                  'negocioDesdeCuando',
                  'Desde cuándo tiene su negocio o trabajo actual',
                  form.negocioDesdeCuando,
                  ANTIGUEDAD_NEGOCIO_OPTIONS,
                  errors.negocioDesdeCuando,
                  'Selecciona una opción',
                )}

                <FormField label="Giro del negocio o trabajo" required errorText={errors.negocio_giro}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Giro"
                    value={form.negocio_giro}
                    onChangeText={(value) => updateField('negocio_giro', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Ingreso semanal" required helperText="Solo números" errorText={errors.negocio_ingreso_semanal}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="$ 0"
                    value={form.negocio_ingreso_semanal ? formatCurrency(form.negocio_ingreso_semanal) : ''}
                    onChangeText={(value) => updateMoneyField('negocio_ingreso_semanal', value)}
                    keyboardType="numeric"
                  />
                </FormField>

                <FormField label="Otros ingresos" helperText="Opcional, solo números">
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="$ 0"
                    value={form.negocio_otros_ingresos ? formatCurrency(form.negocio_otros_ingresos) : ''}
                    onChangeText={(value) => updateMoneyField('negocio_otros_ingresos', value)}
                    keyboardType="numeric"
                  />
                </FormField>

                <FormField label="Gastos" required helperText="Solo números" errorText={errors.negocio_gastos}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="$ 0"
                    value={form.negocio_gastos ? formatCurrency(form.negocio_gastos) : ''}
                    onChangeText={(value) => updateMoneyField('negocio_gastos', value)}
                    keyboardType="numeric"
                  />
                </FormField>

                {renderReadOnlyField(
                  'Total',
                  formatCurrency(Number(form.negocio_total || 0)),
                  'Calculado automáticamente',
                  errors.negocio_total,
                )}
              </>
            )}

            {/* PASO 5: BENEFICIARIO */}
            {currentStep === 5 && (
              <>
                <FormField label="Nombre completo" required errorText={errors.beneficiarioNombreCompleto}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Nombre completo"
                    value={form.beneficiarioNombreCompleto}
                    onChangeText={(value) => updateField('beneficiarioNombreCompleto', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                {renderSelectCard('beneficiario_parentesco', 'Parentesco', form.beneficiario_parentesco, PARENTESCO_OPTIONS, errors.beneficiario_parentesco)}

                <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.beneficiario_telefono}>
                  <PhoneFieldWithCall
                    value={form.beneficiario_telefono}
                    onChange={(value) => updatePhoneField('beneficiario_telefono', value)}
                    placeholder="Teléfono"
                    nombre={form.beneficiarioNombreCompleto || 'Beneficiario'}
                    relacion={form.beneficiario_parentesco ? `Beneficiario - Parentesco: ${form.beneficiario_parentesco}` : 'Beneficiario'}
                  />
                </FormField>

                <FormField label="Dirección" required errorText={errors.beneficiario_direccion}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Dirección"
                    value={form.beneficiario_direccion}
                    onChangeText={(value) => updateField('beneficiario_direccion', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>
              </>
            )}

            {/* PASO 6: VALIDACIONES Y MONTO */}
            {currentStep === 6 && (
              <>
                {renderSelectCard('tieneMedidorLuzSinAdeudo', '¿Tiene medidor de luz sin adeudo?', form.tieneMedidorLuzSinAdeudo, yesNoOptions, errors.tieneMedidorLuzSinAdeudo)}
                {renderSelectCard('viveMaximo5KmTesorera', '¿La integrante vive a máximo 5 km de la tesorera?', form.viveMaximo5KmTesorera, yesNoOptions, errors.viveMaximo5KmTesorera)}

                {/* Pregunta de 70 años con edad en burbuja */}
                {renderEdadConPregunta()}

                <FormField label="Monto solicitado" required helperText={`Máximo ${formatCurrency(MAX_SOLICITUD_AMOUNT)}`} errorText={errors.montoSolicitado}>
                  <TextInput allowFontScaling={false}
                    style={styles.input}
                    placeholder="Monto solicitado"
                    value={form.montoSolicitado ? formatCurrency(form.montoSolicitado) : ''}
                    onChangeText={(value) => updateField('montoSolicitado', normalizeDigits(value))}
                    keyboardType="numeric"
                  />
                </FormField>
              </>
            )}

            {/* PASO 7: DOCUMENTACIÓN */}
            {currentStep === 7 && (
              <>
                <View style={styles.documentacionHeader}>
                  <Text allowFontScaling={false} style={styles.documentacionTitle}>Documentos Requeridos</Text>
                  <Text allowFontScaling={false} style={styles.documentacionSubtitle}>
                    Debes cargar los 4 documentos obligatorios para continuar
                  </Text>
                </View>

                {documentos.map((doc) => (
                  <View key={doc.id} style={styles.documentoRow}>
                    <View style={styles.documentoInfo}>
                      <Text allowFontScaling={false} style={styles.documentoNombre}>{doc.nombre}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          doc.status === 'CARGADO' && styles.statusBadgeCargado,
                          doc.status === 'PENDIENTE' && styles.statusBadgePendiente,
                          doc.status === 'OPCIONAL' && styles.statusBadgeOpcional,
                        ]}
                      >
                        <Text allowFontScaling={false}
                          style={[
                            styles.statusBadgeText,
                            doc.status === 'CARGADO' && styles.statusBadgeTextCargado,
                            doc.status === 'PENDIENTE' && styles.statusBadgeTextPendiente,
                            doc.status === 'OPCIONAL' && styles.statusBadgeTextOpcional,
                          ]}
                        >
                          {doc.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.documentoActions}>
                      {doc.status === 'CARGADO' && doc.uriFrente && (
                        <TouchableOpacity
                          style={styles.verButton}
                          activeOpacity={0.7}
                          onPress={() => handleVerDocumento(doc)}
                        >
                          <Text allowFontScaling={false} style={styles.verButtonText}>👁️ Ver</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.subirButton,
                          uploadingDocId === doc.id && styles.subirButtonDisabled,
                          doc.status === 'CARGADO' && styles.subirButtonCargado,
                        ]}
                        activeOpacity={0.7}
                        disabled={uploadingDocId === doc.id}
                        onPress={() => handleSubirDocumento(doc.id)}
                      >
                        {uploadingDocId === doc.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text allowFontScaling={false} style={styles.subirButtonText}>
                            {doc.status === 'CARGADO' ? 'Actualizar' : 'Subir'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <View style={styles.documentacionFooter}>
                  <Text allowFontScaling={false} style={styles.documentacionFooterText}>
                    * El Comprobante Línea de Crédito es opcional
                  </Text>
                </View>
              </>
            )}
          </Card>
        </ScrollView>

        {/* Botones de navegación fijos en la parte inferior */}
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleAtras}
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
              onPress={handleContinuar}
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
              onPress={handleMarcarCapturado}
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

      {/* Modal para ver imágenes */}
      <Modal
        visible={viewingImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewingImage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text allowFontScaling={false} style={styles.modalTitle}>{viewingImage?.titulo}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setViewingImage(null)}
              >
                <Text allowFontScaling={false} style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {viewingImage?.uri && (
              <Image
                source={{ uri: viewingImage.uri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para previsualizar y confirmar documento */}
      <Modal
        visible={previewImage !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelarDocumento}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text allowFontScaling={false} style={styles.modalTitle}>{previewImage?.titulo}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCancelarDocumento}
              >
                <Text allowFontScaling={false} style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.previewScrollContent}>
              {previewImage?.uri && (
                <View style={styles.previewImageContainer}>
                  <Text allowFontScaling={false} style={styles.previewLabel}>
                    {previewImage.reversoUri ? 'Frente' : 'Documento'}
                  </Text>
                  <Image
                    source={{ uri: previewImage.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </View>
              )}

              {previewImage?.reversoUri && (
                <View style={styles.previewImageContainer}>
                  <Text allowFontScaling={false} style={styles.previewLabel}>Reverso</Text>
                  <Image
                    source={{ uri: previewImage.reversoUri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewCancelButton}
                onPress={handleCancelarDocumento}
                activeOpacity={0.8}
              >
                <Text allowFontScaling={false} style={styles.previewCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.previewSaveButton}
                onPress={handleConfirmarDocumento}
                activeOpacity={0.8}
              >
                <Text allowFontScaling={false} style={styles.previewSaveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
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
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: spacing.sm,
  },
  phoneRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.3,
    gap: 6,
  },
  phoneDisplayContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  phoneIconButton: {
    backgroundColor: '#EFF6FF',
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
  montoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    gap: spacing.xs,
    flex: 1,
  },
  montoIcon: {
    fontSize: 18,
  },
  montoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
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
  sectionRow: {
    width: '100%',
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  optionCard: {
    marginVertical: spacing.sm,
    paddingVertical: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  valueText: {
    color: colors.textPrimary,
    ...typography.body,
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.borderSoft,
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
  documentacionHeader: {
    marginBottom: spacing.lg,
  },
  documentacionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  documentacionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  documentoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  documentoInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  documentoNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgePendiente: {
    backgroundColor: '#E5E7EB',
  },
  statusBadgeCargado: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeOpcional: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadgeTextPendiente: {
    color: '#6B7280',
  },
  statusBadgeTextCargado: {
    color: '#059669',
  },
  statusBadgeTextOpcional: {
    color: '#D97706',
  },
  subirButton: {
    backgroundColor: moduleThemes.documentation.headerBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  subirButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  subirButtonCargado: {
    backgroundColor: '#059669',
  },
  subirButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  documentacionFooter: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  documentacionFooterText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  documentoActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  verButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  verButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    height: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  modalCloseButton: {
    padding: spacing.sm,
  },
  modalCloseText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  modalImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewScrollContent: {
    padding: spacing.md,
  },
  previewImageContainer: {
    marginBottom: spacing.lg,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewCancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: moduleThemes.documentation.headerBg,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCancelButtonText: {
    color: moduleThemes.documentation.headerBg,
    fontSize: 16,
    fontWeight: '600',
  },
  previewSaveButton: {
    flex: 1,
    backgroundColor: moduleThemes.documentation.headerBg,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  edadPreguntaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  edadBurbuja: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    marginTop: 32,
  },
  edadBurbujaTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
});
