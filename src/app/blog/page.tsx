import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { t } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'وبلاگ HistoryBox - داستان‌ها و خاطرات تاریخی',
  description: 'مقالات، داستان‌ها و راهنماهای سفر از مکان‌های تاریخی و فرهنگی HistoryBox. کشف کنید، بیاموزید و خاطرات خود را به اشتراک بگذارید.',
  keywords: ['وبلاگ', 'خاطرات', 'تاریخ', 'مکان‌های تاریخی', 'سفر', 'فرهنگ', 'داستان'],
  openGraph: {
    title: 'وبلاگ HistoryBox',
    description: 'داستان‌ها و راهنماهای سفر از مکان‌های تاریخی و فرهنگی',
    url: '/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'وبلاگ HistoryBox',
    description: 'داستان‌ها و راهنماهای سفر از مکان‌های تاریخی',
  },
  alternates: {
    canonical: '/blog',
  },
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function getExcerpt(html: string, maxLength = 200): string {
  const text = stripHtml(html).trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function estimateReadMinutesFromHtml(html: string): number {
  const text = stripHtml(html);
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes;
}

type Taggable = { tags?: string[] | null };

export default async function BlogIndexPage() {
  const posts = await prisma.blog.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const [featured, ...rest] = posts;
  const trending = rest.slice(0, 4);
  const more = rest.slice(4);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow relative z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold hb-brand font-fa">{t('historyBox')}</h1>
            <span className="hidden sm:inline-block text-xs text-gray-500">/ Blog</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="hb-btn-primary px-3 py-1.5 rounded-md">
              {t('viewMap')}
            </Link>
            <Link href="/dashboard" className="hb-btn-primary px-3 py-1.5 rounded-md hidden sm:inline-flex">
              {t('dashboard')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-10">
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 font-fa">HistoryBox Blog</h2>
              <p className="text-gray-600 text-sm mt-1">
                {t('historyBox')} &apos; روایت ها و راهنماهایی از مکان‌ها و خاطرات HistoryBox.
              </p>
            </div>
          </header>

          {posts.length === 0 ? (
            <div className="rounded-lg p-6 bg-white shadow-md text-center text-sm text-gray-600">
              هنوز مطلبی منتشر نشده است.
            </div>
          ) : (
            <>
              <section className="grid gap-6 lg:grid-cols-[2.1fr,1.4fr] items-stretch">
                {featured && (
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col md:flex-row"
                  >
                    <div className="relative w-full md:w-1/2 aspect-[4/3] md:aspect-auto md:h-full">
                      {featured.coverImageUrl ? (
                        <Image
                          src={featured.coverImageUrl}
                          alt={featured.title}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 50vw, 100vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
                      )}
                    </div>
                    <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-indigo-600 font-semibold mb-1 rtl-num">
                          {new Date(featured.createdAt).toLocaleDateString('fa-IR')}{' • '}
                          {estimateReadMinutesFromHtml(featured.body)} دقیقه مطالعه
                        </p>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 line-clamp-2">
                          {featured.title}
                        </h3>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {getExcerpt(featured.body, 220)}
                        </p>
                        {Array.isArray((featured as Taggable).tags) &&
                          (featured as Taggable).tags!.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-indigo-700">
                              {(featured as Taggable).tags!.slice(0, 3).map((tag: string) => (
                                <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-50">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="mt-4 text-xs text-indigo-600 font-medium">
                        ادامه مطلب →
                      </div>
                    </div>
                  </Link>
                )}

                <aside className="bg-white rounded-2xl shadow-md p-4 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">مطالب محبوب</h3>
                  {trending.length === 0 ? (
                    <p className="text-xs text-gray-500">هیچ مطلب محبوبی وجود ندارد.</p>
                  ) : (
                    <ul className="space-y-3">
                      {trending.map((post) => (
                        <li key={post.id}>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="flex gap-3 items-start group"
                          >
                            {post.coverImageUrl ? (
                              <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={post.coverImageUrl}
                                  alt={post.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform"
                                  sizes="80px"
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-16 rounded-lg bg-gray-100 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-400 rtl-num mb-0.5">
                                {new Date(post.createdAt).toLocaleDateString('fa-IR')}{' • '}
                                {estimateReadMinutesFromHtml(post.body)} دقیقه
                              </p>
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600">
                                {post.title}
                              </h4>
                              {((post as Taggable).tags ?? []).length > 0 && (
                                <div className="mt-0.5 flex flex-wrap gap-1 text-[10px] text-indigo-700">
                                  {((post as Taggable).tags ?? []).slice(0, 2).map((tag: string) => (
                                    <span key={tag} className="px-1.5 py-0.5 rounded-full bg-indigo-50">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </aside>
              </section>

              {more.length > 0 && (
                <section className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">مطالب اخیر</h3>
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {more.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
                      >
                        {post.coverImageUrl && (
                          <div className="relative w-full h-40">
                            <Image
                              src={post.coverImageUrl}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="(min-width: 1024px) 30vw, 50vw"
                            />
                          </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col">
                          <p className="text-[11px] text-gray-400 rtl-num mb-1">
                            {new Date(post.createdAt).toLocaleDateString('fa-IR')}{' • '}
                            {estimateReadMinutesFromHtml(post.body)} دقیقه
                          </p>
                          <h4 className="text-base font-semibold text-gray-900 line-clamp-2 mb-1">
                            {post.title}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2 flex-1">
                            {getExcerpt(post.body, 140)}
                          </p>
                          {((post as Taggable).tags ?? []).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-indigo-700">
                              {((post as Taggable).tags ?? []).slice(0, 2).map((tag: string) => (
                                <span key={tag} className="px-1.5 py-0.5 rounded-full bg-indigo-50">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
