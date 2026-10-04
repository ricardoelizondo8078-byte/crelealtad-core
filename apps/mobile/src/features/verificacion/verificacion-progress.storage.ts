import AsyncStorage from '@react-native-async-storage/async-storage';

export const VERIFICATION_TOTAL_STEPS = 7;

export interface LocalVerificationProgress {
  currentStep: 'documentos' | 'menu' | 'llamada-integrante';
  completedSteps: number;
  needsDocumentation: boolean;
  updatedAt: string;
}

const STORAGE_PREFIX = 'crelealtad:verification-progress:v1';

const getStorageKey = (userId: string, integranteId: string) =>
  `${STORAGE_PREFIX}:${userId}:${integranteId}`;

export async function getLocalVerificationProgress(
  userId: string,
  integranteId: string,
): Promise<LocalVerificationProgress | null> {
  try {
    const stored = await AsyncStorage.getItem(getStorageKey(userId, integranteId));
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<LocalVerificationProgress>;
    const currentStep = parsed.currentStep;
    const isKnownStep = currentStep === 'documentos'
      || currentStep === 'menu'
      || currentStep === 'llamada-integrante';

    if (!isKnownStep || typeof parsed.completedSteps !== 'number') {
      return null;
    }

    return {
      currentStep,
      completedSteps: Math.max(
        0,
        Math.min(VERIFICATION_TOTAL_STEPS, Math.trunc(parsed.completedSteps)),
      ),
      needsDocumentation: parsed.needsDocumentation === true,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export async function saveStepOneCompleted(
  userId: string,
  integranteId: string,
): Promise<void> {
  const progress: LocalVerificationProgress = {
    currentStep: 'menu',
    completedSteps: 1,
    needsDocumentation: false,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    getStorageKey(userId, integranteId),
    JSON.stringify(progress),
  );
}

export async function markNeedsDocumentation(
  userId: string,
  integranteId: string,
): Promise<void> {
  const progress: LocalVerificationProgress = {
    currentStep: 'documentos',
    completedSteps: 0,
    needsDocumentation: true,
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    getStorageKey(userId, integranteId),
    JSON.stringify(progress),
  );
}
