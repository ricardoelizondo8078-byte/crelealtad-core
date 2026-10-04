import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { createHash } from 'crypto';

export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST = 12;

const MAX_MULTIPART_FIELDS = 16;
const MAX_MULTIPART_FIELD_SIZE_BYTES = 64 * 1024;
const MAX_MULTIPART_HEADER_PAIRS = 32;

export const SINGLE_FILE_MULTIPART_OPTIONS = {
  limits: {
    fieldNameSize: 100,
    fieldSize: MAX_MULTIPART_FIELD_SIZE_BYTES,
    fields: MAX_MULTIPART_FIELDS,
    fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
    files: 1,
    parts: MAX_MULTIPART_FIELDS + 1,
    headerPairs: MAX_MULTIPART_HEADER_PAIRS,
  },
} satisfies MulterOptions;

export const DOCUMENT_FILES_MULTIPART_OPTIONS = {
  limits: {
    fieldNameSize: 100,
    fieldSize: MAX_MULTIPART_FIELD_SIZE_BYTES,
    fields: 4,
    fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
    files: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST,
    parts: MAX_DOCUMENT_FILES_PER_MULTIPART_REQUEST + 4,
    headerPairs: MAX_MULTIPART_HEADER_PAIRS,
  },
} satisfies MulterOptions;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface BufferedUploadFile {
  buffer: Buffer;
  size: number;
}

export interface UploadValidationMessages {
  empty: string;
  tooLarge: string;
  invalid: string;
}

export type ImageUploadFormat = {
  extension: 'jpg' | 'png';
  mimeType: 'image/jpeg' | 'image/png';
};

export type DocumentUploadFormat = ImageUploadFormat | {
  extension: 'pdf';
  mimeType: 'application/pdf';
};

function validateSize(
  file: BufferedUploadFile,
  messages: UploadValidationMessages,
): Buffer {
  if (!file?.buffer?.length || file.size <= 0) {
    throw new BadRequestException(messages.empty);
  }
  if (
    file.size > MAX_UPLOAD_FILE_SIZE_BYTES
    || file.buffer.length > MAX_UPLOAD_FILE_SIZE_BYTES
  ) {
    throw new BadRequestException(messages.tooLarge);
  }
  return file.buffer;
}

function detectImage(bytes: Buffer): ImageUploadFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: 'jpg', mimeType: 'image/jpeg' };
  }
  if (bytes.length >= PNG_SIGNATURE.length && bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return { extension: 'png', mimeType: 'image/png' };
  }
  return null;
}

export function detectImageUploadFormat(
  file: BufferedUploadFile,
  messages: UploadValidationMessages,
): ImageUploadFormat {
  const format = detectImage(validateSize(file, messages));
  if (!format) throw new BadRequestException(messages.invalid);
  return format;
}

export function detectDocumentUploadFormat(
  file: BufferedUploadFile,
  messages: UploadValidationMessages,
): DocumentUploadFormat {
  const bytes = validateSize(file, messages);
  const imageFormat = detectImage(bytes);
  if (imageFormat) return imageFormat;
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-') {
    return { extension: 'pdf', mimeType: 'application/pdf' };
  }
  throw new BadRequestException(messages.invalid);
}

export function assertUuid(value: string, label: string): void {
  if (!UUID_PATTERN.test(value)) {
    throw new BadRequestException(`Identificador de ${label} inválido`);
  }
}

export function sha256Hex(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}
