/**
 * Optimizes an image (from webcam canvas or file upload) for high-speed OCR.
 * Resizes max dimension to 1280px and compresses to quality JPEG (0.80),
 * reducing payloads from 5-15MB down to ~150-250KB while preserving pristine
 * text and bubble clarity for OCR.
 */
export async function optimizeImageForOCR(
  sourceDataUrl: string,
  maxDimension = 1280,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions preserving aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(sourceDataUrl);
        return;
      }

      // Draw with smooth high-quality interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as compact JPEG
      const optimizedUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(optimizedUrl);
    };

    img.onerror = () => {
      resolve(sourceDataUrl);
    };

    img.src = sourceDataUrl;
  });
}
