import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { SolicitudFormData, SolicitudErrors, DocumentoRequerido } from '../types/solicitud.types';
import { DOCUMENTOS_REQUERIDOS } from '../types/constants';
import { solicitudService } from '../services/solicitudService';

interface UseSolicitudFormProps {
  integranteId: string;
  integranteNombre?: string;
  initialStep?: number;
  onSaved?: () => void;
  onDataChange?: (data: { nombre?: string; telefono?: string; montoSolicitado?: number }) => void;
}

export const useSolicitudForm = ({
  integranteId,
  integranteNombre,
  initialStep = 1,
  onSaved,
  onDataChange,
}: UseSolicitudFormProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<SolicitudFormData>({});
  const [errors, setErrors] = useState<SolicitudErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoRequerido[]>(DOCUMENTOS_REQUERIDOS);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [activeSelector, setActiveSelector] = useState<string | null>(null);

  // Referencias para scroll
  const scrollViewRef = useRef<any>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, [integranteId]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Cargar datos guardados localmente
      const savedData = await AsyncStorage.getItem(`solicitud_${integranteId}`);
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }

      // Cargar datos del servidor
      const serverData = await solicitudService.getByIntegrante(integranteId);
      if (serverData) {
        setFormData(prev => ({ ...prev, ...serverData }));
      }

      // Pre-llenar nombre si viene de props
      if (integranteNombre && !formData.primerNombre) {
        const nombres = integranteNombre.split(' ');
        setFormData(prev => ({
          ...prev,
          primerNombre: nombres[0],
          segundoNombre: nombres[1] || '',
        }));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar datos localmente cada vez que cambian
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      AsyncStorage.setItem(`solicitud_${integranteId}`, JSON.stringify(formData));
    }
  }, [formData, integranteId]);

  // Notificar cambios al padre
  useEffect(() => {
    if (onDataChange) {
      const nombre = [formData.primerNombre, formData.segundoNombre, formData.apellidoPaterno, formData.apellidoMaterno]
        .filter(Boolean)
        .join(' ');

      onDataChange({
        nombre: nombre || undefined,
        telefono: formData.telefono,
        montoSolicitado: formData.montoSolicitado ? parseFloat(formData.montoSolicitado) : undefined,
      });
    }
  }, [formData.primerNombre, formData.segundoNombre, formData.apellidoPaterno, formData.apellidoMaterno, formData.telefono, formData.montoSolicitado]);

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const updateMultipleFields = useCallback((updates: Partial<SolicitudFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNext = useCallback(async () => {
    // Guardar en servidor antes de avanzar
    try {
      await solicitudService.partialUpdate(integranteId, formData);

      if (currentStep < 7) {
        setCurrentStep(prev => prev + 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la información');
    }
  }, [currentStep, integranteId, formData]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSaving(true);

      // Validar documentos obligatorios
      const documentosFaltantes = documentos.filter(
        doc => doc.obligatorio && doc.status === 'PENDIENTE'
      );

      if (documentosFaltantes.length > 0) {
        Alert.alert(
          'Documentos Faltantes',
          `Faltan los siguientes documentos:\n${documentosFaltantes.map(d => `• ${d.nombre}`).join('\n')}`
        );
        return;
      }

      // Guardar final
      await solicitudService.partialUpdate(integranteId, formData);

      Alert.alert('Éxito', 'Solicitud guardada correctamente', [
        { text: 'OK', onPress: () => onSaved?.() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la solicitud');
    } finally {
      setIsSaving(false);
    }
  }, [integranteId, formData, documentos, onSaved]);

  const openSelector = useCallback((fieldKey: string) => {
    setActiveSelector(fieldKey);
    setSelectorVisible(true);
  }, []);

  const closeSelector = useCallback(() => {
    setSelectorVisible(false);
    setActiveSelector(null);
  }, []);

  const updateDocument = useCallback((docId: string, updates: Partial<DocumentoRequerido>) => {
    setDocumentos(prev =>
      prev.map(doc => doc.id === docId ? { ...doc, ...updates } : doc)
    );
  }, []);

  return {
    // Estado
    currentStep,
    formData,
    errors,
    isLoading,
    isSaving,
    documentos,
    selectorVisible,
    activeSelector,
    scrollViewRef,

    // Acciones
    setCurrentStep,
    updateFormData,
    updateMultipleFields,
    handleNext,
    handleBack,
    handleSubmit,
    openSelector,
    closeSelector,
    setErrors,
    updateDocument,
  };
};
