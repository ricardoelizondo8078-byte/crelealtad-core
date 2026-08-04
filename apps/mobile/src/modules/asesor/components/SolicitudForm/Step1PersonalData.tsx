import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, FormField, PrimaryButton, SelectorField, DatePickerField } from '../../../../components/ui';
import { SolicitudFormData } from '../../types/solicitud.types';
import { spacing } from '../../../../theme/tokens';
import {
  GENERO_OPTIONS,
  NACIONALIDADES_OPTIONS,
  ESTADOS_MEXICO_OPTIONS,
  ESTADO_CIVIL_OPTIONS,
  NIVEL_ESTUDIO_OPTIONS,
} from '../../../../catalogs';
import { normalizeUppercaseText, normalizePhone, normalizeCurpInput } from '../../../../utils/input';
import { validateCURP } from '../../../../utils/validation';

interface Step1Props {
  data: SolicitudFormData;
  onNext: () => void;
  updateField: (field: string, value: any) => void;
  openSelector: (field: string) => void;
  scrollViewRef: any;
}

const normalizeCurpInput = (value: string): string => value.replace(/\s+/g, '').toUpperCase().slice(0, 18);

export const Step1PersonalData: React.FC<Step1Props> = ({
  data,
  onNext,
  updateField,
  openSelector,
  scrollViewRef,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleCurpChange = (value: string) => {
    const normalized = normalizeCurpInput(value);
    updateField('curp', normalized);
    if (errors.curp) {
      setErrors({ ...errors, curp: '' });
    }
  };

  const handleCurpBlur = () => {
    if (!data.curp) {
      setErrors({ ...errors, curp: 'Campo obligatorio' });
    } else if (data.curp.length !== 18 || !validateCURP(data.curp)) {
      setErrors({ ...errors, curp: 'CURP inválida' });
    }
  };

  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!data.primerNombre?.trim()) newErrors.primerNombre = 'Campo obligatorio';
    if (!data.apellidoPaterno?.trim()) newErrors.apellidoPaterno = 'Campo obligatorio';
    if (!data.apellidoMaterno?.trim()) newErrors.apellidoMaterno = 'Campo obligatorio';
    if (!data.curp?.trim()) {
      newErrors.curp = 'Campo obligatorio';
    } else if (data.curp.length !== 18 || !validateCURP(data.curp)) {
      newErrors.curp = 'CURP inválida';
    }
    if (!data.fechaNacimiento) newErrors.fechaNacimiento = 'Campo obligatorio';
    if (!data.nacionalidad) newErrors.nacionalidad = 'Campo obligatorio';
    if (data.nacionalidad === 'MEXICANA' && !data.estadoNacimiento) {
      newErrors.estadoNacimiento = 'Campo obligatorio';
    }
    if (!data.genero) newErrors.genero = 'Campo obligatorio';
    if (!data.estadoCivil) newErrors.estadoCivil = 'Campo obligatorio';
    if (!data.nivelEstudio) newErrors.nivelEstudio = 'Campo obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        <FormField
          label="Primer Nombre *"
          value={data.primerNombre || ''}
          onChangeText={(val) => updateField('primerNombre', normalizeUppercaseText(val))}
          error={errors.primerNombre}
          autoCapitalize="characters"
          placeholder="JUAN"
        />

        <FormField
          label="Segundo Nombre"
          value={data.segundoNombre || ''}
          onChangeText={(val) => updateField('segundoNombre', normalizeUppercaseText(val))}
          autoCapitalize="characters"
          placeholder="CARLOS"
        />

        <FormField
          label="Apellido Paterno *"
          value={data.apellidoPaterno || ''}
          onChangeText={(val) => updateField('apellidoPaterno', normalizeUppercaseText(val))}
          error={errors.apellidoPaterno}
          autoCapitalize="characters"
          placeholder="PÉREZ"
        />

        <FormField
          label="Apellido Materno *"
          value={data.apellidoMaterno || ''}
          onChangeText={(val) => updateField('apellidoMaterno', normalizeUppercaseText(val))}
          error={errors.apellidoMaterno}
          autoCapitalize="characters"
          placeholder="GARCÍA"
        />

        <FormField
          label="CURP *"
          value={data.curp || ''}
          onChangeText={handleCurpChange}
          onBlur={handleCurpBlur}
          error={errors.curp}
          autoCapitalize="characters"
          placeholder="PEGA850515HDFXXX01"
          maxLength={18}
        />

        <DatePickerField
          label="Fecha de Nacimiento *"
          value={data.fechaNacimiento || ''}
          onChange={(val) => updateField('fechaNacimiento', val)}
          error={errors.fechaNacimiento}
          placeholder="DD/MM/AAAA"
        />

        <SelectorField
          label="Nacionalidad *"
          value={data.nacionalidad || ''}
          onPress={() => openSelector('nacionalidad')}
          error={errors.nacionalidad}
          placeholder="Seleccionar"
        />

        {data.nacionalidad === 'MEXICANA' && (
          <SelectorField
            label="Estado de Nacimiento *"
            value={data.estadoNacimiento || ''}
            onPress={() => openSelector('estado_nacimiento')}
            error={errors.estadoNacimiento}
            placeholder="Seleccionar"
          />
        )}

        <SelectorField
          label="Género *"
          value={data.genero || ''}
          onPress={() => openSelector('genero')}
          error={errors.genero}
          placeholder="Seleccionar"
        />

        <SelectorField
          label="Estado Civil *"
          value={data.estadoCivil || ''}
          onPress={() => openSelector('estado_civil')}
          error={errors.estadoCivil}
          placeholder="Seleccionar"
        />

        <FormField
          label="Ocupación"
          value={data.ocupacion || ''}
          onChangeText={(val) => updateField('ocupacion', normalizeUppercaseText(val))}
          autoCapitalize="characters"
          placeholder="COMERCIANTE"
        />

        <SelectorField
          label="Nivel de Estudios *"
          value={data.nivelEstudio || ''}
          onPress={() => openSelector('nivel_estudio')}
          error={errors.nivelEstudio}
          placeholder="Seleccionar"
        />

        <FormField
          label="Teléfono"
          value={data.telefono || ''}
          onChangeText={(val) => updateField('telefono', normalizePhone(val))}
          keyboardType="phone-pad"
          placeholder="33 1234 5678"
          maxLength={12}
        />
      </Card>

      <View style={styles.footer}>
        <PrimaryButton title="Siguiente" onPress={handleNext} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: spacing.md,
  },
  footer: {
    padding: spacing.md,
  },
});
