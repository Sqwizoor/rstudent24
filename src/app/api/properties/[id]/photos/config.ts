// Single photo upload route configuration
export const runtime = 'nodejs';
export const maxDuration = 60;
export const maxFormDataBodySizeBytes = 12 * 1024 * 1024; // 12MB per single upload
export const dynamic = 'force-dynamic';
