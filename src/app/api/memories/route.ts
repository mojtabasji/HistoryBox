import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { findOrCreateRegion } from '../../../lib/geohash';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getAuthUserFromRequest } from '@/lib/authServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
  const stUser = await getAuthUserFromRequest(request);
  if (!stUser) return NextResponse.json({ memories: [] }, { status: 200 });

    // Map SuperTokens user to Prisma user
    let user = await prisma.user.findFirst({ where: { username: stUser.phoneNumber || stUser.id } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `${stUser.id}@users.supertokens`,
          username: stUser.phoneNumber || stUser.id,
        },
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
    if (!region) {
      return NextResponse.json(
        { error: 'Failed to resolve region for the provided coordinates' },
        { status: 500 }
      );
    }

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
    // Be resilient to schema variants: some deployments may require a regionHash column on Post, others may not.
    const baseData: Prisma.PostCreateInput = {
      title,
      description: description || undefined,
      caption: (description || title) || undefined,
      imageUrl,
      latitude,
      longitude,
      address: address || undefined,
      memoryDate: memoryDate || undefined,
      user: { connect: { id: user.id } },
      region: { connect: { id: region.id } },
    };

    const include = {
      user: { select: { id: true, email: true, username: true } },
      region: true,
    } as const;

    // Memory cost in coins (adjustable)
    const MEMORY_COST = 6;

    // Ensure user has enough coins
    const userRow = await prisma.user.findUnique({ where: { id: user.id }, select: { coins: true } });
    const currentCoins = userRow?.coins ?? 0;
    if (currentCoins < MEMORY_COST) {
      return NextResponse.json({ error: 'Not enough coins to add a memory', coins: currentCoins }, { status: 402 });
    }

    let post: unknown;
    let newCoins = currentCoins;
    // Perform create + region update + coin decrement in a transaction (with timeout to avoid P2028 in dev reloads)
    await prisma.$transaction(async (tx) => {
      // Try create without regionHash first; fallback to including regionHash if schema requires it.
      const attemptCreate = async (dataObj: Prisma.PostCreateInput) => tx.post.create({ data: dataObj, include });
      try {
        post = await attemptCreate(baseData);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const needsRegionHash = /Argument\s+`?regionHash`?\s+is\s+missing|Missing\s+required\s+value.*regionHash/i.test(msg);
        if (!needsRegionHash) throw err;
        const geohash = (region as { geohash?: string }).geohash || undefined;
        post = await attemptCreate({ ...baseData, regionHash: geohash });
      }

      await tx.region.update({
        where: { id: region.id },
        data: { postCount: { increment: 1 } },
      });

      const updated = await tx.user.update({
        where: { id: user.id },
        data: { coins: { decrement: MEMORY_COST } },
        select: { coins: true },
      });
      newCoins = updated.coins;
    }, { timeout: 20000, maxWait: 5000 });

    // Optionally mirror to Supabase if configured
    let supabaseMirror: { ok: boolean; error?: string } | undefined;
    try {
      const sb = getSupabaseServer();
      if (sb) {
  const externalId = (user.username || '');
        // Look up by firebase_uid first; insert if missing
        let userIdRow: { id: number } | null = null;
        const { data: existingRow, error: selectErr } = await sb
          .from('users')
          .select('id')
          .eq('firebase_uid', externalId)
          .limit(1)
          .maybeSingle();
        if (selectErr) throw selectErr;
        if (existingRow) {
          userIdRow = existingRow;
        } else {
          const { data: insRows, error: insErr } = await sb
            .from('users')
            .insert({ firebase_uid: externalId, email: user.email })
            .select('id')
            .limit(1);
          if (insErr) throw insErr;
          userIdRow = insRows && insRows[0] ? insRows[0] : null;
        }
        if (!userIdRow) throw new Error('Failed to ensure Supabase user');

        // Insert memory into Supabase 'memories' table
        const { error: sbMemErr } = await sb
          .from('memories')
          .insert({
            user_id: userIdRow.id,
            prisma_post_id: (post as { id: number }).id,
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
      coins: newCoins,
    });

  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Resolve user via Edge /api/auth/me using incoming cookies
  const stUser = await getAuthUserFromRequest(request);
  if (!stUser) return NextResponse.json({ memories: [] }, { status: 200 });
    let user = await prisma.user.findFirst({ where: { username: stUser.id } });
    if (!user && stUser.phoneNumber) {
      user = await prisma.user.findFirst({ where: { username: stUser.phoneNumber } });
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: stUser.id,
          email: `${stUser.id}@users.supertokens`,
          phoneNumber: stUser.phoneNumber || stUser.id,
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
    return NextResponse.json({ error: 'Failed to load memories' }, { status: 500 });
  }
}