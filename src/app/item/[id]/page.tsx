import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { isCrawlerRequest, type SearchParamsLike } from '@/lib/crawler';
import { buildItemImageObjectSchema, buildItemPlaceSchema } from '@/lib/seoSchemas';
import { t } from '@/lib/i18n';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getPostWithRegion(id: number) {
  if (!Number.isFinite(id)) return null;
  return prisma.post.findUnique({
    where: { id },
    include: { region: true },
  });
}

export async function generateMetadata(
  { params }: { params: { id: string } },
): Promise<Metadata> {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return {};

  const post = await prisma.post.findUnique({
    where: { id },
    include: { region: true },
  });
  if (!post) return {};

  const title = post.title || `${t('memory')} #${post.id}`;
  const description = post.description || t('lockedPreview');
  const url = `/item/${post.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
    },
    alternates: {
      canonical: url,
    },
  };
}

interface ItemPageProps {
  params: { id: string };
  searchParams: SearchParamsLike;
}

export default async function ItemPage({ params, searchParams }: ItemPageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const post = await getPostWithRegion(id);
  if (!post) notFound();

  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  const isCrawler = isCrawlerRequest(userAgent, searchParams);

  const region = post.region ?? null;

  const seoSchemaGraph = (() => {
    if (!isCrawler) return null;
    const imageObject = buildItemImageObjectSchema(post, region || undefined);
    const place = buildItemPlaceSchema(region);
    const graph = [imageObject, ...(place ? [place] : [])];
    return {
      '@context': 'https://schema.org',
      '@graph': graph,
    };
  })();

  if (!isCrawler) {
    // Normal users always see a locked view on the direct item URL.
    // They can unlock and view full content through the in-app map/region flow.
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-xl w-full bg-white shadow rounded-lg p-6 text-center space-y-3">
          <h1 className="text-2xl font-semibold mb-2">{t('lockedPreview')}</h1>
          <p className="text-gray-600 text-sm">
            {t('memory')} #{post.id} {t('lockedSuffix')}
          </p>
          <p className="text-gray-500 text-sm">
            {region?.hash && (
              <span>
                {t('region')} {region.hash}
              </span>
            )}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            برای مشاهده جزئیات کامل، این منطقه را از داخل نقشه HistoryBox باز کنید.
          </p>
        </div>
      </main>
    );
  }

  const title = post.title || `${t('memory')} #${post.id}`;
  const description = post.description || t('lockedPreview');
  const locationName = region?.hash ?? region?.geohash ?? undefined;

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <article className="max-w-3xl mx-auto prose prose-sm sm:prose lg:prose-lg rtl text-right">
        <header>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
          {locationName && (
            <p>
              <strong>{t('location')}:</strong> {locationName}
            </p>
          )}
        </header>

        {/* We deliberately do NOT render the full-resolution image or any
            sensitive user data here. */}
        <section>
          <p>
            این نسخه مخصوص ربات‌های جستجو است و فقط اطلاعات متنی پایه را نمایش می‌دهد.
          </p>
        </section>

        {seoSchemaGraph && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(seoSchemaGraph) }}
          />
        )}
      </article>
    </main>
  );
}
