
I have an existing Next.js platform where users can upload photos with titles, descriptions, and a geographic location. These photos appear on a world map after unlocking, but the actual item page (photo details) must remain locked for normal users. I need SEO-friendly behavior so Google can index item pages and blog pages while user access remains restricted.

Implement the following features and architecture:

---

### **1. SEO Architecture for Item Pages**

Implement item pages in a way that:

* Googlebot and other search crawlers can fully access the SEO version of the page.
* Normal users cannot view the unlocked content unless they unlock it inside the app.
* Title, description, and location name must be directly available in HTML for crawlers.

Technical requirements:

* Use **Next.js App Router**.
* Use **Server Components** for SEO rendering.
* Detect crawlers using:

  * User-agent inspection, and
  * `searchParams` or a separate secure internal API.
* For crawlers:

  * Render the item page with:

    * title
    * short description
    * location name
    * structured data (JSON-LD schema for “ImageObject” + “Place”)
  * DO NOT include the full-resolution image or sensitive data.
* For normal users:

  * Render a locked view unless they have completed the unlock flow.

Also:

* Every item must have SEO-friendly metadata:

  * `<title>` tag
  * `<meta description>` tag
  * OpenGraph tags
  * JSON-LD Schema.org metadata

Make sure item pages:

* Have a permanent, static URL (`/item/[id]`)
* Are crawlable without requiring JavaScript
* Do not leak locked content

---

### **2. Blog System (SEO-Focused)**

Implement a blog module with:

* `/blog` list page
* `/blog/[slug]` detailed blog page
* Blog pages must be fully SEO-friendly:

  * `<title>`, `<meta>`, OpenGraph, and JSON-LD
* Blog schema type should be: `"BlogPosting"`
* Use a PostgreSQL or SQLite database (choose what fits best)
* Each blog post includes:

  * title
  * slug
  * body (HTML or MDX)
  * location reference (optional)
  * cover image (optional)
  * createdAt / updatedAt

The blog should serve as a content-marketing tool to improve search visibility of locations and items.

---

### **3. Admin API (Authenticated via API Key)**

Implement an Admin REST API to manage blog posts.

Authentication model:

* Use **Option A (Static API Key)**.
* The key is stored in environment variables: `ADMIN_API_KEY=...`
* Incoming admin API calls must include:
  `Authorization: Bearer <API_KEY>`

Admin API endpoints:

* `POST /api/admin/blog` → create blog
* `PUT /api/admin/blog/[id]` → update blog
* `DELETE /api/admin/blog/[id]` → delete blog
* `GET /api/admin/blog` → list posts (admin only)

Return JSON responses.

The API must be fully compatible with **n8n workflows** for automated content publishing.

---

### **4. Admin Panel**

Implement a simple internal admin panel accessible only when the correct API key is provided.

Requirements:

* Location: `/admin`
* Authentication via:

  * Entering the API key manually into a login field
  * Storing it in session/localstorage
  * Using the API key in all admin API requests
* Features:

  * Create blog post
  * Edit blog post
  * Delete blog post
  * List all posts
* UI tech: React Server/Client Components + TailwindCSS

---

### **5. Item Sitemap & Blog Sitemap**

Implement:

* `/sitemap.xml` combining:

  * `/item/[id]` for all item pages (SEO-visible)
  * `/blog/[slug]` for all blog posts
* `/robots.txt` allowing Google to crawl the above pages
* Sitemaps must be generated dynamically from the database.

---

### **6. Deliverables**

The generated code should include:

1. Next.js pages and structures for SEO item pages.
2. Blog module (list + slug pages).
3. Admin API with API key protection.
4. Admin Panel interface.
5. SEO tags + JSON-LD for both items and blogs.
6. Dynamic sitemap and robots.txt.
7. Utility functions for:

   * crawler detection
   * API key authentication

Make sure the implementation is production-level, modular, and easy to extend.
