/**
 * Critical Resource Preloading
 * Improves LCP (Largest Contentful Paint) by preloading essential resources
 */

export function PreloadScripts() {
  return (
    <>
      {/* Note: Fonts are handled by Next.js Google Fonts optimization */}

      {/* ✨ Preload hero image - handled by next/image priority */ }

      {/* ✨ Preload logo image - use WebP for modern browsers, 84% smaller! */}
      <link
        rel="preload"
        href="/student24-logo.webp"
        as="image"
        type="image/webp"
        fetchPriority="high"
      />
      <link
        rel="preload"
        href="/student24-logo-optimized.png"
        as="image"
        fetchPriority="high"
      />

      {/* ✨ DNS Prefetch for external services */}
      <link rel="dns-prefetch" href="https://api.mapbox.com" />
      <link rel="dns-prefetch" href="https://images.unsplash.com" />
      <link rel="dns-prefetch" href="https://s3.amazonaws.com" />

      {/* ✨ Preconnect to critical third-party origins */}
      <link
        rel="preconnect"
        href="https://s3.amazonaws.com"
        crossOrigin="anonymous"
      />
      <link
        rel="preconnect"
        href="https://api.mapbox.com"
      />

      {/* ✨ Prefetch next page (common in search flows) */}
      <link rel="prefetch" href="/search" />
    </>
  );
}
