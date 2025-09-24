import { NextRequest, NextResponse } from 'next/server';
import { getAdminProjectId, getServerAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

function getTokenProject(token: string): string | undefined {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as Record<string, unknown>;
    const iss = typeof payload.iss === 'string' ? payload.iss : undefined;
    const aud = typeof payload.aud === 'string' ? payload.aud : undefined;
    const fromIss = iss?.startsWith('https://securetoken.google.com/') ? iss.split('/').pop() : undefined;
    return aud || fromIss;
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  // Only enable in development to avoid leaking info in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authorization header required' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  const clientProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const adminProject = getAdminProjectId();
  const tokenProject = getTokenProject(token);

  try {
    const decoded = await getServerAuth().verifyIdToken(token);
    return NextResponse.json({
      ok: true,
      uid: decoded.uid,
      email: decoded.email,
      clientProject,
      adminProject,
      tokenProject,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      ok: false,
      error: message,
      clientProject,
      adminProject,
      tokenProject,
    }, { status: 401 });
  }
}
