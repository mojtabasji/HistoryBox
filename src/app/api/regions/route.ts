import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      select: {
        id: true,
        geohash: true,
        postCount: true,
        posts: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            latitude: true,
            longitude: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { postCount: 'desc' },
    });

    type RegionRow = {
      id: number;
      geohash: string;
      postCount: number;
      posts: { id: number; latitude: number; longitude: number; imageUrl: string }[];
    };

    const payload = (regions as RegionRow[])
      .filter((r) => r.postCount > 0 && r.posts.length > 0)
      .map((r) => {
        const p = r.posts[0];
        return {
          id: r.id,
          geohash: r.geohash,
          postCount: r.postCount,
          sample: {
            postId: p.id,
            latitude: p.latitude,
            longitude: p.longitude,
            imageUrl: p.imageUrl,
          },
        };
      });

    return NextResponse.json({ regions: payload });
  } catch (error) {
    console.error('Error fetching regions:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch regions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
