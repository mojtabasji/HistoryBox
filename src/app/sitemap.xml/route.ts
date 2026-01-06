import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl(req);

  const [posts, blogs, tagSources] = await Promise.all([
    prisma.post.findMany({ select: { id: true, createdAt: true } }),
    prisma.blog.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.blog.findMany({ select: { tags: true } }),
  ]);

  const urls: string[] = [];

  // Add homepage with highest priority
  urls.push(`  <url>\n    <loc>${baseUrl}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <priority>1.0</priority>\n  </url>`);
  
  // Add blog index page
  urls.push(`  <url>\n    <loc>${baseUrl}/blog</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <priority>0.9</priority>\n  </url>`);

  for (const post of posts) {
    const loc = `${baseUrl}/item/${post.id}`;
    const lastmod = post.createdAt.toISOString();
    urls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>0.7</priority>\n  </url>`);
  }

  for (const blog of blogs) {
    const loc = `${baseUrl}/blog/${blog.slug}`;
    const lastmod = blog.updatedAt.toISOString();
    urls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>0.8</priority>\n  </url>`);
  }

  // Tag pages
  const tagSet = new Set<string>();
  for (const row of tagSources) {
    if (Array.isArray(row.tags)) {
      for (const tag of row.tags) {
        const trimmed = String(tag).trim();
        if (trimmed) tagSet.add(trimmed);
      }
    }
  }

  for (const tag of tagSet) {
    const loc = `${baseUrl}/blog/tag/${encodeURIComponent(tag)}`;
    const lastmod = new Date().toISOString();
    urls.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>0.6</priority>\n  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls.join('\n')}\n` +
    `</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
