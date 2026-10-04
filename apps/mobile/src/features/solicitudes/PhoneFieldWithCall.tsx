import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../theme/tokens';
import { formatPhone, normalizePhone } from '../../utils/input';
import { llamar } from '../../utils/phone';

interface PhoneFieldWithCallProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  nombre?: string;
  relacion?: string;
}

export const PhoneFieldWithCall = React.memo(({
  value,
  onChange,
  placeholder = 'Teléfono',
  nombre,
  relacion,
}: PhoneFieldWithCallProps) => {
  const digitos = value?.replace(/\D/g, '') ?? '';
  const esValido = digitos.length === 10;

  return (
    <View style={styles.container}>
      <TextInput
        allowFontScaling={false}
        style={styles.input}
        placeholder={placeholder}
        value={formatPhone(value)}
        onChangeText={(nextValue) => onChange(normalizePhone(nextValue))}
        keyboardType="numeric"
        maxLength={14}
      />
      {esValido && (
        <TouchableOpacity
          onPress={() => llamar(value, nombre, relacion)}
          style={styles.callButton}
          accessibilityRole="button"
          accessibilityLabel={`Llamar a ${nombre || relacion || 'este teléfono'}`}
        >
          <Text allowFontScaling={false} style={styles.callIcon}>📞</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

PhoneFieldWithCall.displayName = 'PhoneFieldWithCall';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D9D5',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#F5F8F6',
  },
  callButton: {
    backgroundColor: colors.infoSoft,
    padding: 10,
    borderRadius: 8,
  },
  callIcon: {
    fontSize: 20,
  },
});
