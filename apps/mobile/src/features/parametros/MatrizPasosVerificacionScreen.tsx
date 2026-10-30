import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  BottomActionBar,
  Card,
  ConfirmDialog,
  ScreenContainer,
  ScreenState,
  ScreenTitleBar,
  SectionTitle,
  StickySectionHeader,
  TaskMenuButton,
  TextInput,
} from '../../components/ui';
import { ApiError } from '../../services/api-client';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import {
  PASOS_VERIFICACION_CONFIGURABLES,
  publicarMatrizPasosVerificacion,
  obtenerMatrizPasosVerificacion,
  TIPOS_INTEGRANTE_VERIFICACION,
  type MatrizPasosVerificacion,
  type ModalidadPasoVerificacion,
  type PasoVerificacionConfigurable,
  type ReglaPasoVerificacion,
  type TipoIntegranteVerificacion,
} from './parametros-verificacion-pasos.api';

const ETIQUETAS_TIPO: Record<TipoIntegranteVerificacion, string> = {
  NUEVA: 'Nueva en CRELEALTAD',
  NUEVA_CON_EVIDENCIA: 'Nueva con evidencia de otra financiera',
  CICLO_2_MAS: 'Ciclo 2+ con CRELEALTAD',
  CICLO_2_MAS_CON_EVIDENCIA: 'Ciclo 2+ con evidencia para aumento',
};

const ETIQUETAS_PASO: Record<PasoVerificacionConfigurable, string> = {
  DOCUMENTOS: 'Documentos',
  LLAMADA: 'Llamada',
  VISITA_VECINO: 'Visita al vecino',
  IMAGENES_DOMICILIO: 'Imágenes del domicilio',
  ENTREVISTA: 'Entrevista',
  CONCLUSIONES: 'Conclusiones',
};

const ICONOS_TIPO: Record<TipoIntegranteVerificacion, string> = {
  NUEVA: 'NC',
  NUEVA_CON_EVIDENCIA: 'NE',
  CICLO_2_MAS: 'C2',
  CICLO_2_MAS_CON_EVIDENCIA: 'CA',
};

const ETIQUETAS_MODALIDAD: Record<ModalidadPasoVerificacion, string> = {
  OBLIGATORIO: 'Siempre',
  OPCIONAL: 'Opcional',
  OBLIGATORIO_DESPUES_DIAS: 'Después de',
};

const MODALIDADES: readonly ModalidadPasoVerificacion[] = [
  'OBLIGATORIO',
  'OPCIONAL',
  'OBLIGATORIO_DESPUES_DIAS',
];

interface MatrizPasosVerificacionScreenProps {
  canUpdate: boolean;
  onBack: () => void;
}

const mensajeError = (error: unknown): string => error instanceof ApiError
  ? error.message
  : 'No fue posible completar la operación. Intenta nuevamente.';

const claveRegla = (tipo: TipoIntegranteVerificacion, paso: PasoVerificacionConfigurable) => (
  `${tipo}:${paso}`
);

export const MatrizPasosVerificacionScreen: React.FC<
  MatrizPasosVerificacionScreenProps
> = ({ canUpdate, onBack }) => {
  const [matriz, setMatriz] = useState<MatrizPasosVerificacion | null>(null);
  const [reglas, setReglas] = useState<ReglaPasoVerificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoIntegranteVerificacion | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await obtenerMatrizPasosVerificacion();
      setMatriz(response.matriz);
      setReglas(response.matriz.reglas);
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // La carga remota ocurre al montar la pantalla y actualiza su estado desde la promesa.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const porClave = useMemo(() => new Map(
    reglas.map((regla) => [claveRegla(regla.tipo_integrante, regla.paso), regla]),
  ), [reglas]);

  const hayCambios = Boolean(matriz && JSON.stringify(matriz.reglas) !== JSON.stringify(reglas));

  const cambiar = (
    tipo: TipoIntegranteVerificacion,
    paso: PasoVerificacionConfigurable,
    modalidad: ModalidadPasoVerificacion,
  ) => {
    setReglas((actuales) => actuales.map((regla) => (
      regla.tipo_integrante === tipo && regla.paso === paso
        ? {
          ...regla,
          modalidad,
          dias_para_obligatorio: modalidad === 'OBLIGATORIO_DESPUES_DIAS'
            ? regla.dias_para_obligatorio ?? 30
            : null,
        }
        : regla
    )));
  };

  const cambiarDias = (
    tipo: TipoIntegranteVerificacion,
    paso: PasoVerificacionConfigurable,
    texto: string,
  ) => {
    const soloDigitos = texto.replace(/\D/g, '').slice(0, 4);
    setReglas((actuales) => actuales.map((regla) => (
      regla.tipo_integrante === tipo && regla.paso === paso
        ? { ...regla, dias_para_obligatorio: soloDigitos ? Number(soloDigitos) : 0 }
        : regla
    )));
  };

  const publicar = async () => {
    if (!matriz || !hayCambios || guardando || !canUpdate) return;
    setConfirmar(false);
    setGuardando(true);
    setError(null);
    try {
      const response = await publicarMatrizPasosVerificacion(matriz.revision, reglas);
      setMatriz(response.matriz);
      setReglas(response.matriz.reglas);
      setTipoSeleccionado(null);
    } catch (requestError) {
      setError(mensajeError(requestError));
    } finally {
      setGuardando(false);
    }
  };

  const regresar = () => {
    if (!tipoSeleccionado) {
      onBack();
      return;
    }

    setReglas(matriz?.reglas ?? []);
    setError(null);
    setTipoSeleccionado(null);
  };

  if (loading && !matriz) {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={regresar} moduleTheme="parameters" />
        <ScreenTitleBar title="Pasos obligatorios" moduleTheme="parameters" />
        <ScreenState title="Consultando matriz" loading />
      </ScreenContainer>
    );
  }

  if (!matriz) {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={regresar} moduleTheme="parameters" />
        <ScreenTitleBar title="Pasos obligatorios" moduleTheme="parameters" />
        <ScreenState
          title="No se pudo consultar"
          message={error ?? undefined}
          actionLabel="Reintentar"
          onAction={() => void cargar()}
        />
      </ScreenContainer>
    );
  }

  if (!tipoSeleccionado) {
    return (
      <ScreenContainer moduleTheme="parameters">
        <AppHeader showBackButton onBackPress={regresar} moduleTheme="parameters" />
        <ScreenTitleBar title="Pasos obligatorios" moduleTheme="parameters" />
        <FlatList
          data={TIPOS_INTEGRANTE_VERIFICACION}
          keyExtractor={(tipo) => tipo}
          contentContainerStyle={styles.content}
          renderItem={({ item: tipo }) => {
            const obligatorios = reglas.filter((regla) => (
              regla.tipo_integrante === tipo && regla.modalidad === 'OBLIGATORIO'
            )).length;
            const condicionales = reglas.filter((regla) => (
              regla.tipo_integrante === tipo && regla.modalidad === 'OBLIGATORIO_DESPUES_DIAS'
            )).length;
            return (
              <TaskMenuButton
                title={ETIQUETAS_TIPO[tipo]}
                description={`${obligatorios} obligatorios · ${condicionales} por días`}
                iconLabel={ICONOS_TIPO[tipo]}
                moduleTheme="parameters"
                onPress={() => setTipoSeleccionado(tipo)}
                accessibilityHint="Abre los pasos de Verificación para elegir obligatorios y opcionales"
              />
            );
          }}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer moduleTheme="parameters">
      <AppHeader showBackButton onBackPress={regresar} moduleTheme="parameters" />
      <ScreenTitleBar title="Pasos obligatorios" moduleTheme="parameters" />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.intro}>
          <SectionTitle title={ETIQUETAS_TIPO[tipoSeleccionado]} />
          <Text allowFontScaling={false} style={styles.helpText}>
            Los pasos pueden realizarse en cualquier orden. Un paso opcional seguirá disponible,
            pero no bloqueará el cierre cuando éste sea habilitado. Un paso condicionado será
            opcional hasta cumplir los días configurados desde su última terminación confirmada.
          </Text>
        </Card>

        <Card style={styles.card}>
          {PASOS_VERIFICACION_CONFIGURABLES.map((paso) => {
            const regla = porClave.get(claveRegla(tipoSeleccionado, paso));
            const modalidad = regla?.modalidad ?? 'OBLIGATORIO';
            const diasInvalidos = modalidad === 'OBLIGATORIO_DESPUES_DIAS'
              && (!regla?.dias_para_obligatorio
                || regla.dias_para_obligatorio < 1
                || regla.dias_para_obligatorio > 3650);
            return (
              <Card key={paso} style={styles.ruleCard}>
                <StickySectionHeader
                  title={ETIQUETAS_PASO[paso]}
                  moduleTheme="parameters"
                  variant="solid"
                  fullBleed
                />
                <View accessibilityRole="radiogroup" style={styles.modeRow}>
                  {MODALIDADES.map((opcion) => {
                    const seleccionada = modalidad === opcion;
                    return (
                      <Pressable
                        key={opcion}
                        accessibilityRole="radio"
                        accessibilityState={{
                          selected: seleccionada,
                          disabled: !canUpdate || guardando,
                        }}
                        disabled={!canUpdate || guardando}
                        onPress={() => cambiar(tipoSeleccionado, paso, opcion)}
                        style={[
                          styles.modeOption,
                          seleccionada && styles.modeOptionSelected,
                        ]}
                      >
                        <Text
                          allowFontScaling={false}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.82}
                          style={[
                            styles.modeOptionText,
                            seleccionada && styles.modeOptionTextSelected,
                          ]}
                        >
                          {ETIQUETAS_MODALIDAD[opcion]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {modalidad === 'OBLIGATORIO_DESPUES_DIAS' ? (
                  <TextInput
                    label="Días transcurridos"
                    value={regla?.dias_para_obligatorio
                      ? String(regla.dias_para_obligatorio)
                      : ''}
                    onChangeText={(value) => cambiarDias(tipoSeleccionado, paso, value)}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    moduleTheme="parameters"
                    editable={canUpdate && !guardando}
                    required
                    helperText="Al cumplir este plazo, el paso se vuelve obligatorio."
                    error={diasInvalidos ? 'Captura entre 1 y 3650 días' : undefined}
                  />
                ) : null}
              </Card>
            );
          })}
        </Card>

        {error ? <Text allowFontScaling={false} style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <BottomActionBar
        primaryLabel={guardando ? 'Publicando…' : canUpdate ? 'Guardar y publicar' : 'Sólo lectura'}
        secondaryLabel="Cancelar"
        onPrimary={() => setConfirmar(true)}
        onSecondary={regresar}
        primaryDisabled={!canUpdate || !hayCambios || guardando || reglas.some((regla) => (
          regla.modalidad === 'OBLIGATORIO_DESPUES_DIAS'
          && (!regla.dias_para_obligatorio
            || regla.dias_para_obligatorio < 1
            || regla.dias_para_obligatorio > 3650)
        ))}
        helperText={`Versión publicada ${matriz.revision}`}
      />

      <ConfirmDialog
        visible={confirmar}
        title="Publicar obligatoriedad"
        message="La nueva matriz se aplicará a las verificaciones que consulten estos parámetros."
        confirmLabel="Guardar y publicar"
        cancelLabel="Cancelar"
        onConfirm={() => void publicar()}
        onCancel={() => setConfirmar(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  intro: { gap: spacing.sm },
  card: { gap: spacing.md },
  ruleCard: {
    gap: spacing.md,
    paddingTop: 0,
    backgroundColor: colors.gray[50],
    overflow: 'hidden',
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeOption: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  modeOptionSelected: {
    borderColor: moduleThemes.parameters.primary,
    backgroundColor: moduleThemes.parameters.headerAccent,
  },
  modeOptionText: {
    ...typography.captionStrong,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modeOptionTextSelected: { color: moduleThemes.parameters.primary },
  helpText: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.body, color: colors.danger, textAlign: 'center' },
});
