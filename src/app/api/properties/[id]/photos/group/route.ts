import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { verifyAuth } from '@/lib/auth';

// Limit constants
const MAX_FILES_PER_GROUP = 3; // user requested 3 (or 2/3) at a time
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB per file safeguard
const MAX_TOTAL_BYTES = 30 * 1024 * 1024; // cumulative guard per request

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function uploadFileToS3(file: Buffer, originalName: string, mimeType: string): Promise<string> {
  if (!process.env.AWS_BUCKET_NAME) throw new Error('AWS_BUCKET_NAME not configured');
  if (!process.env.AWS_REGION) throw new Error('AWS_REGION not configured');
  const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '');
  const key = `properties/${uniquePrefix}-${safeFileName}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: mimeType,
    CacheControl: 'public, max-age=86400'
  };
  const upload = new Upload({ client: s3Client, params });
  await upload.done();
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export const runtime = 'nodejs';
export const preferredRegion = ['fra1', 'arn1'];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_TOTAL_BYTES) {
      return NextResponse.json({ message: 'Grouped payload too large', maxTotalBytes: MAX_TOTAL_BYTES }, { status: 413 });
    }

    const { id } = await params;
    const propertyId = parseInt(id);
    if (isNaN(propertyId)) {
      return NextResponse.json({ message: 'Invalid property id' }, { status: 400 });
    }

    // Auth (allow only authenticated managers/owners; currently basic auth check)
    const authResult = await verifyAuth(request, ['manager', 'admin']);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ message: authResult.message || 'Unauthorized' }, { status: 401 });
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { photoUrls: true } });
    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (err) {
      return NextResponse.json({ message: 'Failed to parse form data' }, { status: 400 });
    }

    const files = formData.getAll('photos').filter(f => f instanceof File) as File[];
    if (files.length === 0) {
      return NextResponse.json({ message: 'No files provided. Use field name "photos".' }, { status: 400 });
    }
    if (files.length > MAX_FILES_PER_GROUP) {
      return NextResponse.json({ message: `Too many files. Max ${MAX_FILES_PER_GROUP} per request.` }, { status: 400 });
    }

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json({ message: 'Combined files too large', totalBytes, max: MAX_TOTAL_BYTES }, { status: 413 });
    }
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        return NextResponse.json({ message: `File ${f.name} exceeds per-file limit (${MAX_FILE_BYTES} bytes)` }, { status: 400 });
      }
    }

    const featuredIndexRaw = formData.get('featuredIndex');
    const featuredIndex = featuredIndexRaw ? parseInt(featuredIndexRaw as string) : null;

    const existing = (property.photoUrls as string[]) || [];
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const buf = Buffer.from(await file.arrayBuffer());
        const url = await uploadFileToS3(buf, file.name, file.type || 'application/octet-stream');
        uploadedUrls.push(url);
      } catch (err) {
        return NextResponse.json({ message: `Failed uploading ${file.name}`, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
      }
    }

    let newOrder: string[];
    if (featuredIndex !== null && featuredIndex >= 0 && featuredIndex < uploadedUrls.length) {
      const featuredUrl = uploadedUrls[featuredIndex];
      const remainingUploaded = uploadedUrls.filter((u, idx) => idx !== featuredIndex);
      newOrder = [featuredUrl, ...existing, ...remainingUploaded];
    } else {
      newOrder = [...existing, ...uploadedUrls];
    }

    const updated = await prisma.property.update({ where: { id: propertyId }, data: { photoUrls: newOrder } });

    return NextResponse.json({
      message: 'Group upload successful',
      uploaded: uploadedUrls,
      totalPhotos: newOrder.length,
      propertyId: propertyId,
    });
  } catch (error) {
    console.error('Grouped photo upload error:', error);
    return NextResponse.json({ message: 'Unexpected error during grouped upload', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
