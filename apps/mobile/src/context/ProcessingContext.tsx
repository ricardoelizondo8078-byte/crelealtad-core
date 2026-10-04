import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { ProcessingOverlay } from '../components/ui/ProcessingOverlay';
import {
  DEFAULT_PROCESSING_MESSAGE,
  getProcessingSnapshot,
  runWithProcessing,
  subscribeToProcessing,
} from '../services/processing-controller';

interface ProcessingContextData {
  active: boolean;
  run: typeof runWithProcessing;
}

const ProcessingContext = createContext<ProcessingContextData | null>(null);

export function ProcessingProvider({ children }: { children: React.ReactNode }) {
  const processing = useSyncExternalStore(
    subscribeToProcessing,
    getProcessingSnapshot,
    getProcessingSnapshot,
  );

  const value = useMemo<ProcessingContextData>(() => ({
    active: processing.active,
    run: runWithProcessing,
  }), [processing.active]);

  return (
    <ProcessingContext.Provider value={value}>
      <View style={styles.root}>{children}</View>
      <ProcessingOverlay message={processing.message} visible={processing.active} />
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (!context) {
    throw new Error('useProcessing must be used within ProcessingProvider');
  }
  return context;
}

export function useProcessingAction<TArgs extends unknown[]>(
  action: ((...args: TArgs) => void | Promise<void>) | undefined,
  message = DEFAULT_PROCESSING_MESSAGE,
): ((...args: TArgs) => void) | undefined {
  const { run } = useProcessing();
  const wrappedAction = useCallback((...args: TArgs) => {
    if (!action) return;
    void run(() => action(...args), message);
  }, [action, message, run]);

  return action ? wrappedAction : undefined;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
