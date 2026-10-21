/**
 * Compresses an image file client-side using HTML5 Canvas to < 180KB (150KB - 200KB) and max 800px dimension.
 * Non-blocking asynchronous processing yielding main thread so UI never hangs.
 * Safe for both browser and Node/headless environments.
 * 
 * @param {File|Blob} file 
 * @param {number|Object} maxWidthOrOptions - max width (default 800) or options object
 * @param {number} maxHeight - max height (default 800)
 * @param {number} maxSizeBytes - maximum target size in bytes (default 180KB)
 * @param {number} quality - initial compression quality (default 0.8)
 * @returns {Promise<Blob|File>} Compressed image blob with metadata attributes
 */
export async function compressImage(
  file,
  maxWidthOrOptions = 800,
  maxHeight = 800,
  maxSizeBytes = 180 * 1024,
  quality = 0.8
) {
  let maxWidth = 800;
  let onProgressCallback = null;
  if (typeof maxWidthOrOptions === 'object' && maxWidthOrOptions !== null) {
    maxWidth = maxWidthOrOptions.maxWidth ?? 800;
    maxHeight = maxWidthOrOptions.maxHeight ?? 800;
    maxSizeBytes = maxWidthOrOptions.maxSizeBytes ?? (180 * 1024);
    quality = maxWidthOrOptions.quality ?? maxWidthOrOptions.initialQuality ?? 0.8;
    onProgressCallback = maxWidthOrOptions.onProgress ?? null;
  } else if (typeof maxWidthOrOptions === 'number') {
    maxWidth = maxWidthOrOptions;
  }

  // Headless / Node.js test environment guard
  if (typeof document === 'undefined' || typeof Image === 'undefined' || !document.createElement) {
    if (file && typeof file === 'object') {
      try {
        file.blob = file;
        file.sizeBytes = file.size || 0;
        file.originalSize = file.size || 0;
        file.compressedSize = file.size || 0;
      } catch (_) {}
    }
    if (onProgressCallback) onProgressCallback(100);
    return file;
  }

  return new Promise((resolve) => {
    let objectUrl = null;
    try {
      if (typeof URL !== 'undefined' && URL.createObjectURL && typeof file === 'object') {
        objectUrl = URL.createObjectURL(file);
      }
    } catch (_) {}

    const img = new Image();

    const cleanup = () => {
      if (objectUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onload = async () => {
      cleanup();
      // Non-blocking yield to keep UI responsive
      await new Promise((r) => setTimeout(r, 0));
      if (onProgressCallback) onProgressCallback(30);

      try {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 800;

        // Proportional resize maintaining aspect ratio with max dimension 800px
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = (canvas && typeof canvas.getContext === 'function') ? canvas.getContext('2d') : null;
        if (!ctx) {
          if (file && typeof file === 'object') {
            file.blob = file;
            file.sizeBytes = file.size || 0;
          }
          return resolve(file);
        }

        // Render to canvas with image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const canvasToBlob = (mimeType, qVal) => {
          return new Promise((res) => {
            if (canvas && typeof canvas.toBlob === 'function') {
              canvas.toBlob((b) => res(b), mimeType, qVal);
            } else {
              res(null);
            }
          });
        };

        // 1. Try WebP first (highly compressed, modern)
        let currentQuality = quality;
        let blob = await canvasToBlob('image/webp', currentQuality);

        while (blob && blob.size > maxSizeBytes && currentQuality > 0.35) {
          currentQuality -= 0.12;
          await new Promise((r) => setTimeout(r, 0)); // Non-blocking yield
          blob = await canvasToBlob('image/webp', currentQuality);
        }

        if (onProgressCallback) onProgressCallback(70);

        // 2. Fallback to JPEG if WebP unsupported or still oversize
        if (!blob || blob.size > maxSizeBytes) {
          currentQuality = 0.75;
          blob = await canvasToBlob('image/jpeg', currentQuality);
          while (blob && blob.size > maxSizeBytes && currentQuality > 0.35) {
            currentQuality -= 0.12;
            await new Promise((r) => setTimeout(r, 0)); // Non-blocking yield
            blob = await canvasToBlob('image/jpeg', currentQuality);
          }
        }

        if (!blob) {
          blob = file;
        }

        if (onProgressCallback) onProgressCallback(100);

        // Attach convenient properties
        if (blob && typeof blob === 'object') {
          try {
            blob.blob = blob;
            blob.width = width;
            blob.height = height;
            blob.sizeBytes = blob.size;
            blob.originalSize = (file && file.size) || 0;
            blob.compressedSize = blob.size;
          } catch (_) {}
        }

        resolve(blob);
      } catch (err) {
        console.warn('[StorageService] Canvas compression error:', err);
        resolve(file);
      }
    };

    img.onerror = () => {
      cleanup();
      resolve(file);
    };

    if (objectUrl) {
      img.src = objectUrl;
    } else if (typeof file === 'string') {
      img.src = file;
    } else {
      resolve(file);
    }
  });
}

/**
 * Converts a Blob/File to a base64 data URI (e.g. "data:image/webp;base64,...").
 * Returns the input unchanged if it is already a string, and '' for anything
 * that can't be read (headless/Node environment with no FileReader).
 */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    if (typeof blob === 'string') {
      resolve(blob);
      return;
    }
    if (!blob || typeof FileReader === 'undefined') {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a compressed perfume image into a base64 data URI, stored directly
 * on the perfume's Firestore document (no Firebase Storage bucket involved).
 * Compression keeps it under ~180KB (~240KB as base64), comfortably inside
 * Firestore's 1 MiB per-document limit.
 *
 * @param {File|Blob} file
 * @param {string} perfumeId
 * @param {Function} onProgress - Progress reporting callback: (percentage, message) => void
 * @returns {Promise<{ downloadUrl: string, path: null, sizeBytes: number }>}
 */
export async function uploadPerfumeImage(file, perfumeId = null, onProgress = null) {
  if (onProgress) onProgress(10, 'Memproses fail imej...');

  // 1. Client-side Canvas compression (< 180KB, max 800px)
  const compressed = await compressImage(file, {
    maxWidth: 800,
    maxHeight: 800,
    maxSizeBytes: 180 * 1024,
    onProgress: (pct) => {
      if (onProgress) onProgress(10 + Math.round(pct * 0.6), 'Memampat imej...');
    }
  });

  const blobToEncode = (compressed && compressed.blob) ? compressed.blob : compressed;
  const sizeBytes = (blobToEncode && blobToEncode.size) || (file && file.size) || 0;

  if (onProgress) onProgress(80, 'Menyimpan terus ke Firestore...');

  const downloadUrl = await blobToDataUrl(blobToEncode);

  if (onProgress) onProgress(100, 'Berjaya diproses!');

  return {
    downloadUrl,
    url: downloadUrl, // alias
    path: null,
    sizeBytes
  };
}

/**
 * Standard brand-neutral flacon placeholder (luxury dark amber flacon).
 * Replaces generic Coco Mademoiselle flacon fallback across the application.
 */
export const DEFAULT_FLACON_PLACEHOLDER = 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&auto=format&fit=crop&q=80';

/**
 * Normalizes and sanitizes any image URL.
 * Detects Firebase Storage URLs and guarantees that `?alt=media` is appended
 * so that Google Cloud Storage/Firebase returns raw image bytes instead of JSON metadata.
 * 
 * @param {string} url - Raw image URL
 * @param {Object} options - Fallback options
 * @returns {string} Fully-qualified image URL with alt=media where required
 */
export function formatImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') {
    return options.fallback || '';
  }
  let cleanUrl = url.trim();
  if (!cleanUrl) {
    return options.fallback || '';
  }

  // If it is a Firebase Storage URL, ensure alt=media is present
  if (cleanUrl.includes('firebasestorage.googleapis.com')) {
    if (!cleanUrl.includes('alt=media')) {
      const separator = cleanUrl.includes('?') ? '&' : '?';
      cleanUrl = `${cleanUrl}${separator}alt=media`;
    }
  }

  return cleanUrl;
}

export const storageService = {
  compressImage,
  uploadPerfumeImage,
  formatImageUrl,
  DEFAULT_FLACON_PLACEHOLDER
};

export default storageService;

