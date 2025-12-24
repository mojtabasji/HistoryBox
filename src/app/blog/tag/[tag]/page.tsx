import type { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TagPageProps = { params: { tag: string } };

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function getExcerpt(html: string, maxLength = 180): string {
  const text = stripHtml(html).trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const decodedTag = decodeURIComponent(params.tag || '').trim();
  const title = decodedTag ? `برچسب ${decodedTag} - وبلاگ HistoryBox` : 'برچسب وبلاگ HistoryBox';
  const description = decodedTag
    ? `مجموعه مطالب وبلاگ HistoryBox با برچسب «${decodedTag}» شامل داستان‌ها، راهنماها و تجربه‌های سفر.`
    : 'مطالب وبلاگ HistoryBox بر اساس برچسب‌ها.';

  const url = decodedTag ? `/blog/tag/${encodeURIComponent(decodedTag)}` : '/blog';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function BlogTagPage({ params }: TagPageProps) {
  const decodedTag = decodeURIComponent(params.tag || '').trim();
  if (!decodedTag) {
    return (
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-4">برچسب نامعتبر</h1>
        <p className="text-sm text-gray-600">برچسب معتبری انتخاب نشده است.</p>
      </main>
    );
  }

  const posts = await prisma.blog.findMany({
    where: {
      tags: { has: decodedTag },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow relative z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/blog" className="text-xl font-semibold hb-brand font-fa">
              HistoryBox
            </Link>
            <span className="hidden sm:inline-block text-xs text-gray-500">/ Blog / برچسب</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="hb-btn-primary px-3 py-1.5 rounded-md">
              بازگشت به نقشه
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            مطالب با برچسب «{decodedTag}»
          </h1>
          <p className="text-sm text-gray-600">
            مقالات و داستان‌های مرتبط با این موضوع در وبلاگ HistoryBox.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-sm text-gray-600">هنوز مطلبی با این برچسب منتشر نشده است.</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4">
                <Link href={`/blog/${post.slug}`} className="block">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{post.title}</h2>
                  <p className="text-[11px] text-gray-400 rtl-num mb-1">
                    {new Date(post.createdAt).toLocaleDateString('fa-IR')}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">{getExcerpt(post.body, 180)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
