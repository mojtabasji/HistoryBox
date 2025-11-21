import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get('limit') || '20');
    const limit = Math.min(50, Math.max(1, Math.floor(isNaN(limitParam) ? 20 : limitParam)));

    const memories = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        caption: true,
        imageUrl: true,
        latitude: true,
        longitude: true,
        address: true,
        memoryDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ memories });
  } catch (error) {
    console.error('Error fetching recent memories:', error);
    return NextResponse.json({ error: 'Failed to load recent memories' }, { status: 500 });
  }
}
