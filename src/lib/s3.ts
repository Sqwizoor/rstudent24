import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Cached S3 client instance (created lazily)
let cachedS3Client: S3Client | null = null;

/**
 * Get S3 client with lazy initialization.
 * This ensures environment variables are available at request time in Vercel serverless.
 */
export function getS3Client(): S3Client {
  // Return cached client if available
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'eu-north-1';

  console.log('[S3] Initializing client with:', {
    hasAccessKey: !!accessKeyId,
    hasSecretKey: !!secretAccessKey,
    region,
    bucket: process.env.AWS_BUCKET_NAME || 'NOT SET',
  });

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3 credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) are not configured in environment variables'
    );
  }

  cachedS3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedS3Client;
}

/**
 * Upload a file to S3
 */
export async function uploadFileToS3(
  file: Buffer | Uint8Array | Blob | ReadableStream | string,
  originalName: string,
  mimeType: string,
  prefix: string = 'properties'
): Promise<string> {
  // Validate S3 configuration
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error('AWS_BUCKET_NAME is not configured in environment variables');
  }

  const region = process.env.AWS_REGION || 'eu-north-1';

  // Get S3 client (lazy initialization)
  const s3Client = getS3Client();

  // Create a unique file name to prevent collisions
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '');
  const key = `${prefix}/${uniquePrefix}-${safeFileName}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: mimeType,
    CacheControl: 'public, max-age=86400',
  };

  try {
    console.log(`[S3] Starting upload for file: ${params.Key}`);

    const upload = new Upload({
      client: s3Client,
      params: params,
    });

    await upload.done();
    console.log(`[S3] Successfully uploaded file: ${params.Key}`);

    // Construct URL
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    console.log(`[S3] Generated file URL: ${fileUrl}`);

    return fileUrl;
  } catch (error) {
    console.error('[S3] Error uploading to S3:', error);
    throw new Error(
      `Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(fileUrl: string): Promise<void> {
  // Validate S3 configuration
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error('AWS_BUCKET_NAME is not configured in environment variables');
  }

  // Get S3 client (lazy initialization)
  const s3Client = getS3Client();

  try {
    // Extract the key from the URL
    const urlPath = new URL(fileUrl).pathname;
    const key = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;

    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`[S3] Successfully deleted file: ${key}`);
  } catch (error) {
    console.error('[S3] Error deleting from S3:', error);
    throw new Error(
      `Failed to delete file from S3: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
