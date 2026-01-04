// Image validation utilities for multimodal support

export const SUPPORTED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB in bytes

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageMetadata {
  mimeType: string;
  size: number;
  base64Data: string;
}

/**
 * Validate image MIME type
 */
export function isValidImageType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_FORMATS.includes(mimeType as any);
}

/**
 * Validate image size
 */
export function isValidImageSize(sizeInBytes: number): boolean {
  return sizeInBytes > 0 && sizeInBytes <= MAX_IMAGE_SIZE;
}

/**
 * Extract metadata from base64 data URL
 * Format: data:image/png;base64,iVBORw0KGgoAAAANS...
 */
export function parseBase64Image(dataUrl: string): ImageMetadata | null {
  try {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return null;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Calculate size from base64 string
    // Base64 encoding increases size by ~33%, so we calculate original size
    const size = Math.floor((base64Data.length * 3) / 4);

    return {
      mimeType,
      size,
      base64Data,
    };
  } catch (error) {
    console.error("Error parsing base64 image:", error);
    return null;
  }
}

/**
 * Comprehensive image validation
 */
export function validateImage(dataUrl: string): ImageValidationResult {
  const metadata = parseBase64Image(dataUrl);

  if (!metadata) {
    return {
      valid: false,
      error: "Invalid image format. Must be a valid base64 data URL.",
    };
  }

  if (!isValidImageType(metadata.mimeType)) {
    return {
      valid: false,
      error: `Unsupported image format. Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(", ")}`,
    };
  }

  if (!isValidImageSize(metadata.size)) {
    return {
      valid: false,
      error: `Image size exceeds the maximum limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validate file from browser File API
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!isValidImageType(file.type)) {
    return {
      valid: false,
      error: `Unsupported image format. Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(", ")}`,
    };
  }

  if (!isValidImageSize(file.size)) {
    return {
      valid: false,
      error: `Image size exceeds the maximum limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Convert File to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
