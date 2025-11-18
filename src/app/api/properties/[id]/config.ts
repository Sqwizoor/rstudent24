// Configuration for the property update (PUT) API route
// Adjust these values based on expected number/size of images.
// Note: This only takes effect when the route executes in the Node.js runtime.
export const maxDuration = 60; // seconds
export const maxFormDataBodySizeBytes = 25 * 1024 * 1024; // 25MB overall form-data limit
export const maxFileCount = 50; // Safety upper bound
export const dynamic = 'force-dynamic'; // Ensure not statically optimized
export const runtime = 'nodejs'; // Force Node runtime (avoid Edge small body limits)
