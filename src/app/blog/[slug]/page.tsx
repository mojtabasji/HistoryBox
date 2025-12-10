import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { buildBlogPostingSchema } from '@/lib/seoSchemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getBlogBySlug(slug: string) {
  if (!slug) return null;
  return prisma.blog.findUnique({
    where: { slug },
    include: { region: true },
  });
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
): Promise<Metadata> {
  const blog = await getBlogBySlug(params.slug);
  if (!blog) return {};

  const plainText = blog.body.replace(/<[^>]*>/g, '').trim();
  const description = plainText.length > 200 ? `${plainText.slice(0, 200)}…` : plainText || undefined;
  const url = `/blog/${blog.slug}`;

  return {
    title: blog.title,
    description,
    openGraph: {
      title: blog.title,
      description,
      url,
      type: 'article',
      images: blog.coverImageUrl ? [blog.coverImageUrl] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

interface BlogPageProps {
  params: { slug: string };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const blog = await getBlogBySlug(params.slug);
  if (!blog) notFound();

  const schema = buildBlogPostingSchema(blog, blog.region || undefined);

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <article className="max-w-3xl mx-auto prose prose-sm sm:prose lg:prose-lg rtl text-right">
        <header>
          <h1>{blog.title}</h1>
          <p className="text-xs text-gray-400 rtl-num">
            {new Date(blog.createdAt).toLocaleDateString('fa-IR')}
          </p>
          {blog.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blog.coverImageUrl}
              alt={blog.title}
              className="mt-4 rounded-lg max-h-80 w-full object-cover"
              loading="lazy"
            />
          )}
        </header>

        <section
          className="mt-6"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: blog.body }}
        />

        {schema && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        )}
      </article>
    </main>
  );
}
