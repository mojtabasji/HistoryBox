# n8n APIs for Creating Blogs

This file lists the HTTP endpoints you need to call from n8n to create and manage blog posts in HistoryBox.

## 1. Upload Image (optional)

Use this if you want n8n to upload an image (e.g. to Cloudinary) and get a URL, instead of providing an existing image URL.

- **Method:** `POST`
- **URL:** `https://YOUR_DOMAIN/api/upload`
- **Auth:** none
- **Request (recommended):** `multipart/form-data`
  - Field name: `file`
  - Value: binary image data (PNG/JPG/GIF, < 8MB)
- **Successful response (JSON):**
  - `url`: string – public image URL
  - `public_id`: string
  - `width`: number
  - `height`: number

## 2. Create Blog Post

Use this to create a new blog post.

- **Method:** `POST`
- **URL:** `https://YOUR_DOMAIN/api/admin/blog`
- **Auth:** header `Authorization: Bearer ADMIN_API_KEY`
- **Headers:**
  - `Content-Type: application/json`
- **Body (JSON):**
  - `title` (string, required)
  - `body` (string, required – HTML content)
  - `slug` (string, optional – if omitted, generated from title)
  - `coverImageUrl` (string, optional – URL from `/api/upload` or any other URL)
  - `regionHash` (string, optional – region `hash` or `geohash` if linking to an existing region)
  - `regionId` (number, optional – direct region id, usually not needed if `regionHash` is used)
  - `latitude` (number, optional – blog location latitude)
  - `longitude` (number, optional – blog location longitude)

### Example JSON body

```json
{
  "title": "نمونه مطلب از n8n",
  "slug": "sample-from-n8n",
  "body": "<p>این متن از طریق n8n ارسال شده است.</p>",
  "coverImageUrl": "https://res.cloudinary.com/.../image.jpg",
  "latitude": 35.6892,
  "longitude": 51.3890
}
```

## 3. Update Existing Blog Post (optional)

Use this if you need to update a blog from n8n.

- **Method:** `PUT`
- **URL:** `https://YOUR_DOMAIN/api/admin/blog/:id`
  - Replace `:id` with the numeric blog ID.
- **Auth & headers:** same as **Create Blog Post**
- **Body (JSON):** any subset of the fields used for `POST` (only provided fields will be updated).

## 4. List Blog Posts (optional, for debugging)

Use this to confirm that your n8n flows created/updated posts correctly.

- **Method:** `GET`
- **URL:** `https://YOUR_DOMAIN/api/admin/blog`
- **Auth:** header `Authorization: Bearer ADMIN_API_KEY`
- **Response:** JSON with `posts` array containing blog objects.

> Replace `YOUR_DOMAIN` with your deployed frontend origin (e.g. `https://historybox.com` or your Vercel URL). In n8n, configure these as HTTP Request nodes with the headers and JSON bodies shown above.