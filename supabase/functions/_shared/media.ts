export type MediaKind = 'image' | 'audio';

type DownloadClient = {
  storage: {
    from: (bucket: string) => {
      download: (path: string) => Promise<{
        data: Blob | null;
        error: { message: string } | null;
      }>;
    };
  };
};

const startsWithBytes = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value);

const hasFtypBrand = (bytes: Uint8Array, brands: string[]) => {
  if (!startsWithBytes(bytes, [0x66, 0x74, 0x79, 0x70], 4)) return false;
  const brand = String.fromCharCode(...bytes.slice(8, 12));
  return brands.includes(brand) || brand.startsWith('mp4');
};

export function hasValidMediaMagicBytes(
  bytes: Uint8Array,
  kind: MediaKind,
  mimeType?: string,
) {
  if (kind === 'image') {
    if (mimeType === 'image/jpeg') return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
    if (mimeType === 'image/png') return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (mimeType === 'image/webp') {
      return startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWithBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8);
    }
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      return startsWithBytes(bytes, [0x66, 0x74, 0x79, 0x70], 4) &&
        ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(String.fromCharCode(...bytes.slice(8, 12)));
    }
    return startsWithBytes(bytes, [0xff, 0xd8, 0xff]) ||
      startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ||
      (startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWithBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)) ||
      startsWithBytes(bytes, [0x66, 0x74, 0x79, 0x70], 4);
  }

  if (mimeType === 'audio/wav') {
    return startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      startsWithBytes(bytes, [0x57, 0x41, 0x56, 0x45], 8);
  }
  if (mimeType === 'audio/ogg') return startsWithBytes(bytes, [0x4f, 0x67, 0x67, 0x53]);
  if (mimeType === 'audio/webm') return startsWithBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
  if (mimeType === 'audio/aac') {
    return bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0;
  }
  if (mimeType === 'audio/mpeg') {
    return startsWithBytes(bytes, [0x49, 0x44, 0x33]) ||
      (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  }
  if (mimeType === 'audio/mp4' || mimeType === 'audio/m4a') {
    return hasFtypBrand(bytes, ['isom', 'iso2', 'mp41', 'mp42', 'M4A ', 'M4B ', 'M4P ']);
  }
  return startsWithBytes(bytes, [0x49, 0x44, 0x33]) ||
    startsWithBytes(bytes, [0x4f, 0x67, 0x67, 0x53]) ||
    startsWithBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3]) ||
    hasFtypBrand(bytes, ['isom', 'iso2', 'mp41', 'mp42', 'M4A ', 'M4B ', 'M4P ']) ||
    (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
}

export async function validateUploadedMedia(
  client: DownloadClient,
  path: string,
  kind: MediaKind,
  mimeType?: string,
) {
  const { data, error } = await client.storage.from('event-media-private').download(path);
  if (error || !data) {
    return { valid: false as const, code: 'MEDIA_OBJECT_MISSING' as const };
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  if (!hasValidMediaMagicBytes(bytes, kind, mimeType)) {
    return { valid: false as const, code: 'MEDIA_MAGIC_MISMATCH' as const };
  }

  return { valid: true as const };
}
