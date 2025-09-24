import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { findOrCreateRegion } from '../../../lib/geohash';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { getSupabaseServer } from '@/lib/supabaseServer';

function getTokenProject(token: string): string | undefined {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as Record<string, unknown>;
    // Firebase ID tokens typically include 'aud' and 'iss' like https://securetoken.google.com/<project-id>
    const iss = typeof payload.iss === 'string' ? payload.iss : undefined;
    const aud = typeof payload.aud === 'string' ? payload.aud : undefined;
    const fromIss = iss?.startsWith('https://securetoken.google.com/') ? iss.split('/').pop() : undefined;
    // Prefer aud (project id), fallback to iss suffix
    return aud || fromIss;
  } catch {
    return undefined;
  }
}

export const runtime = 'nodejs';

// Verify Firebase ID token using public JWKS (no Admin SDK or service account required)
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_ISSUER = FIREBASE_PROJECT_ID ? `https://securetoken.google.com/${FIREBASE_PROJECT_ID}` : undefined;
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

type FirebaseIdPayload = JWTPayload & {
  user_id?: string;
  email?: string;
  aud: string;
  iss: string;
};

async function verifyFirebaseIdToken(idToken: string): Promise<{ uid: string; email?: string; raw: Record<string, unknown> }> {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_ISSUER) {
    throw new Error('Firebase project id not configured (NEXT_PUBLIC_FIREBASE_PROJECT_ID)');
  }
  const { payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
    issuer: FIREBASE_ISSUER,
    audience: FIREBASE_PROJECT_ID,
  });
  const p = payload as FirebaseIdPayload;
  const raw = p as unknown as Record<string, unknown>;
  const uid = p.user_id || p.sub;
  const email = typeof p.email === 'string' ? p.email : undefined;
  if (!uid || typeof uid !== 'string') {
    throw new Error('Invalid token: missing uid');
  }
  return { uid, email, raw };
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Firebase token (via public JWKS)
    let verified;
    try {
      verified = await verifyFirebaseIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      const message = error instanceof Error ? error.message : 'Invalid token';
      const clientProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const tokenProject = getTokenProject(token);
      const hint = 'Invalid token. Ensure the token is a Firebase ID token issued for the configured project.';
      return NextResponse.json({ error: hint, details: message, clientProject, tokenProject }, { status: 401 });
    }

    const firebaseUid = verified.uid;
    const email = verified.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { firebaseUid }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          username: email.split('@')[0], // Use email prefix as username
        }
      });
    }

    // Parse the request body
    const body = await request.json();
    const { title, description, imageUrl, latitude, longitude, address, date } = body;

    // Validate required fields
    if (!title || !imageUrl || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title, imageUrl, latitude, longitude' },
        { status: 400 }
      );
    }

    // Find or create region for this location
    const region = await findOrCreateRegion(latitude, longitude, prisma);

    // Parse the memory date if provided
    let memoryDate = null;
    if (date) {
      memoryDate = new Date(date);
      if (isNaN(memoryDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    }

    // Create the memory post (primary store via Prisma)
    const post = await prisma.post.create({
      data: {
        title,
        description,
        imageUrl,
        latitude,
        longitude,
        address,
        memoryDate,
        userId: user.id,
        regionId: region.id,
        caption: description || title, // Fallback for backward compatibility
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        },
        region: true
      }
    });

    // Update region post count
    await prisma.region.update({
      where: { id: region.id },
      data: {
        postCount: {
          increment: 1
        }
      }
    });

    // Optionally mirror to Supabase if configured
    let supabaseMirror: { ok: boolean; error?: string } | undefined;
    try {
      const sb = getSupabaseServer();
      if (sb) {
        // Ensure user exists in Supabase 'users' table
        const { data: sbUser, error: sbUserErr } = await sb
          .from('users')
          .upsert(
            { firebase_uid: firebaseUid, email },
            { onConflict: 'firebase_uid' }
          )
          .select()
          .single();

        if (sbUserErr) throw sbUserErr;

        // Insert memory into Supabase 'memories' table
        const { error: sbMemErr } = await sb
          .from('memories')
          .insert({
            user_id: sbUser.id,
            prisma_post_id: post.id,
            title,
            description,
            image_url: imageUrl,
            latitude,
            longitude,
            address,
            memory_date: memoryDate,
          });

        if (sbMemErr) throw sbMemErr;
        supabaseMirror = { ok: true };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Supabase mirror failed';
      supabaseMirror = { ok: false, error: msg };
      // Do not fail the request if Supabase mirroring fails
      console.warn('Supabase mirror error:', e);
    }

    return NextResponse.json({
      success: true,
      memory: post,
      message: 'Memory saved successfully',
      supabase: supabaseMirror,
    });

  } catch (error) {
    console.error('Error creating memory:', error);
    const message = error instanceof Error ? error.message : 'Failed to create memory';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    let verified;
    try {
      verified = await verifyFirebaseIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      const message = error instanceof Error ? error.message : 'Invalid token';
      const clientProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const tokenProject = getTokenProject(token);
      const hint = 'Invalid token. Ensure the token is a Firebase ID token issued for the configured project.';
      return NextResponse.json({ error: hint, details: message, clientProject, tokenProject }, { status: 401 });
    }

    const firebaseUid = verified.uid;
    const email = verified.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Find or create user (creation ensures a row exists for new users)
    let user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
      // Fallback to email match or create if none
      user = await prisma.user.findUnique({ where: { email } });
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          username: email.split('@')[0],
        },
      });
    }

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        region: true,
      },
    });

    return NextResponse.json({ memories: posts });
  } catch (error) {
    console.error('Error fetching memories:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch memories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}