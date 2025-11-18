import type { ImageLoaderProps } from "next/image"

/**
 * Custom image loader for optimizing images from various sources
 * Particularly optimized for AWS S3 images
 */
export function optimizedImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // If it's an AWS S3 URL, append query parameters for optimization
  if (src.includes('amazonaws.com')) {
    // AWS S3 URLs with query parameters for image optimization
    const separator = src.includes('?') ? '&' : '?'
    
    // Use AWS CloudFront-compatible parameters
    // w = width (for responsive sizing)
    // q = quality (0-100)
    const optimizedUrl = `${src}${separator}w=${width}&q=${quality || 60}`
    
    return optimizedUrl
  }
  
  // For other image sources, return as-is
  // The browser and Next.js will handle optimization
  return src
}

/**
 * Generate responsive image sizes string for property cards
 * Optimized for mobile-first design
 */
export const PROPERTY_CARD_SIZES = "(max-width: 320px) 320px, (max-width: 420px) 400px, (max-width: 640px) 500px, (max-width: 768px) 550px, 650px"

/**
 * Generate responsive image sizes string for full-width images
 * (e.g., property detail pages, hero images)
 */
export const FULL_WIDTH_IMAGE_SIZES = "(max-width: 640px) 640px, (max-width: 1024px) 900px, (max-width: 1280px) 1100px, 1280px"

/**
 * Generate responsive image sizes string for thumbnails
 */
export const THUMBNAIL_SIZES = "(max-width: 320px) 100px, (max-width: 768px) 150px, 200px"

/**
 * Recommended quality settings for different use cases
 */
export const IMAGE_QUALITY = {
  thumbnail: 50,    // Small thumbnails can be lower quality
  card: 60,         // Property cards
  detail: 75,       // Detail pages
  hero: 80,         // Hero/banner images (prominent)
} as const

/**
 * Check if an image URL is from AWS S3
 */
export function isAwsS3Image(src: string): boolean {
  return src.includes('amazonaws.com')
}

/**
 * Extracts the original bucket and key from an AWS S3 URL
 */
export function parseAwsS3Url(src: string): { bucket?: string; key?: string } | null {
  if (!isAwsS3Image(src)) return null
  
  // Handle different S3 URL formats:
  // 1. Virtual-hosted-style: https://bucket-name.s3.region.amazonaws.com/key
  // 2. Path-style: https://s3.region.amazonaws.com/bucket-name/key
  // 3. CloudFront: https://distribution-id.cloudfront.net/key
  
  const virtualHostedMatch = src.match(/https:\/\/([^.]+)\.s3[.-]([^.]+)?\.amazonaws\.com\/(.+)/)
  if (virtualHostedMatch) {
    return {
      bucket: virtualHostedMatch[1],
      key: virtualHostedMatch[3],
    }
  }
  
  const pathStyleMatch = src.match(/https:\/\/s3[.-]([^.]+)?\.amazonaws\.com\/([^/]+)\/(.+)/)
  if (pathStyleMatch) {
    return {
      bucket: pathStyleMatch[2],
      key: pathStyleMatch[3],
    }
  }
  
  return null
}
