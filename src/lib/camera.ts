import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export type CaptureMode = 'camera' | 'gallery';

export interface CaptureResult {
  dataUrl: string;
  source: 'camera' | 'gallery';
}

/**
 * Capture a photo using the native Capacitor Camera plugin on mobile,
 * or fall back to an HTML <input type="file"> on the web.
 *
 * On native (Android/iOS), Camera.getPhoto() shows the system camera or
 * photo picker — no custom permission dialogs are needed; the OS handles it.
 */
export async function capturePhoto(mode: CaptureMode): Promise<CaptureResult | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: mode === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        correctOrientation: true,
        saveToGallery: false,
      });

      const format = photo.format ?? 'jpeg';
      return {
        dataUrl: `data:image/${format};base64,${photo.base64String}`,
        source: mode,
      };
    } catch {
      return null;
    }
  }

  return captureViaFileInput(mode);
}

function captureViaFileInput(mode: CaptureMode): Promise<CaptureResult | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (mode === 'camera') input.capture = 'environment';
    input.style.display = 'none';

    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({ dataUrl, source: mode });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(f);
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}

/**
 * Check whether the user has granted camera permissions on a native platform.
 * On web, always returns 'granted' (the browser handles permissions per-capture).
 */
export async function checkCameraPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!Capacitor.isNativePlatform()) return 'granted';
  try {
    const { camera, photos } = await Camera.checkPermissions();
    return camera === 'granted' || photos === 'granted' ? 'granted'
      : camera === 'denied' || photos === 'denied' ? 'denied'
      : 'prompt';
  } catch {
    return 'prompt';
  }
}

export async function requestCameraPermission(): Promise<'granted' | 'denied'> {
  if (!Capacitor.isNativePlatform()) return 'granted';
  try {
    const { camera } = await Camera.requestPermissions();
    return camera === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
