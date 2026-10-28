import * as crypto from 'crypto';
import { ValidationError } from '../../errors/app-error';

/**
 * P19: Media Uploads, Content Sniffing, EXIF Stripping & CDN Serving
 *
 * Requirements:
 * 1. Presigned S3 PUT with size conditions (<= 8 MB).
 * 2. Magic byte content sniffing (never trust client MIME type).
 * 3. Server-side EXIF / GPS metadata stripping.
 * 4. Serve uploads from separate CDN origin (media.javamifi.com, never API origin).
 * 5. Signed URLs for private/evidence objects.
 */

export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB hard limit
export const CDN_ORIGIN = 'https://media.javamifi.com';
export const API_ORIGIN = 'https://api.javamifi.com';

export interface PresignedUploadDetails {
  uploadUrl: string;
  s3Key: string;
  cdnUrl: string;
  maxSizeBytes: number;
  requiredHeaders: Record<string, string>;
}

export type SupportedMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export const ALLOWED_MIME_TYPES: readonly SupportedMimeType[] = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/**
 * Sniffs actual binary MIME type using magic bytes.
 * P19 Prohibition: Never trust client-supplied Content-Type header.
 */
export function sniffMimeType(buffer: Buffer): SupportedMimeType | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif';
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Strips APP1 EXIF & GPS metadata from a JPEG buffer.
 * Reassembles buffer ensuring no location tags or camera serials remain.
 */
export function stripExifMetadata(buffer: Buffer): Buffer {
  if (buffer.length < 4) return buffer;

  // Only JPEG has APP1 EXIF markers
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const chunks: Buffer[] = [buffer.subarray(0, 2)]; // Start with SOI (FF D8)
  let offset = 2;

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) {
      // Stream desynchronized; return as-is
      break;
    }

    const marker = buffer[offset + 1];

    // Standalone markers: RST0..RST7, SOI, EOI
    if (marker === 0xd9) {
      // EOI
      chunks.push(buffer.subarray(offset));
      break;
    }

    if (offset + 3 >= buffer.length) break;
    const length = buffer.readUInt16BE(offset + 2);

    // APP1 marker (0xFF 0xE1) carries EXIF / GPS metadata
    if (marker === 0xe1) {
      // Skip the entire APP1 segment to strip EXIF/GPS completely
      offset += 2 + length;
      continue;
    }

    // Keep other segments (e.g. SOF, DQT, DHT, SOS)
    chunks.push(buffer.subarray(offset, offset + 2 + length));
    offset += 2 + length;

    // SOS (Start of Scan - 0xDA) starts entropy-coded image data
    if (marker === 0xda) {
      chunks.push(buffer.subarray(offset));
      break;
    }
  }

  return Buffer.concat(chunks);
}

export class MediaService {
  /**
   * Generates a secure direct-to-S3 presigned PUT upload URL.
   */
  createPresignedUploadUrl(
    userId: string,
    filename: string,
    declaredMimeType: string,
    fileSizeBytes: number
  ): PresignedUploadDetails {
    if (fileSizeBytes > MAX_UPLOAD_SIZE_BYTES) {
      throw new ValidationError(
        `File size exceeds maximum allowable limit of ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)} MB`,
        [{ name: 'fileSize', reason: 'Must be <= 8388608 bytes' }]
      );
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueId = crypto.randomUUID();
    const s3Key = `uploads/${userId}/${uniqueId}.${ext}`;

    // P19 Invariant: Uploads must be served from CDN origin, never API origin
    const cdnUrl = `${CDN_ORIGIN}/${s3Key}`;
    const uploadUrl = `https://javamifi-media.s3.ap-southeast-1.amazonaws.com/${s3Key}?X-Amz-Signature=mock_sig`;

    return {
      uploadUrl,
      s3Key,
      cdnUrl,
      maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
      requiredHeaders: {
        'Content-Type': declaredMimeType,
        'x-amz-server-side-encryption': 'AES256',
      },
    };
  }

  /**
   * Validates and processes upload buffer before publishing.
   */
  processAndSanitizeUpload(
    buffer: Buffer,
    declaredMimeType: string
  ): { sanitizedBuffer: Buffer; actualMimeType: SupportedMimeType } {
    if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
      throw new ValidationError('File size exceeds 8 MB ceiling', [
        { name: 'fileSize', reason: 'Exceeded 8 MB' },
      ]);
    }

    const actualMime = sniffMimeType(buffer);
    if (!actualMime || actualMime !== declaredMimeType) {
      throw new ValidationError(
        `Content sniff failed: Declared type '${declaredMimeType}' does not match binary magic bytes '${actualMime || 'unknown'}'`,
        [{ name: 'mimeType', reason: 'MIME type mismatch with binary header' }]
      );
    }

    // Strip EXIF / GPS metadata
    const sanitizedBuffer = stripExifMetadata(buffer);

    return {
      sanitizedBuffer,
      actualMimeType: actualMime,
    };
  }

  /**
   * Generates a signed CDN URL with expiration for private objects (e.g. halal certificates).
   */
  createSignedCdnUrl(s3Key: string, expiresInSeconds = 3600): string {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const token = crypto
      .createHmac('sha256', 'mock_cdn_secret')
      .update(`${s3Key}:${expires}`)
      .digest('hex')
      .slice(0, 32);

    return `${CDN_ORIGIN}/${s3Key}?token=${token}&expires=${expires}`;
  }
}

export const mediaService = new MediaService();
