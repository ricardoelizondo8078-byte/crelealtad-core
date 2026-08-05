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

    if (!data.primer_nombre?.trim()) newErrors.primer_nombre = 'Campo obligatorio';
    if (!data.apellido_pat?.trim()) newErrors.apellido_pat = 'Campo obligatorio';
    if (!data.apellido_mat?.trim()) newErrors.apellido_mat = 'Campo obligatorio';
    if (!data.curp?.trim()) {
      newErrors.curp = 'Campo obligatorio';
    } else if (data.curp.length !== 18 || !validateCURP(data.curp)) {
      newErrors.curp = 'CURP inválida';
    }
    if (!data.fecha_nac) newErrors.fecha_nac = 'Campo obligatorio';
    if (!data.nacionalidad) newErrors.nacionalidad = 'Campo obligatorio';
    if (data.nacionalidad === 'MEXICANA' && !data.estado_nacimiento) {
      newErrors.estado_nacimiento = 'Campo obligatorio';
    }
    if (!data.genero) newErrors.genero = 'Campo obligatorio';
    if (!data.estado_civil) newErrors.estado_civil = 'Campo obligatorio';
    if (!data.nivel_estudio) newErrors.nivel_estudio = 'Campo obligatorio';

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
          value={data.primer_nombre || ''}
          onChangeText={(val) => updateField('primer_nombre', normalizeUppercaseText(val))}
          error={errors.primer_nombre}
          autoCapitalize="characters"
          placeholder="JUAN"
        />

        <FormField
          label="Segundo Nombre"
          value={data.segundo_nombre || ''}
          onChangeText={(val) => updateField('segundo_nombre', normalizeUppercaseText(val))}
          autoCapitalize="characters"
          placeholder="CARLOS"
        />

        <FormField
          label="Apellido Paterno *"
          value={data.apellido_pat || ''}
          onChangeText={(val) => updateField('apellido_pat', normalizeUppercaseText(val))}
          error={errors.apellido_pat}
          autoCapitalize="characters"
          placeholder="PÉREZ"
        />

        <FormField
          label="Apellido Materno *"
          value={data.apellido_mat || ''}
          onChangeText={(val) => updateField('apellido_mat', normalizeUppercaseText(val))}
          error={errors.apellido_mat}
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
          value={data.fecha_nac || ''}
          onChange={(val) => updateField('fecha_nac', val)}
          error={errors.fecha_nac}
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
            value={data.estado_nacimiento || ''}
            onPress={() => openSelector('estado_nacimiento')}
            error={errors.estado_nacimiento}
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
          value={data.estado_civil || ''}
          onPress={() => openSelector('estado_civil')}
          error={errors.estado_civil}
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
          value={data.nivel_estudio || ''}
          onPress={() => openSelector('nivel_estudio')}
          error={errors.nivel_estudio}
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
