/**
 * Custom hook for intelligent image caching
 * Reduces repeated downloads and improves performance on return visits
 * 
 * Usage:
 * const { cachedUrl, isFromCache, cacheHit } = useImageCache(imageUrl);
 */

import { useEffect, useState } from 'react';

interface UseImageCacheResult {
  cachedUrl: string | undefined;
  isFromCache: boolean;
  cacheHit: boolean;
  cacheStats: {
    size: number;
    timestamp: number;
  } | null;
}

const CACHE_PREFIX = 'img_cache_';
const CACHE_METADATA_PREFIX = 'img_meta_';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max cache

export const useImageCache = (imageUrl: string | undefined): UseImageCacheResult => {
  const [cachedUrl, setCachedUrl] = useState<string | undefined>(imageUrl);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheStats, setCacheStats] = useState<{ size: number; timestamp: number } | null>(null);

  useEffect(() => {
    if (!imageUrl || typeof window === 'undefined') {
      setCachedUrl(imageUrl);
      setIsFromCache(false);
      return;
    }

    const cacheKey = CACHE_PREFIX + btoa(imageUrl).substring(0, 30);
    const metaKey = CACHE_METADATA_PREFIX + btoa(imageUrl).substring(0, 30);

    try {
      // Check if image is in localStorage cache
      const cached = localStorage.getItem(cacheKey);
      const metadata = localStorage.getItem(metaKey);

      if (cached && metadata) {
        const meta = JSON.parse(metadata);
        setCachedUrl(cached);
        setIsFromCache(true);
        setCacheStats(meta);
        console.log('[ImageCache] HIT:', imageUrl.substring(0, 50));
        return;
      }

      // Image not in cache - download and cache it
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Store URL in cache
          const metadata = {
            size: imageUrl.length,
            timestamp: Date.now(),
          };
          localStorage.setItem(cacheKey, imageUrl);
          localStorage.setItem(metaKey, JSON.stringify(metadata));

          setCachedUrl(imageUrl);
          setIsFromCache(false);
          setCacheStats(metadata);

          // Cleanup old cache if needed
          cleanupOldCache();

          console.log('[ImageCache] CACHED:', imageUrl.substring(0, 50));
        } catch (error) {
          console.warn('[ImageCache] Failed to cache:', error);
          setCachedUrl(imageUrl);
        }
      };

      img.onerror = () => {
        console.warn('[ImageCache] Failed to load:', imageUrl.substring(0, 50));
        setCachedUrl(imageUrl);
      };

      img.src = imageUrl;
    } catch (error) {
      console.warn('[ImageCache] Error:', error);
      setCachedUrl(imageUrl);
    }

    return () => {
      // Cleanup if needed
    };
  }, [imageUrl]);

  return {
    cachedUrl: cachedUrl || imageUrl,
    isFromCache,
    cacheHit: isFromCache,
    cacheStats,
  };
};

/**
 * Clean up old cache entries if storage is getting too full
 */
function cleanupOldCache(): void {
  try {
    if (typeof window === 'undefined') return;

    let totalSize = 0;
    const entries: Array<{ key: string; timestamp: number }> = [];

    // Calculate total cache size and collect entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith(CACHE_PREFIX)) {
        const value = localStorage.getItem(key) || '';
        totalSize += value.length;

        const metaKey = key.replace(CACHE_PREFIX, CACHE_METADATA_PREFIX);
        const metadata = localStorage.getItem(metaKey);
        if (metadata) {
          try {
            const meta = JSON.parse(metadata);
            entries.push({ key, timestamp: meta.timestamp || 0 });
          } catch {
            entries.push({ key, timestamp: 0 });
          }
        }
      }
    }

    // If over limit, remove oldest entries
    if (totalSize > MAX_CACHE_SIZE) {
      console.log('[ImageCache] Cache size exceeded, cleaning up...');

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 25% of entries
      const toRemove = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        const key = entries[i].key;
        const metaKey = key.replace(CACHE_PREFIX, CACHE_METADATA_PREFIX);
        localStorage.removeItem(key);
        localStorage.removeItem(metaKey);
      }

      console.log(`[ImageCache] Removed ${toRemove} old entries`);
    }
  } catch (error) {
    console.warn('[ImageCache] Cleanup error:', error);
  }
}

/**
 * Hook to get cache statistics
 * Useful for debugging and monitoring
 */
export const useImageCacheStats = () => {
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalSize: 0,
    oldestEntry: 0,
    newestEntry: 0,
  });

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      let totalSize = 0;
      let totalEntries = 0;
      let oldestEntry = Date.now();
      let newestEntry = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(CACHE_PREFIX)) continue;

        totalEntries++;
        const value = localStorage.getItem(key) || '';
        totalSize += value.length;

        const metaKey = key.replace(CACHE_PREFIX, CACHE_METADATA_PREFIX);
        const metadata = localStorage.getItem(metaKey);
        if (metadata) {
          try {
            const meta = JSON.parse(metadata);
            oldestEntry = Math.min(oldestEntry, meta.timestamp || 0);
            newestEntry = Math.max(newestEntry, meta.timestamp || 0);
          } catch {
            // Skip
          }
        }
      }

      setStats({
        totalEntries,
        totalSize,
        oldestEntry,
        newestEntry,
      });
    } catch (error) {
      console.warn('[ImageCache] Stats error:', error);
    }
  }, []);

  return stats;
};

/**
 * Clear all image cache
 */
export const clearImageCache = (): void => {
  try {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX) || key?.startsWith(CACHE_METADATA_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[ImageCache] Cleared ${keysToRemove.length} cache entries`);
  } catch (error) {
    console.warn('[ImageCache] Clear error:', error);
  }
};

export default useImageCache;
