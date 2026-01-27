import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

/**
 * Cloudflare R2 Storage Service
 * 
 * Setup:
 * 1. Go to Cloudflare Dashboard > R2
 * 2. Create a bucket (e.g., "harkat-uploads")
 * 3. Create API token with read/write permissions
 * 4. Set environment variables
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'harkat-uploads';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Your custom domain or R2.dev URL

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

export interface UploadResult {
  key: string;
  url: string;
}

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Optimize image using sharp - compress and convert to WebP
 */
export async function optimizeImage(
  buffer: Buffer,
  options: OptimizeOptions = {}
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 80,
    format = 'webp'
  } = options;

  let sharpInstance = sharp(buffer);
  
  // Get image metadata
  const metadata = await sharpInstance.metadata();
  
  // Resize if needed (maintain aspect ratio)
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
  }

  let optimizedBuffer: Buffer;
  let mimeType: string;
  let extension: string;

  // Convert to specified format
  switch (format) {
    case 'webp':
      optimizedBuffer = await sharpInstance.webp({ quality }).toBuffer();
      mimeType = 'image/webp';
      extension = 'webp';
      break;
    case 'jpeg':
      optimizedBuffer = await sharpInstance.jpeg({ quality, mozjpeg: true }).toBuffer();
      mimeType = 'image/jpeg';
      extension = 'jpg';
      break;
    case 'png':
      optimizedBuffer = await sharpInstance.png({ quality, compressionLevel: 9 }).toBuffer();
      mimeType = 'image/png';
      extension = 'png';
      break;
    default:
      optimizedBuffer = await sharpInstance.webp({ quality }).toBuffer();
      mimeType = 'image/webp';
      extension = 'webp';
  }

  const originalSize = buffer.length;
  const optimizedSize = optimizedBuffer.length;
  const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
  
  console.log(`[Sharp] Optimized: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% saved)`);

  return { buffer: optimizedBuffer, mimeType, extension };
}

/**
 * Upload file to Cloudflare R2 with optional image optimization
 */
export async function uploadToR2(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folder: string = 'uploads',
  optimize: boolean = true
): Promise<UploadResult> {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('Cloudflare R2 credentials not configured');
  }

  let uploadBuffer = buffer;
  let uploadMimeType = mimeType;
  let finalFileName = fileName;

  // Optimize if it's an image
  if (optimize && mimeType.startsWith('image/') && !mimeType.includes('gif')) {
    try {
      const optimized = await optimizeImage(buffer, { 
        quality: 80, 
        format: 'webp',
        maxWidth: 1920,
        maxHeight: 1920
      });
      uploadBuffer = optimized.buffer;
      uploadMimeType = optimized.mimeType;
      // Change extension to webp
      const baseName = fileName.replace(/\.[^.]+$/, '');
      finalFileName = `${baseName}.${optimized.extension}`;
    } catch (error) {
      console.warn('[R2] Image optimization failed, uploading original:', error);
      // Continue with original if optimization fails
    }
  }

  const key = `${folder}/${finalFileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: uploadBuffer,
      ContentType: uploadMimeType,
    })
  );

  // Generate public URL
  const url = R2_PUBLIC_URL 
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.dev/${key}`;

  console.log('[R2] Uploaded:', key);

  return { key, url };
}

/**
 * Delete file from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
  console.log('[R2] Deleted:', key);
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

