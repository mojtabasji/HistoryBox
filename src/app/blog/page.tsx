import Link from 'next/link';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { t } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'HistoryBox Blog',
  description: 'Stories and guides from HistoryBox locations and memories.',
  openGraph: {
    title: 'HistoryBox Blog',
    description: 'Stories and guides from HistoryBox locations and memories.',
    url: '/blog',
    type: 'website',
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

export default async function BlogIndexPage() {
  const posts = await prisma.blog.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">HistoryBox Blog</h1>
          <p className="text-gray-600 text-sm">
            {t('historyBox')} – داستان‌ها و نکات برای کشف بهتر مکان‌ها و خاطرات.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-gray-600 text-sm">هنوز مطلبی منتشر نشده است.</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <Link href={`/blog/${post.slug}`} className="block">
                  <h2 className="text-xl font-semibold mb-1">{post.title}</h2>
                  <p className="text-xs text-gray-400 mb-1 rtl-num">
                    {new Date(post.createdAt).toLocaleDateString('fa-IR')}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {getExcerpt(post.body)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
