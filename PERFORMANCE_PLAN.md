# Performance Optimization Plan

This document outlines a strategy to improve the performance and reduce the compute usage of the Student24 application.

## 1. Image Optimization Strategies
**Goal**: Reduce bandwidth and CPU usage for image processing.

### Current State
- `next.config.js` is configured with `avif` and `webp` formats and long cache TTL.
- `PreloadScripts` aggressively preloads `houses.jpg` and logos.

### Recommendations
- **Audit Preloading**: Ensure `houses.jpg` is actually the LCP (Largest Contentful Paint) element on the Landing page. If it's below the fold on mobile, preloading it hurts initial load.
- **Lazy Loading**: Ensure all images "below the fold" use `loading="lazy"` (default in `next/image`, but explicit checks help).
- **Size Attributes**: Strict adherence to `sizes` prop in `next/image` to prevent generating unnecessarily large variants.

## 2. Server-Side Processing & API Routes
**Goal**: Reduce memory spikes and CPU cycles on the server.

### Current State
- **Photo Uploads**: `src/app/api/properties/[id]/photos/route.ts` reads the entire file into a Buffer (`await photoFile.arrayBuffer()`) before uploading. For a 15MB file, this consumes significant RAM per request.

### Recommendations
- **Stream Uploads**: Refactor S3 uploads to stream data directly from the request to S3 without buffering the entire file in memory. This is critical for scaling file uploads.
- **Edge Runtime**: Consider moving lightweight API routes to the Edge Runtime where possible (though S3 uploads usually require Node.js runtime).

## 3. Database & Data Fetching
**Goal**: Reduce database load and wait times.

### Current State
- `RandomListings` on the landing page implies a database query on every page load.

### Recommendations
- **Caching**: Implement `unstable_cache` or `fetch` caching (revalidate tags) for public-facing data like "Random Listings" or "City Cards". These don't need to be real-time for every user.
  - Example: Cache landing page property data for 1 hour.
- **Parallel Fetching**: Ensure data for different sections (`CityCard`, `RandomListings`) is fetched in parallel, not sequentially.

## 4. Bundle Size & Code Splitting
**Goal**: Reduce the amount of JavaScript the client needs to download/execute.

### Investigation
- Use `@next/bundle-analyzer` to identify large dependencies.
- library checks: `mapbox-gl` is large. Ensure it is only loaded when the map is actually visible / needed (Dynamic Import).

## 5. Third-Party Scripts
**Goal**: Minimize blocking time.

### Current State
- Meta Pixel and Google Fonts are being loaded.

### Recommendations
- **Partytown**: Consider offloading third-party scripts (like Meta Pixel) to a web worker using Partytown to free up the main thread.

## Action Plan

1.  **Refactor Photo Upload**: Modify `src/lib/s3.ts` and the upload route to use streams.
2.  **Cache Landing Page Data**: Apply caching to `RandomListings` and `CityCard` data fetching.
3.  **Audit `mapbox-gl`**: Verify it is dynamically imported.
4.  **Review Preloads**: Check if `houses.jpg` is the Hero image.

---

**Next Steps for User**:
- Approve the refactoring of the S3 upload to be more memory efficient.
- Allow investigation into `RandomListings` to apply caching.
