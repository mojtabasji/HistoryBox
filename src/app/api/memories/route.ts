import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { findOrCreateRegion } from '../../../lib/geohash';
import { getSupabaseServer } from '@/lib/supabaseServer';
// Auth is resolved by delegating to our Edge route /api/auth/me to avoid Node cookies() issues in Next 15

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Resolve user via Edge /api/auth/me using incoming cookies
    const meUrl = new URL('/api/auth/me', request.url);
    const meRes = await fetch(meUrl.toString(), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });
    const { user: auth0User } = meRes.ok ? await meRes.json() : { user: null };
    if (!auth0User) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const email = typeof auth0User.email === 'string' ? auth0User.email : undefined;
    const sub = typeof auth0User.sub === 'string' ? auth0User.sub : undefined;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Find or create user in our database
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: sub || undefined,
          email,
          username: email.split('@')[0], // Use email prefix as username
        }
      });
    } else if (!user.firebaseUid && sub) {
      // Backfill auth0 sub to firebaseUid column (reused as external id)
      user = await prisma.user.update({ where: { id: user.id }, data: { firebaseUid: sub } });
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
            { firebase_uid: sub || user.firebaseUid || '', email },
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
    // Resolve user via Edge /api/auth/me using incoming cookies
    const meUrl = new URL('/api/auth/me', request.url);
    const meRes = await fetch(meUrl.toString(), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });
    const { user: auth0User } = meRes.ok ? await meRes.json() : { user: null };
    if (!auth0User) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const email = typeof auth0User.email === 'string' ? auth0User.email : undefined;
    const sub = typeof auth0User.sub === 'string' ? auth0User.sub : undefined;
    if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 400 });

    // Find or create user (creation ensures a row exists for new users)
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: sub || undefined,
          email,
          username: email.split('@')[0],
        },
      });
    } else if (!user.firebaseUid && sub) {
      user = await prisma.user.update({ where: { id: user.id }, data: { firebaseUid: sub } });
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