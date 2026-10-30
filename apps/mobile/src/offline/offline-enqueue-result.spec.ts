import { durableFileUrisForResult } from './offline-enqueue-result';
import type { OfflineFileRef } from './offline-sync.types';

const files: OfflineFileRef[] = [{
  uri: 'file:///document/operacion/1-control_pagos-1.png.clenc',
  name: 'control_pagos-1.png',
  fieldName: 'archivos',
  size: 128,
  encryption: { version: 1, algorithm: 'AES-256-GCM' },
}];

describe('durableFileUrisForResult', () => {
  it('no expone la ruta cifrada después de que la sincronización la confirmó y limpió', () => {
    expect(durableFileUrisForResult({
      operationId: 'operacion',
      status: 'CONFIRMED',
    }, files)).toBeUndefined();
  });

  it('conserva la ruta cifrada mientras la operación necesita reintento', () => {
    expect(durableFileUrisForResult({
      operationId: 'operacion',
      status: 'PENDING',
    }, files)).toEqual([files[0].uri]);
  });
});
