import React, { useEffect, useState } from 'react';
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
  View,
} from 'react-native';
import { AppHeader, Card, FormField, PrimaryButton, ScreenContainer, ScreenTitleBar, SelectorField, StickySectionHeader } from '../../components/ui';
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
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency } from '../../utils/currency';
import {
  formatDateDDMMYYYY,
  formatISODateToDDMMYYYY,
  formatISODateToDDMMMYYYY,
  formatPhone,
  normalizeDigits,
  normalizePhone,
  normalizeUppercaseText,
  toISODateFromDDMMYYYY,
  validatePhone10,
  validateRealDate,
} from '../../utils/input';
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
  onSaved?: () => void;
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

export const SolicitudFormScreen: React.FC<SolicitudFormScreenProps> = ({ solicitanteId, solicitanteNombre, onSaved, onBack }) => {
  const [form, setForm] = useState({
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
    !form.telefono.trim() ||
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
    !validatePhone10(form.telefono) ||
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

  return (
    <ScreenContainer>
      <AppHeader showBackButton onBackPress={onBack} moduleTheme="documentation" />
      <ScreenTitleBar title="Capturar Solicitud" moduleTheme="documentation" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={styles.fixedSolicitanteWrap}>
          <Card style={styles.fixedSolicitanteCard}>
            <Text style={styles.fixedSolicitanteLabel}>SOLICITANTE:</Text>
            <Text style={styles.fixedSolicitanteValue}>{solicitanteNombre ?? 'SIN NOMBRE REGISTRADO'}</Text>
          </Card>
        </View>

        <StickySectionHeader title={currentSectionTitle} />

        <ScrollView
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
            <FormField label="Teléfono" required helperText="10 dígitos" errorText={errors.telefono}>
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={formatPhone(form.telefono)}
                onChangeText={(value) => updatePhoneField('telefono', value)}
                keyboardType="numeric"
                maxLength={14}
              />
            </FormField>

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

            <View onLayout={(event) => onSectionLayout('validacionesFinales', event.nativeEvent.layout.y)}>
              {renderSectionRow('VALIDACIONES FINALES')}
            </View>
            {renderSelectCard('tieneMedidorLuzSinAdeudo', '¿Tiene medidor de luz sin adeudo?', form.tieneMedidorLuzSinAdeudo, yesNoOptions, errors.tieneMedidorLuzSinAdeudo)}
            {renderSelectCard('viveMaximo5KmTesorera', '¿La integrante vive a máximo 5 km de la tesorera?', form.viveMaximo5KmTesorera, yesNoOptions, errors.viveMaximo5KmTesorera)}
            {renderSelectCard('tieneMenos70Anios', '¿La integrante tiene menos de 70 años?', form.tieneMenos70Anios, yesNoOptions, errors.tieneMenos70Anios)}

            <PrimaryButton title={isSubmitting ? 'Guardando...' : 'Guardar solicitud'} onPress={handleSubmit} disabled={isSubmitting || isRequiredEmpty || hasBlockingValidation} moduleTheme="documentation" />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  form: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
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
});
