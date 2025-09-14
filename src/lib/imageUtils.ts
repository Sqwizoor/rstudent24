// Utility functions for image handling and compression

/**
 * Compresses an image file by resizing and reducing quality
 * @param file - The original image file
 * @param maxWidth - Maximum width for the compressed image
 * @param maxHeight - Maximum height for the compressed image
 * @param quality - JPEG quality (0.1 to 1.0)
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validates and optionally compresses image files
 * @param files - Array of files to process
 * @param maxSizePerFile - Maximum size per file in bytes (default: 2MB)
 * @param maxTotalSize - Maximum total size in bytes (default: 10MB)
 * @returns Promise<File[]> - Array of processed files
 */
export async function processImageFiles(
  files: File[],
  maxSizePerFile: number = 2 * 1024 * 1024, // 2MB
  maxTotalSize: number = 10 * 1024 * 1024 // 10MB
): Promise<File[]> {
  const processedFiles: File[] = [];
  let totalSize = 0;

  for (const file of files) {
    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      throw new Error(`File ${file.name} is not an image`);
    }

    let processedFile = file;

    // If file is too large, try to compress it
    if (file.size > maxSizePerFile) {
      console.log(`Compressing ${file.name} (${Math.round(file.size / 1024 / 1024 * 100) / 100}MB)`);
      
      try {
        processedFile = await compressImage(file, 1200, 800, 0.7);
        console.log(`Compressed to ${Math.round(processedFile.size / 1024 / 1024 * 100) / 100}MB`);
        
        // If still too large after compression, try more aggressive compression
        if (processedFile.size > maxSizePerFile) {
          processedFile = await compressImage(file, 800, 600, 0.5);
          console.log(`Further compressed to ${Math.round(processedFile.size / 1024 / 1024 * 100) / 100}MB`);
        }
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
        throw new Error(`Failed to compress ${file.name}. Please use a smaller image.`);
      }
    }

    // Final size check
    if (processedFile.size > maxSizePerFile) {
      throw new Error(`Image ${file.name} is too large even after compression. Maximum size is ${Math.round(maxSizePerFile / 1024 / 1024)}MB`);
    }

    // Check total size
    if (totalSize + processedFile.size > maxTotalSize) {
      throw new Error(`Total image size would exceed ${Math.round(maxTotalSize / 1024 / 1024)}MB limit`);
    }

    processedFiles.push(processedFile);
    totalSize += processedFile.size;
  }

  return processedFiles;
}

/**
 * Gets the size of files in a human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
