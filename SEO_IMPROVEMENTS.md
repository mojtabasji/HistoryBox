# SEO Improvements Applied to HistoryBox

This document outlines the SEO improvements applied based on [Google's SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

## Summary of Changes

### ✅ 1. Enhanced Metadata (Root Layout)
**File:** `src/app/layout.tsx`

- **Improved Title Structure**: Changed from generic "History Box" to descriptive bilingual title with template support
- **Better Description**: Added detailed Persian description explaining the platform's purpose
- **Added Keywords**: Included relevant keywords for search discovery
- **Author & Publisher Info**: Added proper authorship and publisher metadata
- **Open Graph Tags**: Comprehensive OG tags for social media sharing
- **Twitter Cards**: Added Twitter-specific metadata
- **MetadataBase**: Set canonical base URL using environment variables
- **Robots Configuration**: Explicit instructions for search engines with max preview settings

**Impact**: Improves how pages appear in search results and social media shares.

---

### ✅ 2. Enhanced Structured Data (JSON-LD)
**File:** `src/lib/seoSchemas.ts`

- **Author Information**: Added Organization schema for blog posts
- **Publisher Details**: Included publisher with logo for credibility
- **Absolute URLs**: Changed relative URLs to absolute for better indexing
- **Complete Blog Schema**: Enhanced BlogPosting schema with all recommended fields

**Impact**: Rich snippets in search results, better understanding by search engines.

---

### ✅ 3. Improved Sitemap
**File:** `src/app/sitemap.xml/route.ts`

- **Homepage Entry**: Added homepage with priority 1.0
- **Blog Index**: Added /blog list page with priority 0.9
- **Priority Values**: Assigned appropriate priority values (0.7-1.0)
- **LastMod Dates**: Proper lastmod timestamps for all URLs
- **Organized Structure**: Items categorized by importance

**Impact**: Better crawl efficiency, signals importance to search engines.

---

### ✅ 4. Better Image SEO
**File:** `src/app/blog/[slug]/page.tsx`

- **Descriptive Alt Text**: Changed from title-only to descriptive Persian alt text
- **Title Attribute**: Added title for additional context
- **Width/Height**: Added explicit dimensions for Core Web Vitals
- **Lazy Loading**: Maintained for performance

**Impact**: Better image search visibility, accessibility, and performance.

---

### ✅ 5. Blog List Page Metadata
**File:** `src/app/blog/page.tsx`

- **Persian Title & Description**: Clear, keyword-rich metadata in Persian
- **Keywords Array**: Added relevant Persian keywords
- **Twitter Cards**: Complete Twitter metadata
- **Canonical URL**: Explicit canonical link

**Impact**: Better discoverability for Persian-language searches.

---

## SEO Best Practices Implemented

### ✅ Implemented from Google's Guide

1. **Help Google Find Content**
   - ✅ Dynamic sitemap at `/sitemap.xml`
   - ✅ Robots.txt at `/robots.txt`
   - ✅ Proper internal linking structure

2. **Descriptive URLs**
   - ✅ `/blog/[slug]` - semantic URLs
   - ✅ `/item/[id]` - clean item URLs
   - ✅ `/region/[hash]` - geographic URLs

3. **Influence Title Links**
   - ✅ Unique titles per page
   - ✅ Title templates in root layout
   - ✅ Descriptive, concise titles

4. **Control Snippets**
   - ✅ Meta descriptions on all pages
   - ✅ Relevant, concise descriptions
   - ✅ Unique per page

5. **Add Images with Alt Text**
   - ✅ Descriptive alt text
   - ✅ Images near relevant text
   - ✅ Lazy loading for performance

6. **Structured Data**
   - ✅ BlogPosting schema for blogs
   - ✅ Organization schema
   - ✅ Place schema for locations
   - ✅ ImageObject schema (in seoSchemas.ts)

---

## Additional SEO Features

### Robots.txt
- Allows crawling of `/blog` and `/item` paths
- Points to sitemap
- Respects all user agents

### Sitemap Features
- Dynamic generation from database
- Proper XML format
- LastMod dates
- Priority values
- Includes all public pages

### Metadata Best Practices
- MetadataBase for absolute URLs
- OpenGraph for social sharing
- Twitter Cards
- Proper lang="fa" and dir="rtl"
- Canonical URLs

---

## Performance & Core Web Vitals

- **Lazy Loading**: Images load on-demand
- **Image Dimensions**: Width/height specified
- **ISR (Incremental Static Regeneration)**: Blog pages revalidate every 60s
- **Server Components**: Fast initial page loads

---

## Recommendations for Future

### High Priority
1. **Add WebP/AVIF Images**: Convert images to modern formats
2. **Implement Image CDN**: Use Cloudinary optimizations fully
3. **Add Breadcrumbs**: Especially for blog posts
4. **Mobile Optimization**: Already responsive, verify with PageSpeed Insights

### Medium Priority
1. **Internal Linking**: Add related posts/items
2. **RSS Feed**: For blog content distribution
3. **Schema Markup for Items**: Complete ImageObject schemas when items are unlocked
4. **FAQ Schema**: If adding FAQ sections

### Low Priority
1. **AMP Pages**: Consider for blog if traffic justifies
2. **Multilingual**: If expanding beyond Persian
3. **Video Schema**: If adding video content

---

## Testing Your SEO

### Tools to Use

1. **Google Search Console**
   - Submit sitemap
   - Monitor indexing status
   - Check mobile usability

2. **Rich Results Test**
   - Test blog posts: `https://search.google.com/test/rich-results`

3. **PageSpeed Insights**
   - Check Core Web Vitals
   - Mobile performance

4. **Lighthouse**
   - SEO audit score
   - Accessibility checks

### Manual Checks

```bash
# Check robots.txt
curl https://your-domain.com/robots.txt

# Check sitemap
curl https://your-domain.com/sitemap.xml

# Test blog post
curl https://your-domain.com/blog/your-slug
```

---

## Environment Variables Needed

Add to `.env` or `.env.local`:

```bash
# Required for absolute URLs in metadata and sitemaps
NEXT_PUBLIC_SITE_URL=https://historybox.app
# OR
SITE_URL=https://historybox.app
```

---

## Monitoring SEO Performance

### Key Metrics to Track

1. **Organic Traffic**: Google Analytics
2. **Impressions & Clicks**: Search Console
3. **Average Position**: Search Console
4. **Core Web Vitals**: PageSpeed Insights
5. **Indexed Pages**: Search Console → Coverage
6. **Rich Results**: Search Console → Enhancements

### Expected Timeline

- **2-4 weeks**: Initial indexing
- **1-3 months**: Ranking improvements
- **3-6 months**: Significant organic growth

---

## Notes

- All metadata is bilingual (Persian primary, English secondary)
- Structured data follows Schema.org standards
- Mobile-first approach maintained
- Performance optimizations included
- Persian language SEO optimized

---

## Reference

Based on: [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

Last Updated: December 24, 2025
