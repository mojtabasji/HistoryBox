import type { Blog, Post, Region } from '@prisma/client';

export function buildItemImageObjectSchema(post: Post, region?: Region | null) {
  const locationName = region?.geohash ?? region?.hash ?? undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: post.title,
    description: post.description ?? undefined,
    contentUrl: undefined, // Full-resolution URL intentionally omitted for locked content
    thumbnail: undefined,
    locationCreated: locationName
      ? {
          '@type': 'Place',
          name: locationName,
        }
      : undefined,
    uploadDate: post.createdAt?.toISOString?.() ?? undefined,
  };
}

export function buildItemPlaceSchema(region: Region | null | undefined) {
  if (!region) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: region.hash ?? region.geohash,
    geo: undefined,
  };
}

export function buildBlogPostingSchema(blog: Blog, region?: Region | null) {
  const locationName = region?.geohash ?? region?.hash ?? undefined;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://historybox.app';
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    datePublished: blog.createdAt.toISOString(),
    dateModified: blog.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'HistoryBox',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'HistoryBox',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icons/icon-192.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${blog.slug}`,
    },
    image: blog.coverImageUrl ?? undefined,
    articleBody: undefined, // We avoid duplicating full body here
    locationCreated: locationName
      ? {
          '@type': 'Place',
          name: locationName,
        }
      : undefined,
  };
}
