/**
 * Image Preloader Utility
 * Optimizes image loading for fast display on single property pages
 * 
 * Usage:
 * imagePreloader.preloadMainImage(url); // Load main image immediately
 * imagePreloader.preloadImages(urls, [0, 1]); // Preload specific indices
 */

export const imagePreloader = {
  /**
   * Preload a single image with high priority
   * Use this for the main property image
   */
  preloadMainImage: (url: string): void => {
    if (!url || typeof document === 'undefined') return;

    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.type = 'image/webp'; // Modern format
      document.head.appendChild(link);

      // Also create a fallback for JPEG
      const linkFallback = document.createElement('link');
      linkFallback.rel = 'preload';
      linkFallback.as = 'image';
      linkFallback.href = url;
      linkFallback.type = 'image/jpeg';
      document.head.appendChild(linkFallback);

      console.log('[ImagePreloader] Preloading main image:', url);
    } catch (error) {
      console.warn('[ImagePreloader] Failed to preload image:', error);
    }
  },

  /**
   * Preload multiple images with priority indices
   * @param urls - Array of image URLs
   * @param priorityIndices - Array of indices to prioritize (e.g., [0, 1])
   */
  preloadImages: (urls: string[], priorityIndices: number[] = []): void => {
    if (!Array.isArray(urls) || urls.length === 0) return;

    urls.forEach((url, index) => {
      if (!url) return;

      if (priorityIndices.includes(index)) {
        // High priority - preload immediately
        imagePreloader.preloadMainImage(url);
      } else {
        // Lower priority - just create link without preload
        try {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'image';
          link.href = url;
          document.head.appendChild(link);
        } catch (error) {
          console.warn('[ImagePreloader] Failed to prefetch image:', error);
        }
      }
    });
  },

  /**
   * Warm up cache by silently loading an image
   * Useful for preloading without showing on page
   */
  warmCache: (url: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!url) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        console.log('[ImagePreloader] Cached:', url);
        resolve();
      };
      img.onerror = () => {
        console.warn('[ImagePreloader] Failed to cache:', url);
        resolve(); // Resolve anyway to not block
      };
      img.src = url;
    });
  },

  /**
   * Preload images sequentially (good for many images)
   * Prevents network saturation
   */
  preloadSequential: async (urls: string[], delayMs: number = 200): Promise<void> => {
    for (const url of urls) {
      if (url) {
        await imagePreloader.warmCache(url);
        // Wait between loads to not overwhelm network
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  },

  /**
   * Get estimated load time based on URL characteristics
   */
  getEstimatedLoadTime: (url: string): 'instant' | 'fast' | 'slow' => {
    if (!url) return 'instant';

    // CDN URLs typically load faster
    if (url.includes('cloudfront') || url.includes('cdn')) {
      return 'instant';
    }

    // Local S3 regions are fast
    if (url.includes('s3.eu-north-1') || url.includes('s3.eu-west-1')) {
      return 'fast';
    }

    // Default assumption
    return 'fast';
  },
};

export default imagePreloader;
