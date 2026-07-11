import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import { MAX_SOLICITUD_AMOUNT } from '../../config/parameters';
import { validateCURP } from '../../utils/validation';

type SelectValue = string;
type SelectorFieldKey =
  | 'nacionalidad'
  | 'estadoNacimiento'
  | 'genero'
  | 'estadoCivil'
  | 'nivelEstudio'
  | 'colonia'
  | 'municipio'
  | 'negocioColonia'
  | 'negocioMunicipio'
  | 'negocioDesdeCuando'
  | 'referencia1Parentesco'
  | 'referencia2Parentesco'
  | 'beneficiarioParentesco'
  | 'tieneMedidorLuzSinAdeudo'
  | 'viveMaximo5KmTesorera'
  | 'tieneMenos70Anios';

interface SolicitudFormScreenProps {
  solicitanteId: string;
  solicitanteNombre?: string;
  groupName?: string;
  integrantePosition?: number;
  integrantesTotal?: number;
  onSaved?: () => void;
  onSavedGoToDocumentos?: () => void;
  onBack?: () => void;
}

interface SolicitudErrors {
  [key: string]: string | undefined;
}

type StickySectionKey =
  | 'informacionPersonal'
  | 'domicilioParticular'
  | 'referencias'
  | 'referencia1'
  | 'referencia2'
  | 'datosPareja'
  | 'datosNegocio'
  | 'beneficiario'
  | 'validacionesFinales';

const stickySections: Array<{ key: StickySectionKey; title: string }> = [
  { key: 'informacionPersonal', title: 'INFORMACIÓN PERSONAL' },
  { key: 'domicilioParticular', title: 'DOMICILIO PARTICULAR' },
  { key: 'referencias', title: 'REFERENCIAS' },
  { key: 'referencia1', title: 'REFERENCIA 1' },
  { key: 'referencia2', title: 'REFERENCIA 2' },
  { key: 'datosPareja', title: 'DATOS DE SU PAREJA' },
  { key: 'datosNegocio', title: 'DATOS DEL NEGOCIO O TRABAJO' },
  { key: 'beneficiario', title: 'BENEFICIARIO' },
  { key: 'validacionesFinales', title: 'VALIDACIONES FINALES' },
];

const yesNoOptions = ['SI', 'NO'] as const;

const normalizeCurpInput = (value: string): string => value.replace(/\s+/g, '').toUpperCase().slice(0, 18);

export const SolicitudFormScreen: React.FC<SolicitudFormScreenProps> = ({
  solicitanteId,
  solicitanteNombre,
  groupName,
  integrantePosition,
  integrantesTotal,
  onSaved,
  onSavedGoToDocumentos,
  onBack,
}) => {
  const documentationTheme = moduleThemes.documentation;
  const [form, setForm] = useState({
    // Datos iniciales (pre-cargados del solicitante)
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefonoInicial: '',
    telefonoSecundario: '',
    montoSolicitado: '',

    fechaNacimiento: '',
    curp: '',
    nacionalidad: '',
    estadoNacimiento: '',
    genero: '',
    estadoCivil: '',
    ocupacion: '',
    nivelEstudio: '',

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
    parejaIngresoSemanal: '',

    negocioCalle: '',
    negocioNumeroExterior: '',
    negocioNumeroInterior: '',
    negocioColonia: '',
    negocioMunicipio: '',
    negocioEstado: DEFAULT_STATE,
    negocioCodigoPostal: '',
    negocioDesdeCuando: '',
    negocioIngresoSemanal: '',
    negocioOtrosIngresos: '',
    negocioGastos: '',
    negocioTotal: '',
    negocioGiro: '',

    beneficiarioNombreCompleto: '',
    beneficiarioParentesco: '',
    beneficiarioTelefono: '',
    beneficiarioDireccion: '',

    tieneMedidorLuzSinAdeudo: '',
    viveMaximo5KmTesorera: '',
    tieneMenos70Anios: '',
  });

  const [errors, setErrors] = useState<SolicitudErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fechaNacimientoInput, setFechaNacimientoInput] = useState('');
  const [sectionOffsets, setSectionOffsets] = useState<Partial<Record<StickySectionKey, number>>>({});
  const [currentSectionTitle, setCurrentSectionTitle] = useState(stickySections[0].title);
  const [isLoadingSolicitud, setIsLoadingSolicitud] = useState(true);
  const [solicitante, setSolicitante] = useState<{ nombre: string; telefono: string; montoSolicitado: number } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Cargar solicitud existente si ya fue guardada
  useEffect(() => {
    const loadExistingSolicitud = async () => {
      let solicitanteData: any = null;

      try {
        // Cargar datos del solicitante
        const solicitanteResponse = await fetch(apiUrl(`/solicitantes/${solicitanteId}`));
        if (solicitanteResponse.ok) {
          solicitanteData = await solicitanteResponse.json();
          setSolicitante(solicitanteData);

          // Pre-cargar datos iniciales del solicitante en el formulario
          // Si no tiene nombres separados, intentar parsear del nombre completo
          let nombres = solicitanteData.nombres || '';
          let apellidoPaterno = solicitanteData.apellidoPaterno || '';
          let apellidoMaterno = solicitanteData.apellidoMaterno || '';

          // Fallback: si no hay nombres separados, intentar extraer del nombre completo
          if (!nombres && !apellidoPaterno && !apellidoMaterno && solicitanteData.nombre) {
            const parts = solicitanteData.nombre.trim().split(/\s+/);
            if (parts.length >= 3) {
              // Asumir formato: Nombre(s) ApellidoPaterno ApellidoMaterno
              apellidoMaterno = parts.pop() || '';
              apellidoPaterno = parts.pop() || '';
              nombres = parts.join(' ');
            } else if (parts.length === 2) {
              // Solo tiene 2 partes: Nombre ApellidoPaterno
              apellidoPaterno = parts[1] || '';
              nombres = parts[0] || '';
            } else if (parts.length === 1) {
              // Solo tiene nombre
              nombres = parts[0] || '';
            }
          }

          setForm((current) => ({
            ...current,
            nombres: nombres,
            apellidoPaterno: apellidoPaterno,
            apellidoMaterno: apellidoMaterno,
            telefonoInicial: solicitanteData.telefono || '',
            telefonoSecundario: solicitanteData.telefonoSecundario || '',
            montoSolicitado: String(solicitanteData.montoSolicitado || ''),
          }));
        }

        const response = await fetch(apiUrl(`/solicitudes/solicitante/${solicitanteId}`));
        if (response.ok) {
          const text = await response.text();
          if (!text) {
            // No hay solicitud guardada, mantener datos iniciales del solicitante
            setIsLoadingSolicitud(false);
            return;
          }

          const data = JSON.parse(text);
          if (data) {
            // Parsear la fecha de nacimiento de ISO a DD/MM/YYYY
            const fechaNacimiento = data.fechaNacimiento ? formatISODateToDDMMYYYY(data.fechaNacimiento) : '';

            setForm({
              // Datos iniciales (mantener los pre-cargados del solicitante, o sobreescribir si vienen del servidor)
              nombres: data.nombres || solicitanteData?.nombres || '',
              apellidoPaterno: data.apellidoPaterno || solicitanteData?.apellidoPaterno || '',
              apellidoMaterno: data.apellidoMaterno || solicitanteData?.apellidoMaterno || '',
              telefonoInicial: data.telefonoInicial || solicitanteData?.telefono || '',
              telefonoSecundario: data.telefonoSecundario || '',
              montoSolicitado: data.montoSolicitado || String(solicitanteData?.montoSolicitado || ''),

              fechaNacimiento: fechaNacimiento,
              curp: data.curp || '',
              nacionalidad: data.nacionalidad || '',
              estadoNacimiento: data.estadoNacimiento || '',
              genero: data.genero || '',
              estadoCivil: data.estadoCivil || '',
              ocupacion: data.ocupacion || '',
              nivelEstudio: data.nivelEstudio || '',

              calle: data.calle || '',
              numeroExterior: data.numeroExterior || '',
              numeroInterior: data.numeroInterior || '',
              colonia: data.colonia || '',
              municipio: data.municipio || '',
              estado: data.estado || DEFAULT_STATE,
              codigoPostal: data.codigoPostal || '',
              entreCalles: data.entreCalles || '',
              telefono: data.telefono || '',

              referencia1NombreCompleto: data.referencia1NombreCompleto || '',
              referencia1Parentesco: data.referencia1Parentesco || '',
              referencia1Telefono: data.referencia1Telefono || '',
              referencia1Direccion: data.referencia1Direccion || '',
              referencia2NombreCompleto: data.referencia2NombreCompleto || '',
              referencia2Parentesco: data.referencia2Parentesco || '',
              referencia2Telefono: data.referencia2Telefono || '',
              referencia2Direccion: data.referencia2Direccion || '',

              parejaNombreCompleto: data.parejaNombreCompleto || '',
              parejaActividadEconomica: data.parejaActividadEconomica || '',
              parejaIngresoSemanal: data.parejaIngresoSemanal || '',

              negocioCalle: data.negocioCalle || '',
              negocioNumeroExterior: data.negocioNumeroExterior || '',
              negocioNumeroInterior: data.negocioNumeroInterior || '',
              negocioColonia: data.negocioColonia || '',
              negocioMunicipio: data.negocioMunicipio || '',
              negocioEstado: data.negocioEstado || DEFAULT_STATE,
              negocioCodigoPostal: data.negocioCodigoPostal || '',
              negocioDesdeCuando: data.negocioDesdeCuando || '',
              negocioIngresoSemanal: data.negocioIngresoSemanal || '',
              negocioOtrosIngresos: data.negocioOtrosIngresos || '',
              negocioGastos: data.negocioGastos || '',
              negocioTotal: data.negocioTotal || '',
              negocioGiro: data.negocioGiro || '',

              beneficiarioNombreCompleto: data.beneficiarioNombreCompleto || '',
              beneficiarioParentesco: data.beneficiarioParentesco || '',
              beneficiarioTelefono: data.beneficiarioTelefono || '',
              beneficiarioDireccion: data.beneficiarioDireccion || '',

              tieneMedidorLuzSinAdeudo: data.tieneMedidorLuzSinAdeudo || '',
              viveMaximo5KmTesorera: data.viveMaximo5KmTesorera || '',
              tieneMenos70Anios: data.tieneMenos70Anios || '',
            });

            setFechaNacimientoInput(fechaNacimiento);

            // Navegar a la sección completada si existe
            if (data.seccionCompletada && data.seccionCompletada > 0) {
              // Pequeño delay para esperar a que se rendericen las secciones
              setTimeout(() => {
                const seccionKey = stickySections[data.seccionCompletada]?.key;
                if (seccionKey && sectionOffsets[seccionKey]) {
                  scrollViewRef.current?.scrollTo({
                    y: sectionOffsets[seccionKey],
                    animated: true,
                  });
                }
              }, 300);
            }
          }
        }
      } catch (error) {
        console.error('Error cargando solicitud:', error);
      } finally {
        setIsLoadingSolicitud(false);
      }
    };

    loadExistingSolicitud();
  }, [solicitanteId]);

  const domicilioPostalEntry = findPostalCodeEntry(form.codigoPostal);
  const negocioPostalEntry = findPostalCodeEntry(form.negocioCodigoPostal);
  const domicilioColonias = getColoniasByPostalCode(form.codigoPostal);
  const negocioColonias = getColoniasByPostalCode(form.negocioCodigoPostal);
  const domicilioPostalNotFound = form.codigoPostal.trim().length === 5 && !domicilioPostalEntry;
  const negocioPostalNotFound = form.negocioCodigoPostal.trim().length === 5 && !negocioPostalEntry;

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
      const nextColonia = colonias.includes(current.negocioColonia) ? current.negocioColonia : '';

      if (
        current.negocioMunicipio === negocioPostalEntry.municipio &&
        current.negocioEstado === negocioPostalEntry.estado &&
        current.negocioColonia === nextColonia
      ) {
        return current;
      }

      return {
        ...current,
        negocioColonia: nextColonia,
        negocioMunicipio: negocioPostalEntry.municipio,
        negocioEstado: negocioPostalEntry.estado,
      };
    });

    setErrors((current) => ({
      ...current,
      negocioMunicipio: undefined,
    }));
  }, [negocioPostalEntry]);

  useEffect(() => {
    if (form.nacionalidad !== 'EXTRANJERA') {
      return;
    }

    setForm((current) => {
      if (!current.estadoNacimiento) {
        return current;
      }

      return {
        ...current,
        estadoNacimiento: '',
      };
    });

    setErrors((current) => ({
      ...current,
      estadoNacimiento: undefined,
    }));
  }, [form.nacionalidad]);

  useEffect(() => {
    const ingresoSemanal = Number(form.negocioIngresoSemanal || 0);
    const otrosIngresos = Number(form.negocioOtrosIngresos || 0);
    const gastos = Number(form.negocioGastos || 0);
    const totalCalculado = ingresoSemanal + otrosIngresos - gastos;
    const totalString = String(totalCalculado);

    setForm((current) => {
      if (current.negocioTotal === totalString) {
        return current;
      }

      return {
        ...current,
        negocioTotal: totalString,
      };
    });

    setErrors((current) => {
      if (!current.negocioTotal) {
        return current;
      }

      return {
        ...current,
        negocioTotal: undefined,
      };
    });
  }, [form.negocioIngresoSemanal, form.negocioOtrosIngresos, form.negocioGastos]);

  // Actualizar el monto en la tarjeta superior cuando cambie en el formulario
  useEffect(() => {
    if (solicitante && form.montoSolicitado) {
      const nuevoMonto = Number(form.montoSolicitado);
      if (nuevoMonto !== solicitante.montoSolicitado) {
        setSolicitante({
          ...solicitante,
          montoSolicitado: nuevoMonto,
        });
      }
    }
  }, [form.montoSolicitado]);

  // Actualizar nombre y teléfono en la tarjeta superior cuando cambien en el formulario
  useEffect(() => {
    if (solicitante) {
      const nombreCompleto = `${form.nombres} ${form.apellidoPaterno} ${form.apellidoMaterno}`.trim();
      const cambioNombre = nombreCompleto !== solicitante.nombre;
      const cambioTelefono = form.telefonoInicial !== solicitante.telefono;

      if (cambioNombre || cambioTelefono) {
        setSolicitante({
          ...solicitante,
          nombre: nombreCompleto || solicitante.nombre,
          telefono: form.telefonoInicial || solicitante.telefono,
        });
      }
    }
  }, [form.nombres, form.apellidoPaterno, form.apellidoMaterno, form.telefonoInicial]);

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
    field: 'telefono' | 'referencia1Telefono' | 'referencia2Telefono' | 'beneficiarioTelefono',
    value: string,
  ) => {
    updateField(field, normalizePhone(value));
  };

  const updateMoneyField = (
    field: 'parejaIngresoSemanal' | 'negocioIngresoSemanal' | 'negocioOtrosIngresos' | 'negocioGastos' | 'negocioTotal',
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
      updateField('fechaNacimiento', '');
      setErrors((current) => ({
        ...current,
        fechaNacimiento: 'Campo obligatorio',
      }));
      return;
    }

    if (!validateRealDate(fechaNacimientoInput)) {
      updateField('fechaNacimiento', '');
      setErrors((current) => ({
        ...current,
        fechaNacimiento: 'Fecha inválida',
      }));
      return;
    }

    const normalizedDate = toISODateFromDDMMYYYY(fechaNacimientoInput);
    updateField('fechaNacimiento', normalizedDate);
    setFechaNacimientoInput(formatISODateToDDMMMYYYY(normalizedDate));
    setErrors((current) => ({
      ...current,
      fechaNacimiento: validateFechaNacimientoField(normalizedDate),
    }));
  };

  const handleFechaNacimientoFocus = () => {
    if (form.fechaNacimiento) {
      const editableDate = formatISODateToDDMMYYYY(form.fechaNacimiento);
      setFechaNacimientoInput(editableDate || fechaNacimientoInput);
    }
  };

  const handleFechaNacimientoChange = (value: string) => {
    const maskedDate = formatDateDDMMYYYY(value);
    setFechaNacimientoInput(maskedDate);

    if (validateRealDate(maskedDate)) {
      updateField('fechaNacimiento', toISODateFromDDMMYYYY(maskedDate));
    } else {
      updateField('fechaNacimiento', '');
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

  const handleSiguienteSeccion = (seccionIndex: number, datosSeccion: object) => {
    // Llamar a autoSave y luego navegar a la siguiente sección
    autoSave(seccionIndex, datosSeccion);

    // Navegar a la siguiente sección si existe
    const nextIndex = seccionIndex + 1;
    if (nextIndex < stickySections.length) {
      const nextSectionKey = stickySections[nextIndex].key;
      const nextOffset = sectionOffsets[nextSectionKey];

      if (nextOffset !== undefined) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: nextOffset,
            animated: true,
          });
        }, 100);
      }
    }
  };

  const autoSave = async (seccion: number, datos: object) => {
    setAutoSaveStatus('saving');

    const payload = {
      seccionCompletada: seccion,
      ...datos,
    };

    try {
      const response = await fetch(apiUrl(`/solicitudes/${solicitanteId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to autosave');
      }

      setAutoSaveStatus('saved');

      // Limpiar el mensaje "Guardado ✓" después de 2 segundos
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error en autosave:', error);
      setAutoSaveStatus('error');

      // Reintentar 1 vez
      setTimeout(async () => {
        try {
          setAutoSaveStatus('saving');
          const retryResponse = await fetch(apiUrl(`/solicitudes/${solicitanteId}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (retryResponse.ok) {
            setAutoSaveStatus('saved');
            setTimeout(() => {
              setAutoSaveStatus('idle');
            }, 2000);
          } else {
            setAutoSaveStatus('error');
            setTimeout(() => {
              setAutoSaveStatus('idle');
            }, 2000);
          }
        } catch (retryError) {
          console.error('Error en retry autosave:', retryError);
          setAutoSaveStatus('error');
          setTimeout(() => {
            setAutoSaveStatus('idle');
          }, 2000);
        }
      }, 1000);
    }
  };

  const validateForm = (): SolicitudErrors => {
    const nextErrors: SolicitudErrors = {};

    const requiredFields = [
      'fechaNacimiento',
      'curp',
      'nacionalidad',
      'genero',
      'estadoCivil',
      'ocupacion',
      'nivelEstudio',
      'calle',
      'numeroExterior',
      'colonia',
      'municipio',
      'codigoPostal',
      'entreCalles',
      'telefono',
      'referencia1NombreCompleto',
      'referencia1Parentesco',
      'referencia1Telefono',
      'referencia1Direccion',
      'referencia2NombreCompleto',
      'referencia2Parentesco',
      'referencia2Telefono',
      'referencia2Direccion',
      'negocioCalle',
      'negocioNumeroExterior',
      'negocioColonia',
      'negocioMunicipio',
      'negocioCodigoPostal',
      'negocioDesdeCuando',
      'negocioIngresoSemanal',
      'negocioGastos',
      'negocioTotal',
      'negocioGiro',
      'beneficiarioNombreCompleto',
      'beneficiarioParentesco',
      'beneficiarioTelefono',
      'beneficiarioDireccion',
    ] as const;

    requiredFields.forEach((field) => {
      if (!form[field].trim()) {
        nextErrors[field] = 'Campo obligatorio';
      }
    });

    if (!form.municipio.trim()) {
      nextErrors.municipio = 'El municipio es obligatorio';
    }

    if (!form.negocioMunicipio.trim()) {
      nextErrors.negocioMunicipio = 'El municipio es obligatorio';
    }

    const fechaNacimientoError = validateFechaNacimientoField(form.fechaNacimiento);
    if (fechaNacimientoError) {
      nextErrors.fechaNacimiento = fechaNacimientoError;
    }

    const curpError = validateCurpField(form.curp);
    if (curpError) {
      nextErrors.curp = curpError;
    }

    if (form.codigoPostal.trim().length !== 5) {
      nextErrors.codigoPostal = 'El código postal debe tener 5 dígitos';
    }

    if (form.negocioCodigoPostal.trim().length !== 5) {
      nextErrors.negocioCodigoPostal = 'El código postal debe tener 5 dígitos';
    }

    ['telefono', 'referencia1Telefono', 'referencia2Telefono', 'beneficiarioTelefono'].forEach((field) => {
      if (!validatePhone10(form[field as keyof typeof form])) {
        nextErrors[field] = 'El teléfono debe tener 10 dígitos';
      }
    });

    ['genero', 'estadoCivil', 'nivelEstudio'].forEach((field) => {
      if (!form[field as keyof typeof form].trim()) {
        nextErrors[field] = 'Selecciona una opción';
      }
    });

    if (!form.nacionalidad.trim()) {
      nextErrors.nacionalidad = 'Selecciona una opción';
    }

    if (form.nacionalidad === 'MEXICANA' && !form.estadoNacimiento.trim()) {
      nextErrors.estadoNacimiento = 'Selecciona una opción';
    }

    ['tieneMedidorLuzSinAdeudo', 'viveMaximo5KmTesorera', 'tieneMenos70Anios'].forEach((field) => {
      if (!form[field as keyof typeof form]) {
        nextErrors[field] = 'Selecciona Sí o No';
      }
    });

    return nextErrors;
  };

  const isRequiredEmpty =
    !form.fechaNacimiento.trim() ||
    !form.curp.trim() ||
    !form.nacionalidad.trim() ||
    (form.nacionalidad === 'MEXICANA' && !form.estadoNacimiento.trim()) ||
    !form.genero.trim() ||
    !form.estadoCivil.trim() ||
    !form.ocupacion.trim() ||
    !form.nivelEstudio.trim() ||
    !form.calle.trim() ||
    !form.numeroExterior.trim() ||
    !form.colonia.trim() ||
    !form.municipio.trim() ||
    !form.codigoPostal.trim() ||
    !form.entreCalles.trim() ||
    !form.referencia1NombreCompleto.trim() ||
    !form.referencia1Parentesco.trim() ||
    !form.referencia1Telefono.trim() ||
    !form.referencia1Direccion.trim() ||
    !form.referencia2NombreCompleto.trim() ||
    !form.referencia2Parentesco.trim() ||
    !form.referencia2Telefono.trim() ||
    !form.referencia2Direccion.trim() ||
    !form.negocioCalle.trim() ||
    !form.negocioNumeroExterior.trim() ||
    !form.negocioColonia.trim() ||
    !form.negocioMunicipio.trim() ||
    !form.negocioCodigoPostal.trim() ||
    !form.negocioDesdeCuando.trim() ||
    !form.negocioIngresoSemanal.trim() ||
    !form.negocioGastos.trim() ||
    !form.negocioTotal.trim() ||
    !form.negocioGiro.trim() ||
    !form.beneficiarioNombreCompleto.trim() ||
    !form.beneficiarioParentesco.trim() ||
    !form.beneficiarioTelefono.trim() ||
    !form.beneficiarioDireccion.trim() ||
    !form.tieneMedidorLuzSinAdeudo ||
    !form.viveMaximo5KmTesorera ||
    !form.tieneMenos70Anios;

  const hasBlockingValidation =
    Boolean(validateFechaNacimientoField(form.fechaNacimiento)) ||
    Boolean(validateCurpField(form.curp)) ||
    !validatePhone10(form.telefonoInicial) ||
    !validatePhone10(form.referencia1Telefono) ||
    !validatePhone10(form.referencia2Telefono) ||
    !validatePhone10(form.beneficiarioTelefono) ||
    form.codigoPostal.trim().length !== 5 ||
    form.negocioCodigoPostal.trim().length !== 5;

  const handleSubmit = async () => {
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.curp === 'CURP inválida') {
        Alert.alert('CURP inválida');
      }
      return;
    }

    const payload = {
      solicitanteId,
      ...form,
      telefono: form.telefonoInicial, // Usar el teléfono inicial como teléfono de contacto
      domicilio: `${form.calle} ${form.numeroExterior}${form.numeroInterior ? ` INT ${form.numeroInterior}` : ''}, ${form.colonia}, ${form.municipio}, ${form.estado}, CP ${form.codigoPostal}`,
      negocioDomicilio: `${form.negocioCalle} ${form.negocioNumeroExterior}${form.negocioNumeroInterior ? ` INT ${form.negocioNumeroInterior}` : ''}, ${form.negocioColonia}, ${form.negocioMunicipio}, ${form.negocioEstado}, CP ${form.negocioCodigoPostal}`,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl('/solicitudes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create solicitud');
      }

      Alert.alert('Éxito', 'Solicitud guardada');
      onSaved?.();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setIsSubmitting(false);
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

  const renderSectionRow = (title: string) => (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderReferenceRow = (title: string) => (
    <View style={styles.referenceRow}>
      <Text style={styles.referenceTitle}>{title}</Text>
    </View>
  );

  const onSectionLayout = (sectionKey: StickySectionKey, y: number) => {
    setSectionOffsets((current) => {
      if (current[sectionKey] === y) {
        return current;
      }

      return {
        ...current,
        [sectionKey]: y,
      };
    });
  };

  const handleLlamarSolicitante = (telefono: string, nombre: string) => {
    Alert.alert(
      'Realizar llamada',
      `¿Deseas llamar a ${nombre}?\n\n${formatPhone(telefono)}`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: '📞 Llamar',
          onPress: () => {
            const cleanPhone = telefono.replace(/\D/g, '');
            Linking.openURL(`tel:${cleanPhone}`);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y + spacing.lg;
    let nextTitle = stickySections[0].title;

    stickySections.forEach((section) => {
      const sectionY = sectionOffsets[section.key];
      if (sectionY !== undefined && currentY >= sectionY) {
        nextTitle = section.title;
      }
    });

    if (nextTitle !== currentSectionTitle) {
      setCurrentSectionTitle(nextTitle);
    }
  };

  const renderMunicipioSelector = (field: 'municipio' | 'negocioMunicipio', value: string, error?: string) =>
    renderSelectCard(field, 'Municipio', value, NUEVO_LEON_MUNICIPALITIES, error, 'Selecciona un municipio', 'Seleccionar municipio');

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

  const integrantePositionLabel = typeof integrantePosition === 'number' && integrantePosition > 0 ? String(integrantePosition) : '—';
  const integrantesTotalLabel = typeof integrantesTotal === 'number' && integrantesTotal > 0 ? String(integrantesTotal) : '—';
  const groupNameLabel = groupName?.trim() || '—';

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Capturar Solicitud" moduleTheme="documentation" />

      {/* Banner del grupo */}
      <View style={styles.grupoBanner}>
        <Text style={styles.grupoBannerText}>{groupName || 'Cargando grupo...'}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        {/* Tarjeta del solicitante - Mismo diseño que Documentos */}
        <View style={styles.fixedSolicitanteContainer}>
          <Card style={styles.solicitanteCard}>
            <View style={styles.solicitanteHeader}>
              {/* Nombre a la izquierda */}
              <Text style={styles.solicitanteName}>
                {solicitanteNombre || 'Sin nombre'}
              </Text>

              {/* Número a la derecha */}
              {integrantePosition && integrantesTotal && (
                <Text style={styles.positionText}>
                  {integrantePosition}/{integrantesTotal}
                </Text>
              )}
            </View>

            {/* Teléfono y Monto */}
            {solicitante && (
              <View style={styles.contactInfoRow}>
                {/* Teléfono con ícono - CLICKEABLE */}
                <TouchableOpacity
                  style={styles.phoneButton}
                  onPress={() => handleLlamarSolicitante(solicitante.telefono, solicitante.nombre)}
                >
                  <Text style={styles.phoneIcon}>📞</Text>
                  <Text style={styles.phoneText}>{formatPhone(solicitante.telefono)}</Text>
                </TouchableOpacity>

                {/* Monto */}
                <View style={styles.montoContainer}>
                  <Text style={styles.montoIcon}>💰</Text>
                  <Text style={styles.montoText}>{formatCurrency(solicitante.montoSolicitado)}</Text>
                </View>
              </View>
            )}
          </Card>
        </View>

        <StickySectionHeader title={currentSectionTitle} />

        {/* Indicador de autosave */}
        {autoSaveStatus !== 'idle' && (
          <View style={styles.autoSaveIndicator}>
            {autoSaveStatus === 'saving' && (
              <Text style={styles.autoSaveTextSaving}>Guardando...</Text>
            )}
            {autoSaveStatus === 'saved' && (
              <Text style={styles.autoSaveTextSaved}>Guardado ✓</Text>
            )}
            {autoSaveStatus === 'error' && (
              <Text style={styles.autoSaveTextError}>Reintentando...</Text>
            )}
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Card>
            <View onLayout={(event) => onSectionLayout('informacionPersonal', event.nativeEvent.layout.y)}>
              {renderSectionRow('INFORMACIÓN PERSONAL')}
            </View>

            {/* Campos iniciales del solicitante */}
            <FormField label="Nombre(s)" required helperText="Solo letras, en mayúsculas">
              <TextInput
                style={styles.input}
                placeholder="Nombre(s)"
                value={form.nombres}
                onChangeText={(value) => updateField('nombres', normalizeUppercaseLettersOnly(value))}
                autoCapitalize="characters"
              />
            </FormField>

            <FormField label="Apellido paterno" required helperText="Solo letras, en mayúsculas">
              <TextInput
                style={styles.input}
                placeholder="Apellido paterno"
                value={form.apellidoPaterno}
                onChangeText={(value) => updateField('apellidoPaterno', normalizeUppercaseLettersOnly(value))}
                autoCapitalize="characters"
              />
            </FormField>

            <FormField label="Apellido materno" required helperText="Solo letras, en mayúsculas">
              <TextInput
                style={styles.input}
                placeholder="Apellido materno"
                value={form.apellidoMaterno}
                onChangeText={(value) => updateField('apellidoMaterno', normalizeUppercaseLettersOnly(value))}
                autoCapitalize="characters"
              />
            </FormField>

            <FormField label="Teléfono" required helperText="10 dígitos">
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={formatPhone(form.telefonoInicial)}
                onChangeText={(value) => updateField('telefonoInicial', normalizePhone(value))}
                keyboardType="numeric"
                maxLength={14}
              />
            </FormField>

            <FormField label="Teléfono secundario" helperText="Opcional, 10 dígitos">
              <TextInput
                style={styles.input}
                placeholder="Teléfono secundario"
                value={formatPhone(form.telefonoSecundario)}
                onChangeText={(value) => updateField('telefonoSecundario', normalizePhone(value))}
                keyboardType="numeric"
                maxLength={14}
              />
            </FormField>

            <FormField label="Monto solicitado" required helperText={`Máximo ${formatCurrency(MAX_SOLICITUD_AMOUNT)}`}>
              <TextInput
                style={styles.input}
                placeholder="Monto solicitado"
                value={form.montoSolicitado ? formatCurrency(form.montoSolicitado) : ''}
                onChangeText={(value) => updateField('montoSolicitado', normalizeDigits(value))}
                keyboardType="numeric"
              />
            </FormField>

            <FormField
              label="Fecha de nacimiento"
              required
              helperText="Formato DD/MM/AAAA (se muestra DD/MMM/AAAA)"
              errorText={errors.fechaNacimiento}
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
            {renderSelectCard('estadoCivil', 'Estado civil', form.estadoCivil, ESTADO_CIVIL_OPTIONS, errors.estadoCivil)}
            {renderSelectCard('nivelEstudio', 'Nivel de estudios', form.nivelEstudio, NIVEL_ESTUDIO_OPTIONS, errors.nivelEstudio)}
            {renderSelectCard('nacionalidad', 'Nacionalidad', form.nacionalidad, NACIONALIDADES_OPTIONS, errors.nacionalidad)}
            {form.nacionalidad === 'MEXICANA'
              ? renderSelectCard('estadoNacimiento', 'Estado de nacimiento', form.estadoNacimiento, ESTADOS_MEXICO_OPTIONS, errors.estadoNacimiento, 'Selecciona una opción', 'Seleccionar estado')
              : (
                <FormField label="Estado de nacimiento" helperText="No aplica para nacionalidad extranjera">
                  <View style={styles.readOnlyField}>
                    <Text style={styles.valueText}>NO APLICA</Text>
                  </View>
                </FormField>
              )}
            <FormField label="Ocupación" required errorText={errors.ocupacion}>
              <TextInput style={styles.input} placeholder="Ocupación" value={form.ocupacion} onChangeText={(value) => updateField('ocupacion', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>

            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton
                title="Siguiente →"
                onPress={() =>
                  handleSiguienteSeccion(0, {
                    nombres: form.nombres,
                    apellidoPaterno: form.apellidoPaterno,
                    apellidoMaterno: form.apellidoMaterno,
                    telefonoInicial: form.telefonoInicial,
                    telefonoSecundario: form.telefonoSecundario,
                    montoSolicitado: form.montoSolicitado,
                    fechaNacimiento: form.fechaNacimiento,
                    curp: form.curp,
                    nacionalidad: form.nacionalidad,
                    estadoNacimiento: form.estadoNacimiento,
                    genero: form.genero,
                    estadoCivil: form.estadoCivil,
                    ocupacion: form.ocupacion,
                    nivelEstudio: form.nivelEstudio,
                  })
                }
                moduleTheme="documentation"
              />
            </View>

            <View onLayout={(event) => onSectionLayout('domicilioParticular', event.nativeEvent.layout.y)}>
              {renderSectionRow('DOMICILIO PARTICULAR')}
            </View>
            <FormField label="Calle" required errorText={errors.calle}>
              <TextInput style={styles.input} placeholder="Calle" value={form.calle} onChangeText={(value) => updateField('calle', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            <FormField label="Número exterior" required errorText={errors.numeroExterior}>
              <TextInput style={styles.input} placeholder="Número exterior" value={form.numeroExterior} onChangeText={(value) => updateField('numeroExterior', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            <FormField label="Número interior" helperText="Opcional">
              <TextInput style={styles.input} placeholder="Número interior" value={form.numeroInterior} onChangeText={(value) => updateField('numeroInterior', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            <FormField
              label="Código postal"
              required
              helperText={domicilioPostalNotFound ? 'Código postal no encontrado en catálogo local' : '5 dígitos'}
              errorText={errors.codigoPostal}
            >
              <TextInput style={styles.input} placeholder="Código postal" value={form.codigoPostal} onChangeText={(value) => updateField('codigoPostal', normalizeDigits(value, 5))} keyboardType="numeric" maxLength={5} />
            </FormField>
            {domicilioPostalEntry
              ? renderSelectCard('colonia', 'Colonia', form.colonia, domicilioColonias, errors.colonia, 'Selecciona una colonia', 'Seleccionar colonia')
              : (
                <FormField label="Colonia" required errorText={errors.colonia}>
                  <TextInput style={styles.input} placeholder="Colonia" value={form.colonia} onChangeText={(value) => updateField('colonia', normalizeUppercaseText(value))} autoCapitalize="characters" />
                </FormField>
              )}
            {domicilioPostalEntry
              ? renderReadOnlyField('Municipio', domicilioPostalEntry.municipio, 'Autocompletado por código postal', errors.municipio)
              : renderMunicipioSelector('municipio', form.municipio, errors.municipio)}
            {renderFixedState()}
            <FormField label="Entre calles" required errorText={errors.entreCalles}>
              <TextInput style={styles.input} placeholder="Entre calles" value={form.entreCalles} onChangeText={(value) => updateField('entreCalles', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>

            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton
                title="Siguiente →"
                onPress={() =>
                  handleSiguienteSeccion(1, {
                    calle: form.calle,
                    numeroExterior: form.numeroExterior,
                    numeroInterior: form.numeroInterior,
                    colonia: form.colonia,
                    municipio: form.municipio,
                    estado: form.estado,
                    codigoPostal: form.codigoPostal,
                    entreCalles: form.entreCalles,
                    telefono: form.telefono,
                  })
                }
                moduleTheme="documentation"
              />
            </View>

            <View onLayout={(event) => onSectionLayout('referencias', event.nativeEvent.layout.y)}>
              {renderSectionRow('REFERENCIAS')}
            </View>
            <Text style={styles.referencesSubtitle}>Pareja y 1 familiar. Una debe vivir en el domicilio y ser mayor de 18 años.</Text>
            <View onLayout={(event) => onSectionLayout('referencia1', event.nativeEvent.layout.y)}>
              {renderReferenceRow('REFERENCIA 1')}
            </View>
            <FormField label="Nombre completo" required errorText={errors.referencia1NombreCompleto}>
              <TextInput style={styles.input} placeholder="Nombre completo" value={form.referencia1NombreCompleto} onChangeText={(value) => updateField('referencia1NombreCompleto', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            {renderSelectCard('referencia1Parentesco', 'Parentesco', form.referencia1Parentesco, PARENTESCO_OPTIONS, errors.referencia1Parentesco)}
            <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.referencia1Telefono}>
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={formatPhone(form.referencia1Telefono)}
                onChangeText={(value) => updatePhoneField('referencia1Telefono', value)}
                keyboardType="numeric"
                maxLength={14}
              />
            </FormField>
            <FormField label="Dirección" required errorText={errors.referencia1Direccion}>
              <TextInput style={styles.input} placeholder="Dirección" value={form.referencia1Direccion} onChangeText={(value) => updateField('referencia1Direccion', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>

            <View onLayout={(event) => onSectionLayout('referencia2', event.nativeEvent.layout.y)}>
              {renderReferenceRow('REFERENCIA 2')}
            </View>
            <FormField label="Nombre completo" required errorText={errors.referencia2NombreCompleto}>
              <TextInput style={styles.input} placeholder="Nombre completo" value={form.referencia2NombreCompleto} onChangeText={(value) => updateField('referencia2NombreCompleto', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            {renderSelectCard('referencia2Parentesco', 'Parentesco', form.referencia2Parentesco, PARENTESCO_OPTIONS, errors.referencia2Parentesco)}
            <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.referencia2Telefono}>
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={formatPhone(form.referencia2Telefono)}
                onChangeText={(value) => updatePhoneField('referencia2Telefono', value)}
                keyboardType="numeric"
                maxLength={14}
              />
            </FormField>
            <FormField label="Dirección" required errorText={errors.referencia2Direccion}>
              <TextInput style={styles.input} placeholder="Dirección" value={form.referencia2Direccion} onChangeText={(value) => updateField('referencia2Direccion', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>

            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton
                title="Siguiente →"
                onPress={() =>
                  handleSiguienteSeccion(4, {
                    referencia1NombreCompleto: form.referencia1NombreCompleto,
                    referencia1Parentesco: form.referencia1Parentesco,
                    referencia1Telefono: form.referencia1Telefono,
                    referencia1Direccion: form.referencia1Direccion,
                    referencia2NombreCompleto: form.referencia2NombreCompleto,
                    referencia2Parentesco: form.referencia2Parentesco,
                    referencia2Telefono: form.referencia2Telefono,
                    referencia2Direccion: form.referencia2Direccion,
                  })
                }
                moduleTheme="documentation"
              />
            </View>

            <View onLayout={(event) => onSectionLayout('datosPareja', event.nativeEvent.layout.y)}>
              {renderSectionRow('DATOS DE SU PAREJA')}
            </View>
            <FormField label="Nombre completo" helperText="Opcional">
              <TextInput style={styles.input} placeholder="Nombre completo" value={form.parejaNombreCompleto} onChangeText={(value) => updateField('parejaNombreCompleto', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            <FormField label="Actividad económica" helperText="Opcional">
              <TextInput style={styles.input} placeholder="Actividad económica" value={form.parejaActividadEconomica} onChangeText={(value) => updateField('parejaActividadEconomica', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            <FormField label="Ingreso semanal" helperText="Solo números">
              <TextInput
                style={styles.input}
                placeholder="$ 0"
                value={form.parejaIngresoSemanal ? formatCurrency(form.parejaIngresoSemanal) : ''}
                onChangeText={(value) => updateMoneyField('parejaIngresoSemanal', value)}
                keyboardType="numeric"
              />
            </FormField>

            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton
                title="Siguiente →"
                onPress={() =>
                  handleSiguienteSeccion(5, {
                    parejaNombreCompleto: form.parejaNombreCompleto,
                    parejaActividadEconomica: form.parejaActividadEconomica,
                    parejaIngresoSemanal: form.parejaIngresoSemanal,
                  })
                }
                moduleTheme="documentation"
              />
            </View>

            <View onLayout={(event) => onSectionLayout('datosNegocio', event.nativeEvent.layout.y)}>
              {renderSectionRow('DATOS DEL NEGOCIO O TRABAJO')}
            </View>
            <FormField label="Calle" required errorText={errors.negocioCalle}>
              <TextInput style={styles.input} placeholder="Calle" value={form.negocioCalle} onChangeText={(value) => updateField('negocioCalle', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            <FormField label="Número exterior" required errorText={errors.negocioNumeroExterior}>
              <TextInput style={styles.input} placeholder="Número exterior" value={form.negocioNumeroExterior} onChangeText={(value) => updateField('negocioNumeroExterior', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            <FormField label="Número interior" helperText="Opcional">
              <TextInput style={styles.input} placeholder="Número interior" value={form.negocioNumeroInterior} onChangeText={(value) => updateField('negocioNumeroInterior', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            <FormField
              label="Código postal"
              required
              helperText={negocioPostalNotFound ? 'Código postal no encontrado en catálogo local' : '5 dígitos'}
              errorText={errors.negocioCodigoPostal}
            >
              <TextInput style={styles.input} placeholder="Código postal" value={form.negocioCodigoPostal} onChangeText={(value) => updateField('negocioCodigoPostal', normalizeDigits(value, 5))} keyboardType="numeric" maxLength={5} />
            </FormField>
            {negocioPostalEntry
              ? renderSelectCard('negocioColonia', 'Colonia', form.negocioColonia, negocioColonias, errors.negocioColonia, 'Selecciona una colonia', 'Seleccionar colonia')
              : (
                <FormField label="Colonia" required errorText={errors.negocioColonia}>
                  <TextInput style={styles.input} placeholder="Colonia" value={form.negocioColonia} onChangeText={(value) => updateField('negocioColonia', normalizeUppercaseText(value))} autoCapitalize="characters" />
                </FormField>
              )}
            {negocioPostalEntry
              ? renderReadOnlyField('Municipio', negocioPostalEntry.municipio, 'Autocompletado por código postal', errors.negocioMunicipio)
              : renderMunicipioSelector('negocioMunicipio', form.negocioMunicipio, errors.negocioMunicipio)}
            {renderFixedState()}
            {renderSelectCard(
              'negocioDesdeCuando',
              'Desde cuándo tiene su negocio o trabajo actual',
              form.negocioDesdeCuando,
              ANTIGUEDAD_NEGOCIO_OPTIONS,
              errors.negocioDesdeCuando,
              'Selecciona una opción',
            )}
            <FormField label="Ingreso semanal" required helperText="Solo números" errorText={errors.negocioIngresoSemanal}>
              <TextInput
                style={styles.input}
                placeholder="$ 0"
                value={form.negocioIngresoSemanal ? formatCurrency(form.negocioIngresoSemanal) : ''}
                onChangeText={(value) => updateMoneyField('negocioIngresoSemanal', value)}
                keyboardType="numeric"
              />
            </FormField>
            <FormField label="Otros ingresos" helperText="Opcional, solo números">
              <TextInput
                style={styles.input}
                placeholder="$ 0"
                value={form.negocioOtrosIngresos ? formatCurrency(form.negocioOtrosIngresos) : ''}
                onChangeText={(value) => updateMoneyField('negocioOtrosIngresos', value)}
                keyboardType="numeric"
              />
            </FormField>
            <FormField label="Gastos" required helperText="Solo números" errorText={errors.negocioGastos}>
              <TextInput
                style={styles.input}
                placeholder="$ 0"
                value={form.negocioGastos ? formatCurrency(form.negocioGastos) : ''}
                onChangeText={(value) => updateMoneyField('negocioGastos', value)}
                keyboardType="numeric"
              />
            </FormField>
            {renderReadOnlyField(
              'Total',
              formatCurrency(Number(form.negocioTotal || 0)),
              'Calculado automáticamente',
              errors.negocioTotal,
            )}
            <FormField label="Giro del negocio o trabajo" required errorText={errors.negocioGiro}>
              <TextInput style={styles.input} placeholder="Giro" value={form.negocioGiro} onChangeText={(value) => updateField('negocioGiro', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>

            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton
                title="Siguiente →"
                onPress={() =>
                  handleSiguienteSeccion(6, {
                    negocioCalle: form.negocioCalle,
                    negocioNumeroExterior: form.negocioNumeroExterior,
                    negocioNumeroInterior: form.negocioNumeroInterior,
                    negocioColonia: form.negocioColonia,
                    negocioMunicipio: form.negocioMunicipio,
                    negocioEstado: form.negocioEstado,
                    negocioCodigoPostal: form.negocioCodigoPostal,
                    negocioDesdeCuando: form.negocioDesdeCuando,
                    negocioIngresoSemanal: form.negocioIngresoSemanal,
                    negocioOtrosIngresos: form.negocioOtrosIngresos,
                    negocioGastos: form.negocioGastos,
                    negocioTotal: form.negocioTotal,
                    negocioGiro: form.negocioGiro,
                  })
                }
                moduleTheme="documentation"
              />
            </View>

            <View onLayout={(event) => onSectionLayout('beneficiario', event.nativeEvent.layout.y)}>
              {renderSectionRow('BENEFICIARIO')}
            </View>
            <FormField label="Nombre completo" required errorText={errors.beneficiarioNombreCompleto}>
              <TextInput style={styles.input} placeholder="Nombre completo" value={form.beneficiarioNombreCompleto} onChangeText={(value) => updateField('beneficiarioNombreCompleto', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>
            {renderSelectCard('beneficiarioParentesco', 'Parentesco', form.beneficiarioParentesco, PARENTESCO_OPTIONS, errors.beneficiarioParentesco)}
            <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.beneficiarioTelefono}>
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={formatPhone(form.beneficiarioTelefono)}
                onChangeText={(value) => updatePhoneField('beneficiarioTelefono', value)}
                keyboardType="numeric"
                maxLength={14}
              />
            </FormField>
            <FormField label="Dirección" required errorText={errors.beneficiarioDireccion}>
              <TextInput style={styles.input} placeholder="Dirección" value={form.beneficiarioDireccion} onChangeText={(value) => updateField('beneficiarioDireccion', normalizeUppercaseText(value))} autoCapitalize="characters" />
            </FormField>

            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton
                title="Siguiente →"
                onPress={() =>
                  handleSiguienteSeccion(7, {
                    beneficiarioNombreCompleto: form.beneficiarioNombreCompleto,
                    beneficiarioParentesco: form.beneficiarioParentesco,
                    beneficiarioTelefono: form.beneficiarioTelefono,
                    beneficiarioDireccion: form.beneficiarioDireccion,
                  })
                }
                moduleTheme="documentation"
              />
            </View>

            <View onLayout={(event) => onSectionLayout('validacionesFinales', event.nativeEvent.layout.y)}>
              {renderSectionRow('VALIDACIONES FINALES')}
            </View>
            {renderSelectCard('tieneMedidorLuzSinAdeudo', '¿Tiene medidor de luz sin adeudo?', form.tieneMedidorLuzSinAdeudo, yesNoOptions, errors.tieneMedidorLuzSinAdeudo)}
            {renderSelectCard('viveMaximo5KmTesorera', '¿La integrante vive a máximo 5 km de la tesorera?', form.viveMaximo5KmTesorera, yesNoOptions, errors.viveMaximo5KmTesorera)}
            {renderSelectCard('tieneMenos70Anios', '¿La integrante tiene menos de 70 años?', form.tieneMenos70Anios, yesNoOptions, errors.tieneMenos70Anios)}

            <PrimaryButton title={isSubmitting ? 'Guardando...' : 'Guardar solicitud'} onPress={handleSubmit} disabled={isSubmitting || isRequiredEmpty || hasBlockingValidation} moduleTheme="documentation" />

            {onSavedGoToDocumentos && (
              <View style={{ marginTop: spacing.md }}>
                <SecondaryButton title="Ir a Documentos →" onPress={onSavedGoToDocumentos} />
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  form: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
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
  contextBar: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  contextGroupBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  contextLabel: {
    ...typography.caption,
    fontWeight: '700',
    marginRight: spacing.xs,
  },
  contextGroupName: {
    ...typography.caption,
    fontWeight: '700',
    flexShrink: 1,
  },
  contextIntegrante: {
    ...typography.caption,
    fontWeight: '700',
    flexShrink: 0,
  },
  fixedSolicitanteContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  solicitanteCard: {
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#000000',
    marginBottom: 0,
  },
  solicitanteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  solicitanteName: {
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
  fixedSolicitanteWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  fixedSolicitanteCard: {
    marginBottom: 0,
    paddingVertical: spacing.md,
  },
  fixedSolicitanteLabel: {
    color: colors.textSecondary,
    ...typography.caption,
    fontWeight: '700',
  },
  fixedSolicitanteValue: {
    color: colors.textPrimary,
    ...typography.bodyStrong,
    marginTop: spacing.xs,
  },
  subtitle: { color: colors.textSecondary, marginBottom: spacing.sm, ...typography.body },
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
    color: '#0F5A35',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  referenceRow: {
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#0F5A35',
    backgroundColor: colors.borderSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  referencesSubtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    ...typography.caption,
  },
  referenceTitle: {
    ...typography.caption,
    color: '#0B4A2C',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
    columnGap: spacing.sm,
    marginTop: spacing.md,
  },
  optionCard: {
    marginVertical: spacing.sm,
    paddingVertical: spacing.md,
  },
  optionButton: {
    minWidth: '31%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  optionButtonActive: {
    backgroundColor: colors.successSoft,
    borderColor: '#0F5A35',
  },
  optionText: {
    color: colors.textPrimary,
    ...typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  yesNoGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  yesNoOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  yesNoOptionActive: {
    backgroundColor: colors.successSoft,
    borderColor: '#0F5A35',
  },
  yesNoText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
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
  autoSaveIndicator: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  autoSaveTextSaving: {
    ...typography.caption,
    color: '#666',
    fontWeight: '600',
  },
  autoSaveTextSaved: {
    ...typography.caption,
    color: '#15803D',
    fontWeight: '700',
  },
  autoSaveTextError: {
    ...typography.caption,
    color: '#DC2626',
    fontWeight: '600',
  },
});
