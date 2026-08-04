import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import {
  AppHeader,
  Card,
  FormField,
  MultiSelectField,
  PickerField,
  ScreenContainer,
  ScreenTitleBar,
  SectionTitle,
  SelectorField,
  TextInput
} from '../../components/ui';
import { apiUrl } from '../../config/api';
import { colors, moduleThemes, radius, spacing, typography } from '../../theme/tokens';
import { formatCurrency, normalizeCurrencyInput } from '../../utils/currency';
import { formatPhone } from '../../utils/input';
import { llamar } from '../../utils/phone';

interface IntegranteVerificacionScreenProps {
  integranteId: string;
  nombreGrupo: string;
  integrantePosition?: number;
  integrantesTotal?: number;
  onBack?: () => void;
  onComplete?: () => void;
}

interface IntegranteData {
  id: string;
  nombre: string;
  telefono: string;
  montoSolicitado: number;
  esTesorera: boolean;
  esRenovacion: boolean;
}

interface SolicitudData {
  primer_nombre: string;
  segundo_nombre?: string;
  apellido_pat: string;
  apellido_mat?: string;
  dom_calle?: string;
  dom_num_ext?: string;
  dom_num_int?: string;
  dom_colonia?: string;
  dom_municipio?: string;
  dom_codigo_postal?: string;
  beneficiario_nombre?: string;
}

interface DocumentoItem {
  clave: string;
  nombre: string;
  icono: string;
  ruta?: string;
  estado: 'Capturado' | 'Pendiente';
  uriFrente?: string;  // URI local de la imagen frente
  uriReverso?: string; // URI local de la imagen reverso (solo para INEs)
  validacion?: 'si' | 'no' | null; // Resultado de la validación
}

type PasoVerificacion =
  | 'documentos'
  | 'llamada-integrante'
  | 'foto-domicilio'
  | 'localizacion'
  | 'evaluacion-economica'
  | 'referencias'
  | 'preguntas-generales'
  | 'preguntas-tesorera'
  | 'control-pagos'
  | 'autoevaluacion'
  | 'validacion-integrante'
  | 'observaciones'
  | 'decision';

export const IntegranteVerificacionScreen: React.FC<IntegranteVerificacionScreenProps> = ({
  integranteId,
  nombreGrupo,
  integrantePosition,
  integrantesTotal,
  onBack,
  onComplete
}) => {
  const [integrante, setIntegrante] = useState<IntegranteData | null>(null);
  const [solicitudData, setSolicitudData] = useState<SolicitudData | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoItem[]>([]);
  const [integrantesGrupo, setIntegrantesGrupo] = useState<IntegranteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pasoActual, setPasoActual] = useState<PasoVerificacion>('documentos');
  const [documentoViewing, setDocumentoViewing] = useState<DocumentoItem | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [ladoSeleccionado, setLadoSeleccionado] = useState<'frente' | 'reverso'>('frente');
  const scrollViewRef = useRef<ScrollView>(null);
  const [showStickyGastos, setShowStickyGastos] = useState(false);
  const gastosHeaderRef = useRef<View>(null);
  const [gastosHeaderY, setGastosHeaderY] = useState(0);
  const gastosEndRef = useRef<View>(null);
  const [gastosEndY, setGastosEndY] = useState(0);
  const fixedHeaderContainerRef = useRef<View>(null);
  const [fixedHeaderHeight, setFixedHeaderHeight] = useState(0); // Altura total del header fijo

  // Estado del formulario
  const [fotoDomicilio, setFotoDomicilio] = useState<string | null>(null);
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
  const [conoceIntegrantes, setConoceIntegrantes] = useState<string>('');
  const [conoceMontos, setConoceMontos] = useState<string>('');
  const [conoceTesorera, setConoceTesorera] = useState<string>('');
  const [conoceDomicilio, setConoceDomicilio] = useState<string>('');
  const [antiguedadDomicilio, setAntiguedadDomicilio] = useState('');
  const [tipoDomicilio, setTipoDomicilio] = useState<string>('');
  const [tieneNegocio, setTieneNegocio] = useState<string>('');
  const [tieneOtroCredito, setTieneOtroCredito] = useState<string>('');

  // Preguntas tesorera
  const [formoGrupo, setFormoGrupo] = useState<string>('');
  const [conoceMontosTesorera, setConoceMontosTesorera] = useState<string>('');
  const [lugarCobro, setLugarCobro] = useState('');

  // Control de pagos
  const [fotoControlPagos1, setFotoControlPagos1] = useState<string | null>(null);
  const [fotoControlPagos2, setFotoControlPagos2] = useState<string | null>(null);
  const [motivoSinControl, setMotivoSinControl] = useState('');

  // Autoevaluación
  const [tratoAsesor, setTratoAsesor] = useState<string>('');
  const [calidadServicio, setCalidadServicio] = useState<string>('');
  const [recomendaria, setRecomendaria] = useState<string>('');

  // Observaciones
  const [hayInconsistencias, setHayInconsistencias] = useState<string>('');
  const [realmenteViveAhi, setRealmenteViveAhi] = useState<string>('');
  const [recomendacion, setRecomendacion] = useState<string>('');
  const [observacionesAdicionales, setObservacionesAdicionales] = useState('');

  // Validacion Integrante (estados nuevos no duplicados)
  const [tiempoConoceIntegrantes, setTiempoConoceIntegrantes] = useState<string>('');
  const [sabeMontosCompaneras, setSabeMontosCompaneras] = useState<string>('');
  const [acuerdoMontos, setAcuerdoMontos] = useState<string>('');
  const [quienEsTesorera, setQuienEsTesorera] = useState('');
  const [domicilioRecoleccion, setDomicilioRecoleccion] = useState('');
  const [quienViveConUsted, setQuienViveConUsted] = useState<string[]>([]);
  const [aniosEnDomicilio, setAniosEnDomicilio] = useState<string>('');
  const [motivoCredito, setMotivoCredito] = useState('');
  const [ubicacionNegocio, setUbicacionNegocio] = useState('');

  // Llamada integrante
  const [showLlamadaModal, setShowLlamadaModal] = useState(false);
  const [resultadoLlamada, setResultadoLlamada] = useState<'si-contesto' | 'no-contesto' | null>(null);

  // Decision
  const [decision, setDecision] = useState<string>('');
  const [montoAutorizado, setMontoAutorizado] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  useEffect(() => {
    const loadIntegrante = async () => {
      setLoading(true);
      try {
        // Cargar datos del integrante
        const integranteResponse = await fetch(apiUrl(`/integrantes/${integranteId}`));
        if (!integranteResponse.ok) throw new Error('Failed to load integrante');

        const integranteData = await integranteResponse.json();
        setIntegrante({
          ...integranteData,
          esTesorera: integranteData.es_tesorera || false,
          esRenovacion: integranteData.ciclo > 1, // TODO: Ajustar lógica según tu modelo
        });

        // Inicializar monto autorizado con el solicitado
        setMontoAutorizado(integranteData.montoSolicitado?.toString() || '');

        // Cargar documentos de la solicitud
        const solicitudResponse = await fetch(apiUrl(`/solicitudes/integrante/${integranteId}`));
        if (solicitudResponse.ok) {
          const solicitudData = await solicitudResponse.json();

          // Guardar datos de la solicitud para usar en los headers
          setSolicitudData({
            primer_nombre: solicitudData.primer_nombre,
            segundo_nombre: solicitudData.segundo_nombre,
            apellido_pat: solicitudData.apellido_pat,
            apellido_mat: solicitudData.apellido_mat,
            dom_calle: solicitudData.dom_calle,
            dom_num_ext: solicitudData.dom_num_ext,
            dom_num_int: solicitudData.dom_num_int,
            dom_colonia: solicitudData.dom_colonia,
            dom_municipio: solicitudData.dom_municipio,
            dom_codigo_postal: solicitudData.dom_codigo_postal,
            beneficiario_nombre: solicitudData.beneficiario_nombre,
          });

          // Función para validar si una ruta es válida (no es mobile-temp)
          const esRutaValida = (ruta: string) => ruta && !ruta.startsWith('mobile-temp:');

          // Mapear y cargar documentos desde AsyncStorage
          const docsMap: DocumentoItem[] = await Promise.all([
            {
              clave: 'ine_integrante',
              nombre: 'INE',
              icono: '🪪',
              rutaDB: solicitudData.doc_ine_ruta,
            },
            {
              clave: 'comprobante_domicilio',
              nombre: 'Comprobante de domicilio',
              icono: '🧾',
              rutaDB: solicitudData.doc_comprobante_ruta,
            },
            {
              clave: 'ine_beneficiario',
              nombre: 'INE Beneficiario',
              icono: '🪪',
              rutaDB: solicitudData.doc_ine_beneficiario_ruta,
            },
            {
              clave: 'solicitud_firmada',
              nombre: 'Solicitud firmada',
              icono: '📄',
              rutaDB: solicitudData.doc_solicitud_firmada_ruta,
            },
          ].map(async (doc) => {
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
              } catch (error) {
                console.error('Error cargando documento desde AsyncStorage:', error);
              }
            }

            return {
              clave: doc.clave,
              nombre: doc.nombre,
              icono: doc.icono,
              ruta: rutaDB,
              estado: (rutaDB && esRutaValida(rutaDB)) ? 'Capturado' : 'Pendiente',
              uriFrente,
              uriReverso,
              validacion: null,
            } as DocumentoItem;
          }));

          setDocumentos(docsMap);
        }

        // Cargar integrantes del grupo para el selector de tesorera
        if (integranteData.expediente_id) {
          try {
            const grupoResponse = await fetch(apiUrl(`/expedientes/${integranteData.expediente_id}/integrantes`));
            if (grupoResponse.ok) {
              const integrantesData = await grupoResponse.json();
              console.log('Integrantes del grupo cargadas:', integrantesData);
              const integrantesMapped = integrantesData.map((int: any) => ({
                id: int.id,
                nombre: int.nombre || `${int.primer_nombre || ''} ${int.apellido_pat || ''}`.trim(),
                telefono: int.telefono,
                montoSolicitado: int.monto_solicitado || 0,
                esTesorera: int.es_tesorera || false,
                esRenovacion: int.ciclo > 1,
              }));
              setIntegrantesGrupo(integrantesMapped);
              console.log('Integrantes mapeadas:', integrantesMapped);
            } else {
              console.log('Error al cargar integrantes del grupo:', grupoResponse.status);
            }
          } catch (err) {
            console.log('Error en fetch de integrantes:', err);
          }
        }
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };

    loadIntegrante();
  }, [integranteId]);

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert(
        'Error',
        'No se pudo abrir la cámara. Por favor, verifica que los permisos estén habilitados.'
      );
    }
  };

  const siguientePaso = () => {
    const pasos: PasoVerificacion[] = [
      'documentos',
      'llamada-integrante',
      'foto-domicilio',
      'localizacion',
      ...(encontradaEnDomicilio === 'si' || alguienEnDomicilio === 'si' ? ['referencias' as PasoVerificacion] : []),
      ...(encontradaEnDomicilio === 'si' || alguienEnDomicilio === 'si' ? ['preguntas-generales' as PasoVerificacion] : []),
      ...(integrante?.esTesorera && (encontradaEnDomicilio === 'si' || alguienEnDomicilio === 'si') ? ['preguntas-tesorera' as PasoVerificacion] : []),
      ...(integrante?.esRenovacion && encontradaEnDomicilio === 'si' ? ['control-pagos' as PasoVerificacion] : []),
      ...(integrante?.esRenovacion && encontradaEnDomicilio === 'si' ? ['autoevaluacion' as PasoVerificacion] : []),
      'evaluacion-economica',
      'validacion-integrante',
      'observaciones',
      'decision',
    ];

    const indexActual = pasos.indexOf(pasoActual);
    if (indexActual < pasos.length - 1) {
      setPasoActual(pasos[indexActual + 1]);
    }
  };

  const pasoAnterior = () => {
    const pasos: PasoVerificacion[] = [
      'documentos',
      'llamada-integrante',
      'foto-domicilio',
      'localizacion',
      ...(encontradaEnDomicilio === 'si' || alguienEnDomicilio === 'si' ? ['referencias' as PasoVerificacion] : []),
      ...(encontradaEnDomicilio === 'si' || alguienEnDomicilio === 'si' ? ['preguntas-generales' as PasoVerificacion] : []),
      ...(integrante?.esTesorera && (encontradaEnDomicilio === 'si' || alguienEnDomicilio === 'si') ? ['preguntas-tesorera' as PasoVerificacion] : []),
      ...(integrante?.esRenovacion && encontradaEnDomicilio === 'si' ? ['control-pagos' as PasoVerificacion] : []),
      ...(integrante?.esRenovacion && encontradaEnDomicilio === 'si' ? ['autoevaluacion' as PasoVerificacion] : []),
      'evaluacion-economica',
      'validacion-integrante',
      'observaciones',
      'decision',
    ];

    const indexActual = pasos.indexOf(pasoActual);
    if (indexActual > 0) {
      setPasoActual(pasos[indexActual - 1]);
    }
  };

  const handleLlamarIntegrante = (telefono: string, nombre: string) => {
    llamar(telefono, nombre);
  };

  const handleRealizarLlamada = () => {
    if (integrante?.telefono && integrante?.nombre) {
      llamar(integrante.telefono, integrante.nombre);
      // Mostrar modal después de realizar la llamada
      setShowLlamadaModal(true);
    }
  };

  const handleResultadoLlamada = (resultado: 'si-contesto' | 'no-contesto') => {
    setResultadoLlamada(resultado);
    setShowLlamadaModal(false);
    // Opcional: Avanzar automáticamente al siguiente paso
    // siguientePaso();
  };

  const isDocumentosValidadosCompleto = (): boolean => {
    if (pasoActual !== 'documentos') return true;

    // Verificar que todos los documentos con fotos tengan validación
    const documentosConFoto = documentos.filter(doc =>
      doc.uriFrente || doc.uriReverso
    );

    if (documentosConFoto.length === 0) return false;

    // Todos los documentos con foto deben tener validación (si/no)
    return documentosConFoto.every(doc => doc.validacion !== null && doc.validacion !== undefined);
  };

  const isValidacionIntegranteCompleta = (): boolean => {
    if (pasoActual !== 'validacion-integrante') return true;

    return !!(
      conoceIntegrantes &&
      (conoceIntegrantes === 'No' || tiempoConoceIntegrantes) &&
      sabeMontosCompaneras &&
      acuerdoMontos &&
      quienEsTesorera &&
      domicilioRecoleccion &&
      quienViveConUsted.length > 0 &&
      aniosEnDomicilio &&
      tipoDomicilio &&
      motivoCredito.trim()
    );
  };

  const getNombreCompleto = (): string => {
    if (!solicitudData) return '';
    const partes = [
      solicitudData.primer_nombre,
      solicitudData.segundo_nombre,
      solicitudData.apellido_pat,
      solicitudData.apellido_mat,
    ].filter(Boolean);
    return partes.join(' ');
  };

  const getDomicilioCompleto = (): string => {
    if (!solicitudData) return '';
    const partes = [
      solicitudData.dom_calle,
      solicitudData.dom_num_ext,
      solicitudData.dom_num_int,
      solicitudData.dom_colonia,
      solicitudData.dom_municipio,
      solicitudData.dom_codigo_postal,
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
      case 'ine_beneficiario':
        return solicitudData?.beneficiario_nombre || documentoViewing.nombre;
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
      case 'ine_beneficiario':
        return '¿BENEFICIARIO COINCIDE?';
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
    setShowDocumentModal(false);
  };

  const finalizarVerificacion = async () => {
    // TODO: Guardar todos los datos de verificación
    Alert.alert(
      'Verificación completa',
      `Integrante: ${decision === 'aprueba' ? 'APROBADO' : decision === 'baja-monto' ? 'APROBADO CON MONTO MENOR' : 'RECHAZADO'}`,
      [
        {
          text: 'OK',
          onPress: () => onComplete?.()
        }
      ]
    );
  };

  const getTituloPaso = (): string => {
    return 'VERIFICACIÓN';
  };

  const getPasoActualNumero = (): { actual: number; total: number } => {
    const pasos: PasoVerificacion[] = [
      'documentos',
      'llamada-integrante',
      'foto-domicilio',
      'localizacion',
      ...(encontradaEnDomicilio === 'si' || alguienEnDomicilio === 'si' ? ['referencias' as PasoVerificacion] : []),
      ...(encontradaEnDomicilio === 'si' || alguienEnDomicilio === 'si' ? ['preguntas-generales' as PasoVerificacion] : []),
      ...(integrante?.esTesorera && (encontradaEnDomicilio === 'si' || alguienEnDomicilio === 'si') ? ['preguntas-tesorera' as PasoVerificacion] : []),
      ...(integrante?.esRenovacion && encontradaEnDomicilio === 'si' ? ['control-pagos' as PasoVerificacion] : []),
      ...(integrante?.esRenovacion && encontradaEnDomicilio === 'si' ? ['autoevaluacion' as PasoVerificacion] : []),
      'evaluacion-economica',
      'validacion-integrante',
      'observaciones',
      'decision',
    ];

    const actual = pasos.indexOf(pasoActual) + 1;
    const total = pasos.length;

    return { actual, total };
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

  const getCapacidadPago = () => {
    return getDisponible() * 0.5;
  };

  const getPagoSemanal = () => {
    const montoSolicitado = integrante?.montoSolicitado || 0;
    return (montoSolicitado / 1000) * 76;
  };

  const puedeParar = () => {
    return getCapacidadPago() >= getPagoSemanal();
  };

  if (loading) {
    return (
      <ScreenContainer moduleTheme="verification">
        <AppHeader showBackButton onBackPress={onBack} moduleTheme="verification" />
        <ActivityIndicator style={styles.loader} size="large" />
      </ScreenContainer>
    );
  }

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
        <AppHeader showBackButton onBackPress={onBack} moduleTheme="verification" />
        <ScreenTitleBar title="Verificación Individual" moduleTheme="verification" />

        {/* Banner del grupo */}
        <View style={styles.grupoBanner}>
          <Text allowFontScaling={false} style={styles.grupoBannerText}>
            {nombreGrupo}
          </Text>
        </View>

        {/* Datos del integrante */}
        <View style={styles.fixedSolicitanteContainer}>
          <Card style={styles.integranteCard}>
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

              <View style={styles.montoContainer}>
                <Text allowFontScaling={false} style={styles.montoIcon}>💰</Text>
                <Text allowFontScaling={false} style={styles.montoText}>
                  {formatCurrency(integrante?.montoSolicitado ?? 0)}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Barra de progreso del wizard */}
        <View style={styles.wizardProgressContainer}>
          <View style={styles.wizardHeaderOneLine}>
            <Text allowFontScaling={false} style={styles.wizardStepTitleCompact}>
              {getTituloPaso()}
            </Text>
            <Text allowFontScaling={false} style={styles.wizardStepTextCompact}>
              Paso {getPasoActualNumero().actual} de {getPasoActualNumero().total}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[
              styles.progressBarFill,
              { width: `${(getPasoActualNumero().actual / getPasoActualNumero().total) * 100}%` }
            ]} />
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
        style={styles.scroll}
        contentContainerStyle={styles.content}
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
        {/* PASO 1: Documentos */}
        {pasoActual === 'documentos' && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Documentos del Asesor" />
            <Text allowFontScaling={false} style={styles.helpText}>
              Revisa los documentos capturados por el asesor
            </Text>

            <View style={styles.documentosList}>
              {documentos.map((doc) => (
                <Pressable
                  key={doc.clave}
                  style={[
                    styles.documentoItem,
                    doc.estado === 'Pendiente' && styles.documentoItemPendiente
                  ]}
                  onPress={() => {
                    if (doc.estado === 'Capturado' && doc.ruta) {
                      setDocumentoViewing(doc);
                      setLadoSeleccionado('frente'); // Reset a frente cada vez
                      setShowDocumentModal(true);
                    } else {
                      Alert.alert(
                        'Documento no disponible',
                        `El documento "${doc.nombre}" no ha sido capturado por el asesor.`
                      );
                    }
                  }}
                  disabled={doc.estado === 'Pendiente'}
                >
                  <Text allowFontScaling={false} style={styles.documentoIcon}>
                    {doc.icono}
                  </Text>
                  <View style={styles.documentoInfo}>
                    <Text allowFontScaling={false} style={styles.documentoLabel}>
                      {doc.nombre}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.documentoEstado,
                        doc.estado === 'Capturado' ? styles.estadoCapturado : styles.estadoPendiente
                      ]}
                    >
                      {doc.estado}
                    </Text>
                  </View>
                  <View style={styles.documentoActionContainer}>
                    {doc.estado === 'Capturado' && doc.validacion && (
                      <View style={[
                        styles.validacionBadge,
                        doc.validacion === 'si' ? styles.validacionBadgeSi : styles.validacionBadgeNo
                      ]}>
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.validacionBadgeTexto,
                            { color: doc.validacion === 'si' ? colors.success : colors.error }
                          ]}
                        >
                          {doc.validacion === 'si' ? '✓' : '✗'}
                        </Text>
                      </View>
                    )}
                    {doc.estado === 'Capturado' ? (
                      <Text allowFontScaling={false} style={styles.documentoAction}>Ver →</Text>
                    ) : (
                      <Text allowFontScaling={false} style={styles.documentoActionDisabled}>—</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>

            {documentos.filter(d => d.estado === 'Pendiente').length > 0 && (
              <View style={styles.warningBox}>
                <Text allowFontScaling={false} style={styles.warningIcon}>⚠️</Text>
                <Text allowFontScaling={false} style={styles.warningText}>
                  Hay documentos pendientes. Puedes continuar pero considera solicitarlos al asesor.
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* PASO 2: Llamada a la integrante */}
        {pasoActual === 'llamada-integrante' && (
          <View style={styles.llamadaContainer}>
            <TouchableOpacity
              style={styles.llamarButton}
              onPress={handleRealizarLlamada}
              activeOpacity={0.8}
            >
              <Text allowFontScaling={false} style={styles.llamarButtonIcon}>📞</Text>
              <Text allowFontScaling={false} style={styles.llamarButtonText}>
                REALIZAR LLAMADA
              </Text>
            </TouchableOpacity>

            {resultadoLlamada && (
              <View style={[
                styles.resultadoLlamadaBanner,
                resultadoLlamada === 'si-contesto' ? styles.resultadoLlamadaSi : styles.resultadoLlamadaNo
              ]}>
                <Text allowFontScaling={false} style={styles.resultadoLlamadaIcon}>
                  {resultadoLlamada === 'si-contesto' ? '✓' : '✗'}
                </Text>
                <Text allowFontScaling={false} style={styles.resultadoLlamadaTexto}>
                  {resultadoLlamada === 'si-contesto' ? 'SÍ CONTESTÓ' : 'NO CONTESTÓ'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* PASO 3: Foto del domicilio */}
        {pasoActual === 'foto-domicilio' && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Foto del Domicilio" />
            <View style={styles.warningBox}>
              <Text allowFontScaling={false} style={styles.warningIcon}>⚠️</Text>
              <Text allowFontScaling={false} style={styles.warningText}>
                Solo cámara en vivo - sin carrete permitido
              </Text>
            </View>

            {fotoDomicilio ? (
              <View style={styles.fotoPreview}>
                <Image source={{ uri: fotoDomicilio }} style={styles.fotoImage} />
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => tomarFoto(setFotoDomicilio)}
                  activeOpacity={0.8}
                >
                  <Text allowFontScaling={false} style={styles.backButtonText}>Tomar nueva foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => tomarFoto(setFotoDomicilio)}
                activeOpacity={0.8}
              >
                <Text allowFontScaling={false} style={styles.continueButtonText}>📷 Tomar Foto del Domicilio</Text>
              </TouchableOpacity>
            )}

          </Card>
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

            {/* CÁLCULO AUTOMÁTICO */}
            <Card style={styles.mainCard}>
              <Text allowFontScaling={false} style={styles.capacidadPagoTitulo}>
                CAPACIDAD DE PAGO
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

              {/* PAGO SEMANAL DEL MONTO SOLICITADO */}
              <View style={styles.pagoSemanalBox}>
                <Text allowFontScaling={false} style={styles.pagoSemanalLabel}>
                  PAGO SEMANAL DE LO SOLICITADO
                </Text>
                <Text allowFontScaling={false} style={styles.pagoSemanalValor}>
                  {formatCurrency(getPagoSemanal())}
                </Text>
                <Text allowFontScaling={false} style={styles.pagoSemanalFormula}>
                  ({formatCurrency(integrante?.montoSolicitado || 0)} ÷ 1000) × 76
                </Text>
              </View>

              {/* CAPACIDAD DE PAGO */}
              <View style={[
                styles.resultadoBox,
                puedeParar() ? styles.resultadoBoxVerde : styles.resultadoBoxRojo
              ]}>
                <Text allowFontScaling={false} style={[
                  styles.resultadoLabel,
                  puedeParar() ? styles.resultadoLabelVerde : styles.resultadoLabelRojo
                ]}>
                  CAPACIDAD DE PAGO SEMANAL (50%)
                </Text>
                <Text allowFontScaling={false} style={[
                  styles.resultadoValor,
                  puedeParar() ? styles.resultadoValorVerde : styles.resultadoValorRojo
                ]}>
                  {formatCurrency(getCapacidadPago())}
                </Text>
                <Text allowFontScaling={false} style={styles.resultadoFormula}>
                  {formatCurrency(getDisponible())} × 50%
                </Text>
                <View style={styles.resultadoIndicador}>
                  <Text allowFontScaling={false} style={[
                    styles.resultadoIndicadorTexto,
                    puedeParar() ? styles.resultadoIndicadorTextoVerde : styles.resultadoIndicadorTextoRojo
                  ]}>
                    {puedeParar() ? '✓ PUEDE PAGAR' : '✗ CAPACIDAD INSUFICIENTE'}
                  </Text>
                </View>
              </View>
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
              <Text allowFontScaling={false} style={styles.tesoreraIconLarge}>👑</Text>
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
                    <Image source={{ uri: fotoControlPagos1 }} style={styles.fotoControlImage} />
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => tomarFoto(setFotoControlPagos1)}
                      activeOpacity={0.8}
                    >
                      <Text allowFontScaling={false} style={styles.backButtonText}>Retomar</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => tomarFoto(setFotoControlPagos1)}
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
                      onPress={() => tomarFoto(setFotoControlPagos2)}
                      activeOpacity={0.8}
                    >
                      <Text allowFontScaling={false} style={styles.backButtonText}>Retomar</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => tomarFoto(setFotoControlPagos2)}
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
            <SectionTitle title="PREGUNTAS GENERALES" />

            <SelectorField
              label="Conoce a todas las integrantes del grupo?"
              value={conoceIntegrantes}
              options={['Si', 'No']}
              onSelect={setConoceIntegrantes}
              moduleTheme="verification"
              required
            />

            {conoceIntegrantes === 'Si' && (
              <SelectorField
                label="Desde hace cuanto?"
                value={tiempoConoceIntegrantes}
                options={['0-1 años', '1-3 años', '3+ años']}
                onSelect={setTiempoConoceIntegrantes}
                moduleTheme="verification"
                required
              />
            )}

            <SelectorField
              label="Sabe cuanto estan pidiendo sus companeras?"
              value={sabeMontosCompaneras}
              options={['Si', 'No']}
              onSelect={setSabeMontosCompaneras}
              moduleTheme="verification"
              required
            />

            <SelectorField
              label="Esta de acuerdo con los montos?"
              value={acuerdoMontos}
              options={['Si', 'No']}
              onSelect={setAcuerdoMontos}
              moduleTheme="verification"
              required
            />

            <PickerField
              label="Quien es la tesorera del grupo?"
              value={quienEsTesorera}
              options={
                integrantesGrupo.length > 0
                  ? integrantesGrupo.map(int => int.nombre)
                  : ['Cargando integrantes...']
              }
              onSelect={setQuienEsTesorera}
              placeholder="Seleccionar tesorera"
              moduleTheme="verification"
              required
            />

            <PickerField
              label="En el domicilio de que integrante se recolectaran los pagos?"
              value={domicilioRecoleccion}
              options={
                integrantesGrupo.length > 0
                  ? integrantesGrupo.map(int => int.nombre)
                  : ['Cargando integrantes...']
              }
              onSelect={setDomicilioRecoleccion}
              placeholder="Seleccionar integrante"
              moduleTheme="verification"
              required
            />

            <MultiSelectField
              label="Quien vive actualmente con usted?"
              value={quienViveConUsted}
              options={['Conyuge', 'Hijos', 'Padres', 'Hermanos', 'Otros']}
              onSelect={setQuienViveConUsted}
              helperText="Selecciona todas las opciones que apliquen"
              moduleTheme="verification"
              required
            />

            <SelectorField
              label="Hace cuantos años vive en este domicilio?"
              value={aniosEnDomicilio}
              options={['0-1 años', '1-3 años', '3+ años']}
              onSelect={setAniosEnDomicilio}
              moduleTheme="verification"
              required
            />

            <SelectorField
              label="Renta, o es Dueña del domicilio?"
              value={tipoDomicilio}
              options={['Renta', 'Dueña']}
              onSelect={setTipoDomicilio}
              moduleTheme="verification"
              required
            />

            <FormField label="Por que pidio el credito?" required>
              <TextInput
                value={motivoCredito}
                onChangeText={setMotivoCredito}
                placeholder="Motivo del credito"
                multiline
              />
            </FormField>

            <FormField label="En caso de tener negocio, de que es?">
              <TextInput
                value={tieneNegocio}
                onChangeText={setTieneNegocio}
                placeholder="Tipo de negocio"
              />
            </FormField>

            {tieneNegocio && (
              <FormField label="Donde se ubica el negocio?">
                <TextInput
                  value={ubicacionNegocio}
                  onChangeText={setUbicacionNegocio}
                  placeholder="Direccion del negocio"
                  multiline
                />
              </FormField>
            )}
          </Card>
        )}

        {/* PASO 10: Observaciones */}
        {pasoActual === 'observaciones' && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Observaciones del Verificador" />

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

        {/* PASO 11: Decisión */}
        {pasoActual === 'decision' && (
          <Card style={styles.mainCard}>
            <SectionTitle title="Decisión del Verificador" />

            <SelectorField
              label="Decisión"
              value={decision}
              options={['Aprueba', 'Baja monto', 'Rechaza']}
              onSelect={(value) => {
                setDecision(value.toLowerCase().replace(' ', '-'));
                if (value === 'Aprueba') {
                  setMontoAutorizado(integrante?.montoSolicitado?.toString() || '');
                }
              }}
              moduleTheme="verification"
            />

            {decision === 'aprueba' && (
              <View style={styles.decisionAprobado}>
                <Text allowFontScaling={false} style={styles.decisionIcon}>✅</Text>
                <Text allowFontScaling={false} style={styles.decisionLabel}>
                  Monto autorizado
                </Text>
                <Text allowFontScaling={false} style={styles.decisionMonto}>
                  {formatCurrency(integrante?.montoSolicitado ?? 0)}
                </Text>
              </View>
            )}

            {decision === 'baja-monto' && (
              <>
                <TextInput
                  label="Monto autorizado (menor al solicitado)"
                  value={montoAutorizado}
                  onChangeText={setMontoAutorizado}
                  keyboardType="numeric"
                />
                <View style={styles.montoComparacion}>
                  <Text allowFontScaling={false} style={styles.montoSolicitado}>
                    Solicitado: {formatCurrency(integrante?.montoSolicitado ?? 0)}
                  </Text>
                  <Text allowFontScaling={false} style={styles.montoAutorizadoText}>
                    Autorizado: {formatCurrency(Number(montoAutorizado) || 0)}
                  </Text>
                </View>

                {/* Validación visual */}
                {montoAutorizado && Number(montoAutorizado) > 0 && Number(montoAutorizado) >= (integrante?.montoSolicitado ?? 0) && (
                  <View style={styles.warningBox}>
                    <Text allowFontScaling={false} style={styles.warningIcon}>⚠️</Text>
                    <Text allowFontScaling={false} style={styles.warningText}>
                      El monto autorizado debe ser MENOR al solicitado
                    </Text>
                  </View>
                )}

                {montoAutorizado && Number(montoAutorizado) <= 0 && (
                  <View style={styles.warningBox}>
                    <Text allowFontScaling={false} style={styles.warningIcon}>⚠️</Text>
                    <Text allowFontScaling={false} style={styles.warningText}>
                      El monto autorizado debe ser mayor a cero
                    </Text>
                  </View>
                )}

                <TextInput
                  label="Motivo de la reducción"
                  value={motivoRechazo}
                  onChangeText={setMotivoRechazo}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}

            {decision === 'rechaza' && (
              <>
                <View style={styles.decisionRechazado}>
                  <Text allowFontScaling={false} style={styles.decisionIcon}>❌</Text>
                  <Text allowFontScaling={false} style={styles.decisionLabel}>
                    Integrante rechazada
                  </Text>
                </View>
                <TextInput
                  label="Motivo del rechazo"
                  value={motivoRechazo}
                  onChangeText={setMotivoRechazo}
                  multiline
                  numberOfLines={4}
                  placeholder="Explica el motivo del rechazo..."
                />
              </>
            )}

          </Card>
        )}
      </ScrollView>

      {/* Barra de navegación fija en la parte inferior */}
      <View style={styles.navigationButtons}>
        {getPasoActualNumero().actual > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={pasoAnterior}
            activeOpacity={0.8}
          >
            <Text allowFontScaling={false} style={styles.backButtonText}>← Atrás</Text>
          </TouchableOpacity>
        )}

        {pasoActual !== 'decision' ? (
          <TouchableOpacity
            style={[
              styles.continueButton,
              (
                (pasoActual === 'documentos' && !isDocumentosValidadosCompleto()) ||
                (pasoActual === 'llamada-integrante' && !resultadoLlamada) ||
                (pasoActual === 'foto-domicilio' && !fotoDomicilio) ||
                (pasoActual === 'localizacion' && !encontradaEnDomicilio) ||
                (pasoActual === 'control-pagos' && !fotoControlPagos1 && !fotoControlPagos2 && !motivoSinControl) ||
                (pasoActual === 'validacion-integrante' && !isValidacionIntegranteCompleta())
              ) && styles.continueButtonDisabled
            ]}
            onPress={siguientePaso}
            disabled={
              (pasoActual === 'documentos' && !isDocumentosValidadosCompleto()) ||
              (pasoActual === 'llamada-integrante' && !resultadoLlamada) ||
              (pasoActual === 'foto-domicilio' && !fotoDomicilio) ||
              (pasoActual === 'localizacion' && !encontradaEnDomicilio) ||
              (pasoActual === 'control-pagos' && !fotoControlPagos1 && !fotoControlPagos2 && !motivoSinControl) ||
              (pasoActual === 'validacion-integrante' && !isValidacionIntegranteCompleta())
            }
            activeOpacity={0.8}
          >
            <Text allowFontScaling={false} style={styles.continueButtonText}>Continuar →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!decision ||
              (decision === 'baja-monto' && (
                !motivoRechazo ||
                !montoAutorizado ||
                Number(montoAutorizado) <= 0 ||
                Number(montoAutorizado) >= (integrante?.montoSolicitado ?? 0)
              )) ||
              (decision === 'rechaza' && !motivoRechazo)) && styles.continueButtonDisabled
            ]}
            onPress={finalizarVerificacion}
            disabled={
              !decision ||
              (decision === 'baja-monto' && (
                !motivoRechazo ||
                !montoAutorizado ||
                Number(montoAutorizado) <= 0 ||
                Number(montoAutorizado) >= (integrante?.montoSolicitado ?? 0)
              )) ||
              (decision === 'rechaza' && !motivoRechazo)
            }
            activeOpacity={0.8}
          >
            <Text allowFontScaling={false} style={styles.continueButtonText}>Finalizar Verificación</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal para visualizar documentos */}
      <Modal
        visible={showDocumentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDocumentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text allowFontScaling={false} style={styles.modalSubtitle}>
                  {documentoViewing?.nombre}
                </Text>
                <Text allowFontScaling={false} style={styles.modalTitle}>
                  {getModalHeaderTitle()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDocumentModal(false)}
                style={styles.modalCloseButton}
              >
                <Text allowFontScaling={false} style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {documentoViewing?.uriFrente ? (
              // Si tiene URIs locales, mostrar la imagen
              documentoViewing.uriReverso ? (
                // Si tiene reverso (INE), usar ScrollView horizontal con paginación
                <View style={styles.swipeableContainer}>
                  <Text allowFontScaling={false} style={styles.swipeInstructionText}>
                    Desliza para ver frente y reverso
                  </Text>
                  <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(event) => {
                      const offsetX = event.nativeEvent.contentOffset.x;
                      setLadoSeleccionado(offsetX > SCREEN_WIDTH / 2 ? 'reverso' : 'frente');
                    }}
                    style={styles.imageScrollView}
                  >
                    <View style={styles.imagePageContainer}>
                      <Image
                        source={{ uri: documentoViewing.uriFrente }}
                        style={styles.fullScreenImage}
                        resizeMode="contain"
                      />
                      <Text allowFontScaling={false} style={styles.imageLabelOverlay}>Frente</Text>
                    </View>
                    <View style={styles.imagePageContainer}>
                      <Image
                        source={{ uri: documentoViewing.uriReverso }}
                        style={styles.fullScreenImage}
                        resizeMode="contain"
                      />
                      <Text allowFontScaling={false} style={styles.imageLabelOverlay}>Reverso</Text>
                    </View>
                  </ScrollView>
                  {/* Indicador de página */}
                  <View style={styles.pageIndicator}>
                    <View style={[
                      styles.pageIndicatorDot,
                      ladoSeleccionado === 'frente' && styles.pageIndicatorDotActive
                    ]} />
                    <View style={[
                      styles.pageIndicatorDot,
                      ladoSeleccionado === 'reverso' && styles.pageIndicatorDotActive
                    ]} />
                  </View>
                </View>
              ) : (
                // Documento simple (solo frente)
                <ScrollView
                  style={styles.modalImageContainer}
                  contentContainerStyle={styles.modalImageContent}
                >
                  <Image
                    source={{ uri: documentoViewing.uriFrente }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                </ScrollView>
              )
            ) : documentoViewing?.ruta?.startsWith('mobile-temp:') ? (
              <ScrollView
                style={styles.modalImageContainer}
                contentContainerStyle={styles.modalImageContent}
              >
                <View style={styles.placeholderContainer}>
                  <Text allowFontScaling={false} style={styles.placeholderIcon}>
                    {documentoViewing.icono}
                  </Text>
                  <Text allowFontScaling={false} style={styles.placeholderTitle}>
                    Documento capturado
                  </Text>
                  <Text allowFontScaling={false} style={styles.placeholderText}>
                    {documentoViewing.nombre}
                  </Text>
                  <View style={styles.placeholderInfoBox}>
                    <Text allowFontScaling={false} style={styles.placeholderInfoIcon}>💡</Text>
                    <Text allowFontScaling={false} style={styles.placeholderInfoText}>
                      El documento fue capturado por el asesor.{'\n'}
                      La imagen no está disponible en este dispositivo.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.modalImageContainer}
                contentContainerStyle={styles.modalImageContent}
              >
                <View style={styles.placeholderContainer}>
                  <Text allowFontScaling={false} style={styles.placeholderIcon}>⚠️</Text>
                  <Text allowFontScaling={false} style={styles.placeholderTitle}>
                    Documento no disponible
                  </Text>
                  <Text allowFontScaling={false} style={styles.placeholderText}>
                    La imagen no se encuentra en este dispositivo
                  </Text>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <Text allowFontScaling={false} style={styles.validacionPregunta}>
                {getPreguntaValidacion()}
              </Text>
              <View style={styles.validacionBotones}>
                <TouchableOpacity
                  style={styles.validacionBotonSi}
                  onPress={() => handleValidacion('si')}
                  activeOpacity={0.8}
                >
                  <Text allowFontScaling={false} style={styles.validacionBotonSiTexto}>✓ SÍ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.validacionBotonNo}
                  onPress={() => handleValidacion('no')}
                  activeOpacity={0.8}
                >
                  <Text allowFontScaling={false} style={styles.validacionBotonNoTexto}>✗ NO</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para resultado de llamada */}
      <Modal
        visible={showLlamadaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLlamadaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text allowFontScaling={false} style={styles.modalTitle}>
                Resultado de la Llamada
              </Text>
            </View>

            <View style={styles.llamadaModalContent}>
              <Text allowFontScaling={false} style={styles.llamadaModalIcon}>📞</Text>
              <Text allowFontScaling={false} style={styles.llamadaModalPregunta}>
                ¿La integrante contestó la llamada?
              </Text>

              <View style={styles.llamadaModalBotones}>
                <TouchableOpacity
                  style={styles.llamadaBotonNo}
                  onPress={() => handleResultadoLlamada('no-contesto')}
                  activeOpacity={0.8}
                >
                  <Text allowFontScaling={false} style={styles.llamadaBotonNoTexto}>
                    ✗ NO CONTESTÓ
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.llamadaBotonSi}
                  onPress={() => handleResultadoLlamada('si-contesto')}
                  activeOpacity={0.8}
                >
                  <Text allowFontScaling={false} style={styles.llamadaBotonSiTexto}>
                    ✓ SÍ CONTESTÓ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: 400
  },
  grupoBanner: {
    backgroundColor: moduleThemes.verification.headerBg,
    paddingVertical: 6,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: moduleThemes.verification.titleBarBg,
  },
  grupoBannerText: {
    color: '#FDE047', // Amarillo brillante
    fontSize: 16,
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
    borderColor: colors.gray[900],
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
    color: colors.gray[600],
    textAlign: 'right',
  },
  contactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.sm,
  },
  phoneRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.3,
    gap: 6,
  },
  phoneDisplayContainer: {
    backgroundColor: colors.gray[50],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  phoneIconButton: {
    backgroundColor: colors.gray[50],
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
    backgroundColor: colors.warningLight,
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
  documentosList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  documentoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gray[900],
    gap: spacing.md,
  },
  documentoItemPendiente: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[300],
    opacity: 0.6,
  },
  documentoIcon: {
    fontSize: 32,
  },
  documentoInfo: {
    flex: 1,
  },
  documentoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  documentoEstado: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  estadoCapturado: {
    color: colors.success,
  },
  estadoPendiente: {
    color: colors.gray[400],
  },
  documentoActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  documentoAction: {
    fontSize: 16,
    fontWeight: '700',
    color: moduleThemes.verification.headerBg,
  },
  documentoActionDisabled: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[300],
  },
  validacionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  validacionBadgeSi: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  validacionBadgeNo: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.error,
  },
  validacionBadgeTexto: {
    fontSize: 18,
    fontWeight: '700',
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
  tesoreraIconLarge: {
    fontSize: 40,
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
  // Modal de visualización de documentos
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    height: '90%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: moduleThemes.verification.headerBg,
    borderBottomWidth: 2,
    borderBottomColor: moduleThemes.verification.titleBarBg,
  },
  modalTitleContainer: {
    flex: 1,
    gap: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 20,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  modalImageContainer: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  modalImageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
  modalActions: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.md,
  },
  validacionPregunta: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  validacionBotones: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  validacionBotonSi: {
    flex: 1,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.success,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validacionBotonSiTexto: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '700',
  },
  validacionBotonNo: {
    flex: 1,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.error,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validacionBotonNoTexto: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '700',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  placeholderInfoBox: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: spacing.sm,
    maxWidth: 320,
  },
  placeholderInfoIcon: {
    fontSize: 20,
  },
  placeholderInfoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 20,
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
  // Estilos para swipeable (deslizable)
  swipeableContainer: {
    flex: 1,
  },
  swipeInstructionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.warningLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning,
  },
  imageScrollView: {
    flex: 1,
  },
  imagePageContainer: {
    width: SCREEN_WIDTH * 0.95,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  imageLabelOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  pageIndicatorDotActive: {
    width: 24,
    backgroundColor: moduleThemes.verification.headerBg,
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
  // Estilos para el paso de llamada
  llamadaContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  llamarButton: {
    backgroundColor: moduleThemes.verification.titleBarBg,
    borderRadius: radius.md,
    paddingVertical: 19,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 4,
    borderColor: moduleThemes.verification.headerBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  llamarButtonIcon: {
    fontSize: 32,
  },
  llamarButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  resultadoLlamadaBanner: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  resultadoLlamadaSi: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  resultadoLlamadaNo: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.error,
  },
  resultadoLlamadaIcon: {
    fontSize: 24,
  },
  resultadoLlamadaTexto: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // Estilos para el modal de resultado de llamada
  llamadaModalContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  llamadaModalIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  llamadaModalPregunta: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  llamadaModalBotones: {
    flexDirection: 'column',
    gap: spacing.md,
    width: '100%',
  },
  llamadaBotonSi: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.success,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  llamadaBotonSiTexto: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '700',
  },
  llamadaBotonNo: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.error,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  llamadaBotonNoTexto: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '700',
  },
});
