import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary configuration missing' }, { status: 500 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Prefer multipart/form-data (binary) to avoid large base64 payloads causing 413.
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'No file field provided' }, { status: 400 });
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // Basic size guard (e.g. 8MB)
      const MAX_BYTES = 8 * 1024 * 1024;
      if (buffer.length > MAX_BYTES) {
        return NextResponse.json({ error: 'File too large. Please choose an image < 8MB.' }, { status: 413 });
      }
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'history_box',
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto' },
              { format: 'auto' },
            ],
          },
          (err, res) => {
            if (err || !res) return reject(err || new Error('No response from Cloudinary'));
            resolve(res);
          }
        );
        stream.end(buffer);
      });
      return NextResponse.json({
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
      });
    }

    // Fallback: legacy JSON base64 upload (less efficient, may trigger 413 for large images)
    const body = await request.json().catch(() => null);
    const data = body?.data as string | undefined;
    if (!data) return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    const uploadResponse = await cloudinary.uploader.upload(data, {
      folder: 'history_box',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' },
      ],
    });
    return NextResponse.json({
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      width: uploadResponse.width,
      height: uploadResponse.height,
      legacy: true,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
