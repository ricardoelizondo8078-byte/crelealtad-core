import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Alert,
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
} from 'react-native';
import { AppHeader, Card, FormField, PrimaryButton, ScreenContainer, ScreenTitleBar, SecondaryButton, SelectorField, StickySectionHeader } from '../../components/ui';
import { apiUrl } from '../../config/api';
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
  placeholder = 'Teléfono'
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => {
  const digitos = value?.replace(/\D/g, '') ?? '';
  const esValido = digitos.length === 10;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <TextInput
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
          onPress={() => llamar(value)}
          style={{
            backgroundColor: '#EFF6FF',
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 20 }}>📞</Text>
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
  onSaved,
  onSavedGoToDocumentos,
  onBack,
  onDataChange,
}) => {
  const documentationTheme = moduleThemes.documentation;
  const [currentStep, setCurrentStep] = useState(1);
  const [documentos, setDocumentos] = useState<DocumentoRequerido[]>(DOCUMENTOS_REQUERIDOS);
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
          } else if (key === 'montoSolicitado') {
            datosSolicitante.montoSolicitado = Number(value);
          } else {
            datosSolicitante[key] = value;
          }
        } else {
          datosSolicitud[key] = value;
        }
      }
    });

    try {
      // Guardar datos básicos
      if (Object.keys(datosSolicitante).length > 0) {
        if (datosSolicitante.nombres || datosSolicitante.apellido_pat || datosSolicitante.apellido_mat) {
          const nombreCompleto = `${datosSolicitante.nombres || form.nombres || ''} ${datosSolicitante.apellido_pat || form.apellido_pat || ''} ${datosSolicitante.apellido_mat || form.apellido_mat || ''}`.trim();
          if (nombreCompleto) {
            datosSolicitante.nombre = nombreCompleto;
          }
        }

        await fetch(apiUrl(`/integrantes/${integranteId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosSolicitante),
        });
      }

      // Guardar formulario
      if (Object.keys(datosSolicitud).length > 0) {
        await fetch(apiUrl(`/solicitudes/${integranteId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosSolicitud),
        });
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
        const integranteResponse = await fetch(apiUrl(`/integrantes/${integranteId}`));
        if (integranteResponse.ok) {
          integranteData = await integranteResponse.json();
          setIntegrante(integranteData);

          // Pre-cargar datos iniciales del integrante en el formulario
          // Si no tiene nombres separados, intentar parsear del nombre completo
          let nombres = integranteData.nombres || '';
          let apellido_pat = integranteData.apellido_pat || '';
          let apellido_mat = integranteData.apellido_mat || '';

          // Fallback: si no hay nombres separados, intentar extraer del nombre completo
          if (!nombres && !apellido_pat && !apellido_mat && integranteData.nombre) {
            const parts = integranteData.nombre.trim().split(/\s+/);
            if (parts.length >= 3) {
              // Asumir formato: Nombre(s) apellido_pat apellido_mat
              apellido_mat = parts.pop() || '';
              apellido_pat = parts.pop() || '';
              nombres = parts.join(' ');
            } else if (parts.length === 2) {
              // Solo tiene 2 partes: Nombre apellido_pat
              apellido_pat = parts[1] || '';
              nombres = parts[0] || '';
            } else if (parts.length === 1) {
              // Solo tiene nombre
              nombres = parts[0] || '';
            }
          }

          setForm((current) => ({
            ...current,
            nombres: nombres,
            apellido_pat: apellido_pat,
            apellido_mat: apellido_mat,
            telefonoInicial: integranteData.telefono || '',
            telefonoSecundario: integranteData.telefonoSecundario || '',
            montoSolicitado: String(integranteData.montoSolicitado || ''),
          }));
        }

        const response = await fetch(apiUrl(`/solicitudes/solicitante/${integranteId}`));
        if (response.ok) {
          const text = await response.text();
          if (!text) {
            // No hay solicitud guardada, mantener datos iniciales del integrante
            setIsLoadingSolicitud(false);
            return;
          }

          const data = JSON.parse(text);
          if (data) {
            // Parsear la fecha de nacimiento de ISO a DD/MM/YYYY para display
            const fecha_nac_display = data.fecha_nac ? formatISODateToDDMMYYYY(data.fecha_nac) : '';

            // BUG 3 FIX: Datos básicos SIEMPRE vienen de integranteData (tabla integrantes)
            // El formulario (data) NO tiene estos campos
            const montoFromIntegrante = integranteData?.montoSolicitado ? String(Number(integranteData.montoSolicitado)) : '';

            setForm({
              // Datos básicos de identidad (fuente: tabla integrantes)
              nombres: integranteData?.nombres || '',
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
              codigoPostal: data.dom_cp_id || data.codigoPostal || '',
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

              negocioCalle: data.negocio_domicilio?.split(' ')[0] || data.negocioCalle || '',
              negocioNumeroExterior: data.negocioNumeroExterior || '',
              negocioNumeroInterior: data.negocioNumeroInterior || '',
              negocio_colonia: data.negocio_colonia || '',
              negocio_municipio: data.negocio_municipio || '',
              negocioEstado: data.negocioEstado || DEFAULT_STATE,
              negocioCodigoPostal: data.negocioCodigoPostal || '',
              negocioDesdeCuando: data.negocioDesdeCuando || '',
              negocio_ingreso_semanal: data.negocio_ingreso_semanal ? String(data.negocio_ingreso_semanal) : '',
              negocio_otros_ingresos: data.negocio_otros_ingresos ? String(data.negocio_otros_ingresos) : '',
              negocio_gastos: data.negocio_gastos_nuevo ? String(data.negocio_gastos_nuevo) : '',
              negocio_total: data.negocio_total ? String(data.negocio_total) : '',
              negocio_giro: data.negocio_giro_nuevo || data.negocio_giro || '',

              beneficiarioNombreCompleto: data.beneficiario_nombre || '',
              beneficiario_parentesco: data.beneficiario_parentesco || '',
              beneficiario_telefono: data.beneficiario_telefono || '',
              beneficiario_direccion: data.beneficiario_direccion || '',

              tieneMedidorLuzSinAdeudo: data.tiene_medidor_luz === true ? 'SI' : data.tiene_medidor_luz === false ? 'NO' : '',
              viveMaximo5KmTesorera: data.vive_max_5km_tesorera === true ? 'SI' : data.vive_max_5km_tesorera === false ? 'NO' : '',
              tiene_menos_70_anios: data.tiene_menos_70_anios === true ? 'SI' : data.tiene_menos_70_anios === false ? 'NO' : '',
            });

            setFechaNacimientoInput(fecha_nac_display);
          }
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

  const domicilioPostalEntry = useMemo(() => findPostalCodeEntry(form.codigoPostal), [form.codigoPostal]);
  const negocioPostalEntry = useMemo(() => findPostalCodeEntry(form.negocioCodigoPostal), [form.negocioCodigoPostal]);
  const domicilioColonias = useMemo(() => getColoniasByPostalCode(form.codigoPostal), [form.codigoPostal]);
  const negocioColonias = useMemo(() => getColoniasByPostalCode(form.negocioCodigoPostal), [form.negocioCodigoPostal]);
  const domicilioPostalNotFound = useMemo(() => form.codigoPostal.trim().length === 5 && !domicilioPostalEntry, [form.codigoPostal, domicilioPostalEntry]);
  const negocioPostalNotFound = useMemo(() => form.negocioCodigoPostal.trim().length === 5 && !negocioPostalEntry, [form.negocioCodigoPostal, negocioPostalEntry]);

  useEffect(() => {
    if (!domicilioPostalEntry) {
      return;
    }

    setForm((current) => {
      const colonias = getColoniasByPostalCode(current.codigoPostal);
      const nextColonia = colonias.includes(current.colonia) ? current.colonia : '';

      if (
        current.municipio === domicilioPostalEntry.municipio &&
        current.estado === domicilioPostalEntry.estado &&
        current.colonia === nextColonia
      ) {
        return current;
      }

      return {
        ...current,
        colonia: nextColonia,
        municipio: domicilioPostalEntry.municipio,
        estado: domicilioPostalEntry.estado,
      };
    });

    setErrors((current) => ({
      ...current,
      municipio: undefined,
    }));
  }, [domicilioPostalEntry]);

  useEffect(() => {
    if (!negocioPostalEntry) {
      return;
    }

    setForm((current) => {
      const colonias = getColoniasByPostalCode(current.negocioCodigoPostal);
      const nextColonia = colonias.includes(current.negocio_colonia) ? current.negocio_colonia : '';

      if (
        current.negocio_municipio === negocioPostalEntry.municipio &&
        current.negocioEstado === negocioPostalEntry.estado &&
        current.negocio_colonia === nextColonia
      ) {
        return current;
      }

      return {
        ...current,
        negocio_colonia: nextColonia,
        negocio_municipio: negocioPostalEntry.municipio,
        negocioEstado: negocioPostalEntry.estado,
      };
    });

    setErrors((current) => ({
      ...current,
      negocio_municipio: undefined,
    }));
  }, [negocioPostalEntry]);

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
      // Guardar datos básicos del integrante (paso 1)
      if (currentStep === 1) {
        const nombreCompleto = `${form.nombres} ${form.apellido_pat} ${form.apellido_mat}`.trim();
        await fetch(apiUrl(`/integrantes/${integranteId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombres: form.nombres,
            apellido_pat: form.apellido_pat,
            apellido_mat: form.apellido_mat,
            nombre: nombreCompleto,
            telefono: form.telefonoInicial,
            montoSolicitado: Number(form.montoSolicitado),
          }),
        });
      }

      // Guardar datos de la solicitud (todos los pasos)
      const solicitudData: any = {
        primer_nombre: form.nombres,
        apellido_pat: form.apellido_pat,
        apellido_mat: form.apellido_mat,
        fechaNacimiento: form.fecha_nac ? toISODateFromDDMMYYYY(form.fecha_nac) : null,
        curp: form.curp,
        genero: form.genero,
        estado_civil: form.estado_civil,
        ocupacion: form.ocupacion,
        nivel_estudio: form.nivel_estudio,
        nacionalidad: form.nacionalidad,
        estado_nacimiento_nuevo: form.estado_nacimiento,
        dom_calle: form.calle,
        dom_num_ext: form.numeroExterior,
        dom_num_int: form.numeroInterior,
        dom_entre_calles: form.entreCalles,
        dom_colonia: form.colonia,
        dom_municipio: form.municipio,
        dom_telefono: form.telefonoInicial,
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
        pareja_ingreso_semanal: form.pareja_ingreso_semanal ? Number(form.pareja_ingreso_semanal) : null,
        negocio_domicilio: `${form.negocioCalle} ${form.negocioNumeroExterior}`.trim(),
        negocio_colonia: form.negocio_colonia,
        negocio_municipio: form.negocio_municipio,
        negocio_giro: form.negocio_giro,
        negocio_ingreso_semanal: form.negocio_ingreso_semanal ? Number(form.negocio_ingreso_semanal) : null,
        negocio_otros_ingresos: form.negocio_otros_ingresos ? Number(form.negocio_otros_ingresos) : null,
        negocio_gastos: form.negocio_gastos ? Number(form.negocio_gastos) : null,
        negocio_total: form.negocio_total ? Number(form.negocio_total) : null,
        beneficiario_nombre: form.beneficiarioNombreCompleto,
        beneficiario_parentesco: form.beneficiario_parentesco,
        beneficiario_telefono: form.beneficiario_telefono,
        beneficiario_direccion: form.beneficiario_direccion,
        tiene_medidor_luz: form.tieneMedidorLuzSinAdeudo === 'SI' ? true : form.tieneMedidorLuzSinAdeudo === 'NO' ? false : null,
        vive_max_5km_tesorera: form.viveMaximo5KmTesorera === 'SI' ? true : form.viveMaximo5KmTesorera === 'NO' ? false : null,
        tiene_menos_70_anios: form.tiene_menos_70_anios === 'SI' ? true : form.tiene_menos_70_anios === 'NO' ? false : null,
        monto_solicitado: form.montoSolicitado ? Number(form.montoSolicitado) : null,
      };

      // Intentar PATCH primero, si falla hacer POST
      try {
        console.log('💾 Guardando solicitud para integrante:', integranteId);
        console.log('💾 Datos a guardar:', JSON.stringify(solicitudData).slice(0, 200));

        const patchResponse = await fetch(apiUrl(`/solicitudes/integrante/${integranteId}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(solicitudData),
        });

        console.log('💾 Respuesta PATCH status:', patchResponse.status);

        if (patchResponse.status === 404) {
          console.log('💾 Creando nueva solicitud con POST');
          // No existe — crear con POST
          await fetch(apiUrl('/solicitudes'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              integrante_id: integranteId,
              ...solicitudData,
            }),
          });
        }
      } catch (err) {
        console.error('Error guardando solicitud:', err);
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

  const handleMarcarCapturado = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    setAutoSaveStatus('saving');

    try {
      // 1. Guardar formulario completo
      const payload = {
        integranteId,
        ...form,
        telefono: form.telefonoInicial,
        domicilio: `${form.calle} ${form.numeroExterior}${form.numeroInterior ? ` INT ${form.numeroInterior}` : ''}, ${form.colonia}, ${form.municipio}, ${form.estado}, CP ${form.codigoPostal}`,
        negocio_domicilio: `${form.negocioCalle} ${form.negocioNumeroExterior}${form.negocioNumeroInterior ? ` INT ${form.negocioNumeroInterior}` : ''}, ${form.negocio_colonia}, ${form.negocio_municipio}, ${form.negocioEstado}, CP ${form.negocioCodigoPostal}`,
      };

      const solicitudResponse = await fetch(apiUrl('/solicitudes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!solicitudResponse.ok) {
        throw new Error('Error guardando solicitud');
      }

      // 2. Cambiar estado a SUJETA_CREDITO
      const estadoResponse = await fetch(apiUrl(`/integrantes/${integranteId}/estado`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'SUJETA_CREDITO' }),
      });

      if (!estadoResponse.ok) {
        throw new Error('Error actualizando estado');
      }

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
        <Text style={styles.valueText}>{value}</Text>
      </View>
    </FormField>
  );

  const renderFixedState = () => (
    <FormField label="Estado">
      <View style={styles.readOnlyField}>
        <Text style={styles.valueText}>{DEFAULT_STATE}</Text>
      </View>
    </FormField>
  );

  const renderMunicipioSelector = (field: 'municipio' | 'negocio_municipio', value: string, error?: string) =>
    renderSelectCard(field, 'Municipio', value, NUEVO_LEON_MUNICIPALITIES, error, 'Selecciona un municipio', 'Seleccionar municipio');

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
        <Text style={styles.grupoBannerText}>{groupName || 'Cargando grupo...'}</Text>
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
              <Text style={styles.integranteName}>
                {integrante?.nombre || integranteNombre || 'Sin nombre'}
              </Text>

              {/* Número a la derecha */}
              {integrantePosition && integrantesTotal && (
                <Text style={styles.positionText}>
                  {integrantePosition}/{integrantesTotal}
                </Text>
              )}
            </View>

            {/* Teléfono y Monto */}
            {integrante && (
              <View style={styles.contactInfoRow}>
                {/* Teléfono con ícono - CLICKEABLE */}
                <TouchableOpacity
                  style={styles.phoneButton}
                  onPress={() => handleLlamarIntegrante(integrante.telefono, integrante.nombre)}
                >
                  <Text style={styles.phoneIcon}>📞</Text>
                  <Text style={styles.phoneText}>{formatPhone(integrante.telefono ?? '')}</Text>
                </TouchableOpacity>

                {/* Monto */}
                <View style={styles.montoContainer}>
                  <Text style={styles.montoIcon}>💰</Text>
                  <Text style={styles.montoText}>{formatCurrency(integrante.montoSolicitado)}</Text>
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* Barra de progreso del wizard */}
        <View style={styles.wizardProgressContainer}>
          <View style={styles.wizardHeader}>
            <Text style={styles.wizardStepText}>
              Paso {currentStep} de {WIZARD_STEPS.length}
            </Text>
            <Text style={styles.wizardStepTitle}>
              {WIZARD_STEPS[currentStep - 1].title}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {/* Indicador de autosave */}
        <View style={styles.autoSaveIndicatorContainer}>
          {autoSaveStatus === 'saving' && (
            <Text style={styles.autoSaveTextSaving}>Guardando...</Text>
          )}
          {autoSaveStatus === 'saved' && (
            <Text style={styles.autoSaveTextSaved}>Guardado ✓</Text>
          )}
          {autoSaveStatus === 'error' && (
            <Text style={styles.autoSaveTextError}>Error al guardar</Text>
          )}
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <Card>
            {/* PASO 1: INFORMACIÓN PERSONAL */}
            {currentStep === 1 && (
              <>
                <FormField label="Nombre(s)" required errorText={errors.nombres}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre(s)"
                    value={form.nombres}
                    onChangeText={(value) => updateField('nombres', normalizeUppercaseLettersOnly(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Apellido paterno" required errorText={errors.apellido_pat}>
                  <TextInput
                    style={styles.input}
                    placeholder="Apellido paterno"
                    value={form.apellido_pat}
                    onChangeText={(value) => updateField('apellido_pat', normalizeUppercaseLettersOnly(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Apellido materno" required errorText={errors.apellido_mat}>
                  <TextInput
                    style={styles.input}
                    placeholder="Apellido materno"
                    value={form.apellido_mat}
                    onChangeText={(value) => updateField('apellido_mat', normalizeUppercaseLettersOnly(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.telefonoInicial}>
                  <TextInput
                    style={styles.input}
                    placeholder="Teléfono"
                    value={formatPhone(form.telefonoInicial ?? '')}
                    onChangeText={(value) => updateField('telefonoInicial', normalizePhone(value))}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                </FormField>

                <FormField
                  label="Fecha de nacimiento"
                  required
                  helperText="Formato DD/MM/AAAA (se muestra DD/MMM/AAAA)"
                  errorText={errors.fecha_nac}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    value={fechaNacimientoInput}
                    onChangeText={handleFechaNacimientoChange}
                    onBlur={handleFechaNacimientoBlur}
                    onFocus={handleFechaNacimientoFocus}
                    keyboardType="number-pad"
                    maxLength={11}
                  />
                </FormField>

                <FormField label="CURP" required helperText="18 caracteres" errorText={errors.curp}>
                  <TextInput
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
                        <Text style={styles.valueText}>NO APLICA</Text>
                      </View>
                    </FormField>
                  )}

                <FormField label="Ocupación" required errorText={errors.ocupacion}>
                  <TextInput
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
                  <TextInput
                    style={styles.input}
                    placeholder="Calle"
                    value={form.calle}
                    onChangeText={(value) => updateField('calle', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Número exterior" required errorText={errors.numeroExterior}>
                  <TextInput
                    style={styles.input}
                    placeholder="Número exterior"
                    value={form.numeroExterior}
                    onChangeText={(value) => updateField('numeroExterior', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Número interior" helperText="Opcional">
                  <TextInput
                    style={styles.input}
                    placeholder="Número interior"
                    value={form.numeroInterior}
                    onChangeText={(value) => updateField('numeroInterior', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Entre calles" required errorText={errors.entreCalles}>
                  <TextInput
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
                  helperText={domicilioPostalNotFound ? 'Código postal no encontrado en catálogo local' : '5 dígitos'}
                  errorText={errors.codigoPostal}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Código postal"
                    value={form.codigoPostal}
                    onChangeText={(value) => updateField('codigoPostal', normalizeDigits(value, 5))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </FormField>

                {domicilioPostalEntry
                  ? renderSelectCard('colonia', 'Colonia', form.colonia, domicilioColonias, errors.colonia, 'Selecciona una colonia', 'Seleccionar colonia')
                  : (
                    <FormField label="Colonia" required errorText={errors.colonia}>
                      <TextInput
                        style={styles.input}
                        placeholder="Colonia"
                        value={form.colonia}
                        onChangeText={(value) => updateField('colonia', normalizeUppercaseText(value))}
                        autoCapitalize="characters"
                      />
                    </FormField>
                  )}

                {domicilioPostalEntry
                  ? renderReadOnlyField('Municipio', domicilioPostalEntry.municipio, 'Autocompletado por código postal', errors.municipio)
                  : renderMunicipioSelector('municipio', form.municipio, errors.municipio)}

                {renderFixedState()}

                <FormField label="Teléfono" required helperText="10 dígitos">
                  <TextInput
                    key="telefono-inicial-paso2"
                    style={styles.input}
                    placeholder="Teléfono"
                    value={formatPhone(form.telefonoInicial ?? '')}
                    onChangeText={(v) => updateField('telefonoInicial', normalizePhone(v))}
                    keyboardType="numeric"
                    maxLength={14}
                    blurOnSubmit={false}
                  />
                </FormField>

                <FormField label="Teléfono secundario" helperText="Opcional, 10 dígitos">
                  <TextInput
                    key="telefono-secundario-paso2"
                    style={styles.input}
                    placeholder="Teléfono secundario (opcional)"
                    value={formatPhone(form.telefonoSecundario ?? '')}
                    onChangeText={(v) => updateField('telefonoSecundario', normalizePhone(v))}
                    keyboardType="numeric"
                    maxLength={14}
                    blurOnSubmit={false}
                  />
                </FormField>
              </>
            )}

            {/* PASO 3: REFERENCIAS */}
            {currentStep === 3 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>REFERENCIA 1</Text>
                </View>

                <FormField label="Nombre completo" required errorText={errors.referencia1NombreCompleto}>
                  <TextInput
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
                  />
                </FormField>

                <FormField label="Dirección" required errorText={errors.referencia1Direccion}>
                  <TextInput
                    style={styles.input}
                    placeholder="Dirección"
                    value={form.referencia1Direccion}
                    onChangeText={(value) => updateField('referencia1Direccion', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>REFERENCIA 2</Text>
                </View>

                <FormField label="Nombre completo" required errorText={errors.referencia2NombreCompleto}>
                  <TextInput
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
                  />
                </FormField>

                <FormField label="Dirección" required errorText={errors.referencia2Direccion}>
                  <TextInput
                    style={styles.input}
                    placeholder="Dirección"
                    value={form.referencia2Direccion}
                    onChangeText={(value) => updateField('referencia2Direccion', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>DATOS DE SU PAREJA</Text>
                </View>

                <FormField label="Nombre completo" helperText="Opcional">
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre completo"
                    value={form.parejaNombreCompleto}
                    onChangeText={(value) => updateField('parejaNombreCompleto', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Actividad económica" helperText="Opcional">
                  <TextInput
                    style={styles.input}
                    placeholder="Actividad económica"
                    value={form.parejaActividadEconomica}
                    onChangeText={(value) => updateField('parejaActividadEconomica', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Ingreso semanal" helperText="Solo números">
                  <TextInput
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
                  <TextInput
                    style={styles.input}
                    placeholder="Calle"
                    value={form.negocioCalle}
                    onChangeText={(value) => updateField('negocioCalle', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Número exterior" required errorText={errors.negocioNumeroExterior}>
                  <TextInput
                    style={styles.input}
                    placeholder="Número exterior"
                    value={form.negocioNumeroExterior}
                    onChangeText={(value) => updateField('negocioNumeroExterior', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Número interior" helperText="Opcional">
                  <TextInput
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
                  helperText={negocioPostalNotFound ? 'Código postal no encontrado en catálogo local' : '5 dígitos'}
                  errorText={errors.negocioCodigoPostal}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Código postal"
                    value={form.negocioCodigoPostal}
                    onChangeText={(value) => updateField('negocioCodigoPostal', normalizeDigits(value, 5))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </FormField>

                {negocioPostalEntry
                  ? renderSelectCard('negocio_colonia', 'Colonia', form.negocio_colonia, negocioColonias, errors.negocio_colonia, 'Selecciona una colonia', 'Seleccionar colonia')
                  : (
                    <FormField label="Colonia" required errorText={errors.negocio_colonia}>
                      <TextInput
                        style={styles.input}
                        placeholder="Colonia"
                        value={form.negocio_colonia}
                        onChangeText={(value) => updateField('negocio_colonia', normalizeUppercaseText(value))}
                        autoCapitalize="characters"
                      />
                    </FormField>
                  )}

                {negocioPostalEntry
                  ? renderReadOnlyField('Municipio', negocioPostalEntry.municipio, 'Autocompletado por código postal', errors.negocio_municipio)
                  : renderMunicipioSelector('negocio_municipio', form.negocio_municipio, errors.negocio_municipio)}

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
                  <TextInput
                    style={styles.input}
                    placeholder="Giro"
                    value={form.negocio_giro}
                    onChangeText={(value) => updateField('negocio_giro', normalizeUppercaseText(value))}
                    autoCapitalize="characters"
                  />
                </FormField>

                <FormField label="Ingreso semanal" required helperText="Solo números" errorText={errors.negocio_ingreso_semanal}>
                  <TextInput
                    style={styles.input}
                    placeholder="$ 0"
                    value={form.negocio_ingreso_semanal ? formatCurrency(form.negocio_ingreso_semanal) : ''}
                    onChangeText={(value) => updateMoneyField('negocio_ingreso_semanal', value)}
                    keyboardType="numeric"
                  />
                </FormField>

                <FormField label="Otros ingresos" helperText="Opcional, solo números">
                  <TextInput
                    style={styles.input}
                    placeholder="$ 0"
                    value={form.negocio_otros_ingresos ? formatCurrency(form.negocio_otros_ingresos) : ''}
                    onChangeText={(value) => updateMoneyField('negocio_otros_ingresos', value)}
                    keyboardType="numeric"
                  />
                </FormField>

                <FormField label="Gastos" required helperText="Solo números" errorText={errors.negocio_gastos}>
                  <TextInput
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
                  <TextInput
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
                  />
                </FormField>

                <FormField label="Dirección" required errorText={errors.beneficiario_direccion}>
                  <TextInput
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
                {renderSelectCard('tiene_menos_70_anios', '¿La integrante tiene menos de 70 años?', form.tiene_menos_70_anios, yesNoOptions, errors.tiene_menos_70_anios)}

                <FormField label="Monto solicitado" required helperText={`Máximo ${formatCurrency(MAX_SOLICITUD_AMOUNT)}`} errorText={errors.montoSolicitado}>
                  <TextInput
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
                  <Text style={styles.documentacionTitle}>Documentos Requeridos</Text>
                  <Text style={styles.documentacionSubtitle}>
                    Debes cargar los 4 documentos obligatorios para continuar
                  </Text>
                </View>

                {documentos.map((doc) => (
                  <View key={doc.id} style={styles.documentoRow}>
                    <View style={styles.documentoInfo}>
                      <Text style={styles.documentoNombre}>{doc.nombre}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          doc.status === 'CARGADO' && styles.statusBadgeCargado,
                          doc.status === 'PENDIENTE' && styles.statusBadgePendiente,
                          doc.status === 'OPCIONAL' && styles.statusBadgeOpcional,
                        ]}
                      >
                        <Text
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
                    <TouchableOpacity
                      style={styles.subirButton}
                      activeOpacity={0.7}
                      onPress={() => {
                        // Por ahora solo visual, sin funcionalidad
                        console.log('Subir documento:', doc.id);
                      }}
                    >
                      <Text style={styles.subirButtonText}>Subir</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.documentacionFooter}>
                  <Text style={styles.documentacionFooterText}>
                    * El Comprobante Línea de Crédito es opcional
                  </Text>
                </View>
              </>
            )}
          </Card>
        </ScrollView>

        {/* Botones de navegación fijos en la parte inferior */}
        <View style={styles.navigationButtons}>
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
              <Text style={styles.continueButtonText}>Continuar →</Text>
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
              <Text style={styles.continueButtonText}>
                {isSubmitting ? 'Guardando...' : 'Marcar como Capturado'}
              </Text>
            </TouchableOpacity>
          )}

          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleAtras}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>← Atrás</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  form: { padding: spacing.lg, gap: spacing.md, paddingBottom: 200 },
  grupoBanner: {
    backgroundColor: moduleThemes.documentation.headerBg,
    paddingVertical: spacing.md,
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
    letterSpacing: 1,
  },
  fixedSolicitanteContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  integranteCard: {
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#000000',
    marginBottom: 0,
  },
  integranteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  integranteName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 18,
    flex: 1,
    textAlign: 'left',
  },
  positionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    textAlign: 'right',
  },
  contactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: spacing.sm,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
  },
  phoneIcon: {
    fontSize: 16,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  montoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  montoIcon: {
    fontSize: 16,
  },
  montoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  wizardProgressContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    flexDirection: 'column',
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
    width: '100%',
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
    width: '100%',
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
});
