import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { buildBlogPostingSchema } from '@/lib/seoSchemas';
import { t } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getBlogBySlug(slug: string) {
  if (!slug) return null;

  // Handle potential URL-encoded or Unicode slug differences by trying both
  // the raw value and a decoded variant.
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    decoded = slug;
  }

  const blog = await prisma.blog.findFirst({
    where: {
      OR: [
        { slug },
        decoded !== slug ? { slug: decoded } : { slug },
      ],
    },
    include: { region: true },
  });

  return blog;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return {
      title: 'مطلب یافت نشد',
      description: 'این مطلب وجود ندارد یا حذف شده است.',
    };
  }

  type BlogWithTags = typeof blog & { tags?: string[] | null };
  const blogWithTags = blog as BlogWithTags;

  // Extract plain text for description
  const plainText = blog.body.replace(/<[^>]*>/g, '').trim();
  const excerpt = plainText.slice(0, 160);
  const description = excerpt.length < plainText.length ? `${excerpt}...` : excerpt;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://historybox.app';
  const url = `${baseUrl}/blog/${slug}`;

  return {
    title: blog.title,
    description,
    keywords: [
      blog.title,
      'HistoryBox',
      'وبلاگ',
      'خاطرات',
      'سفر',
      'تاریخ',
      ...(blogWithTags.tags ?? []),
    ],
    authors: [{ name: 'HistoryBox' }],
    openGraph: {
      title: blog.title,
      description,
      url,
      type: 'article',
      publishedTime: blog.createdAt.toISOString(),
      modifiedTime: blog.updatedAt.toISOString(),
      images: blog.coverImageUrl ? [{ 
        url: blog.coverImageUrl,
        width: 1200,
        height: 630,
        alt: `تصویر شاخص ${blog.title}`,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description,
      images: blog.coverImageUrl ? [blog.coverImageUrl] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) notFound();

  type BlogWithTags = typeof blog & { tags?: string[] | null };
  const blogWithTags = blog as BlogWithTags;

  const schema = buildBlogPostingSchema(blog, blog.region || undefined);

  const plainText = blog.body.replace(/<[^>]*>/g, '').trim();
  const readMinutes = Math.max(1, Math.round(plainText.split(/\s+/).filter(Boolean).length / 200));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow relative z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold hb-brand font-fa">{t('historyBox')}</h1>
            <span className="hidden sm:inline-block text-xs text-gray-500">/ Blog</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/blog" className="hb-btn-primary px-3 py-1.5 rounded-md">
              بازگشت به وبلاگ
            </Link>
            <Link href="/" className="hb-btn-primary px-3 py-1.5 rounded-md hidden sm:inline-flex">
              {t('viewMap')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <article className="bg-white rounded-2xl shadow-md overflow-hidden">
          {blog.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blog.coverImageUrl}
              alt={`تصویر شاخص مقاله ${blog.title}`}
              title={blog.title}
              className="w-full max-h-[420px] object-cover"
              loading="lazy"
              width="1200"
              height="630"
            />
          )}

          <div className="px-5 sm:px-8 py-6 sm:py-8">
            <header className="mb-6 border-b border-gray-100 pb-4 flex flex-col gap-3">
              <div>
                <p className="text-xs text-indigo-600 font-semibold rtl-num mb-2">
                  {new Date(blog.createdAt).toLocaleDateString('fa-IR')}{' • '}
                  {readMinutes} دقیقه مطالعه
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-snug">
                  {blog.title}
                </h1>
                {plainText && (
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 sm:line-clamp-none">
                    {plainText.slice(0, 220)}{plainText.length > 220 ? '…' : ''}
                  </p>
                )}
              </div>

              {blog.region ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 rtl-num">
                  <span className="text-[11px] text-gray-500">
                    منطقه مرتبط:
                    {' '}
                    <span className="font-medium">{blog.region.hash ?? blog.region.geohash}</span>
                  </span>
                  <Link
                    href={`/region/${encodeURIComponent(blog.region.hash ?? blog.region.geohash)}`}
                    className="hb-btn-primary px-3 py-1.5 rounded-md text-xs"
                  >
                    مشاهده این منطقه روی نقشه
                  </Link>
                </div>
              ) : (blog.latitude != null && blog.longitude != null) && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 rtl-num">
                  <span className="text-[11px] text-gray-500">
                    موقعیت مکانی:
                    {' '}
                    <span className="font-medium rtl-num">
                      {blog.latitude.toFixed(4)}
                      {', '}
                      {blog.longitude.toFixed(4)}
                    </span>
                  </span>
                  <Link
                    href={`/?lat=${encodeURIComponent(String(blog.latitude))}&lng=${encodeURIComponent(String(blog.longitude))}`}
                    className="hb-btn-primary px-3 py-1.5 rounded-md text-xs"
                  >
                    مشاهده این نقطه روی نقشه
                  </Link>
                </div>
              )}

              {Array.isArray(blogWithTags.tags) && blogWithTags.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                  <span className="text-[11px] text-gray-500">برچسب‌ها:</span>
                  {blogWithTags.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${encodeURIComponent(tag)}`}
                      className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </header>

            <section
              className="prose prose-sm sm:prose lg:prose-lg rtl text-right max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.body }}
            />
          </div>

          {schema && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
          )}
        </article>
      </main>
    </div>
  );
}
