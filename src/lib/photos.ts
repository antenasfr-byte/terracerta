import { supabase, PHOTO_BUCKET } from './supabase';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function validateImage(dataUrl: string): { ok: boolean; error?: string } {
  if (!dataUrl) return { ok: false, error: 'Nenhuma imagem fornecida.' };

  const mimeMatch = dataUrl.match(/^data:(image\/[a-z+.-]+);base64,/i);
  const mime = mimeMatch?.[1]?.toLowerCase() ?? '';

  if (mime && !ALLOWED_MIME.includes(mime)) {
    return { ok: false, error: `Formato não permitido. Use JPEG, PNG, WEBP ou HEIC.` };
  }

  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const sizeBytes = Math.floor(base64.length * 0.75);
  if (sizeBytes > MAX_SIZE_BYTES) {
    return { ok: false, error: `A imagem é demasiado grande (máximo 10 MB).` };
  }

  return { ok: true };
}

/**
 * Compress and resize an image client-side before upload.
 * Strips EXIF metadata by redrawing onto a fresh canvas.
 * Targets max 1024px on the longest edge, JPEG quality 0.82.
 */
export async function compressImage(dataUrl: string): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const MAX_DIM = 1024;
  let { width, height } = img;
  if (width > MAX_DIM || height > MAX_DIM) {
    if (width >= height) {
      height = Math.round((height / width) * MAX_DIM);
      width = MAX_DIM;
    } else {
      width = Math.round((width / height) * MAX_DIM);
      height = MAX_DIM;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  // toDataURL('image/jpeg') strips EXIF — the canvas has no metadata
  return canvas.toDataURL('image/jpeg', 0.82);
}

function detectExtension(dataUrl: string): string {
  const mimeMatch = dataUrl.match(/^data:(image\/[a-z+.-]+);base64,/i);
  const mime = mimeMatch?.[1]?.toLowerCase() ?? '';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic') return 'heic';
  if (mime === 'image/heif') return 'heif';
  return 'jpg';
}

function detectContentType(dataUrl: string): string {
  const mimeMatch = dataUrl.match(/^data:(image\/[a-z+.-]+);base64,/i);
  const mime = mimeMatch?.[1]?.toLowerCase() ?? '';
  if (ALLOWED_MIME.includes(mime)) return mime;
  return 'image/jpeg';
}

export async function uploadPhoto(
  userId: string,
  base64Data: string,
  relatedType: 'diagnosis' | 'soil' | 'sun' | 'compare' | 'journal' | 'general' = 'general',
): Promise<{ path: string; photoId: string | null } | null> {
  const validation = validateImage(base64Data);
  if (!validation.ok) return null;

  const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const ext = detectExtension(base64Data);
  const contentType = detectContentType(base64Data);
  const blob = new Blob([arr], { type: contentType });

  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(fileName, blob, { contentType });

  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }

  const { data: photoRow } = await supabase.from('photos').insert({
    storage_path: fileName,
    public_url: '',
    related_type: relatedType,
  }).select('id').single();

  return { path: fileName, photoId: photoRow?.id ?? null };
}

export async function getSignedPhotoUrl(storagePath: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
