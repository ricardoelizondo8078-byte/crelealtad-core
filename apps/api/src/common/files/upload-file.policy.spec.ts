import { BadRequestException } from '@nestjs/common';
import {
  assertUuid,
  detectDocumentUploadFormat,
  detectImageUploadFormat,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  sha256Hex,
} from './upload-file.policy';

const messages = {
  empty: 'vacío',
  tooLarge: 'demasiado grande',
  invalid: 'formato inválido',
};

describe('upload-file.policy', () => {
  it('detecta JPEG y PNG por firma, no por el MIME declarado', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(detectImageUploadFormat({ buffer: jpeg, size: jpeg.length }, messages))
      .toEqual({ extension: 'jpg', mimeType: 'image/jpeg' });
    expect(detectImageUploadFormat({ buffer: png, size: png.length }, messages))
      .toEqual({ extension: 'png', mimeType: 'image/png' });
  });

  it('acepta PDF solamente en la política documental', () => {
    const pdf = Buffer.from('%PDF-1.7', 'ascii');

    expect(detectDocumentUploadFormat({ buffer: pdf, size: pdf.length }, messages))
      .toEqual({ extension: 'pdf', mimeType: 'application/pdf' });
    expect(() => detectImageUploadFormat({ buffer: pdf, size: pdf.length }, messages))
      .toThrow(new BadRequestException(messages.invalid));
  });

  it('rechaza archivos vacíos y tamaños que exceden el límite común', () => {
    expect(() => detectImageUploadFormat({ buffer: Buffer.alloc(0), size: 0 }, messages))
      .toThrow(new BadRequestException(messages.empty));

    const jpeg = Buffer.from([0xff, 0xd8, 0xff]);
    expect(() => detectImageUploadFormat({
      buffer: jpeg,
      size: MAX_UPLOAD_FILE_SIZE_BYTES + 1,
    }, messages)).toThrow(new BadRequestException(messages.tooLarge));
  });

  it('protege segmentos de ruta y genera hashes SHA-256 estables', () => {
    expect(() => assertUuid('no-es-uuid', 'evidencia'))
      .toThrow('Identificador de evidencia inválido');
    expect(() => assertUuid('00000000-0000-4000-8000-000000000000', 'evidencia'))
      .not.toThrow();
    expect(sha256Hex(Buffer.from('crelealtad'))).toHaveLength(64);
  });
});
