// Batch photo upload route configuration
export const runtime = 'nodejs';
export const maxDuration = 60; // seconds
export const maxFormDataBodySizeBytes = 30 * 1024 * 1024; // 30MB total form-data
export const maxFileCount = 50;
export const dynamic = 'force-dynamic';
