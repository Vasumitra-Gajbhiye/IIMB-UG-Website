# Cloudflare R2 setup (gallery uploads)

Gallery photos and videos are stored in a Cloudflare R2 bucket. The browser uploads **directly** to R2 with a short-lived presigned PUT URL (videos can be 200 MB, which is too large to send through Vercel). Postgres only stores metadata and the public URL.

Do this once for local `.env.local`, then copy the same values into the Vercel project.

## 1. Create a bucket

1. Open [Cloudflare Dashboard → R2](https://dash.cloudflare.com/?to=/:account/r2/overview).
2. **Create bucket**. Name suggestion: `iimb-ug-gallery`.
3. Leave default location (automatic) unless you have a jurisdiction requirement.

## 2. Create an S3 API token

1. R2 → **Manage R2 API Tokens** (or **Overview** → **API Tokens**).
2. **Create API token**.
3. Permissions: **Object Read & Write** on the gallery bucket (or the account, if you prefer).
4. Copy:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
5. Account ID is in the R2 overview URL / sidebar → `R2_ACCOUNT_ID`.

## 3. Public access (read)

Uploads use the S3 API. The public gallery needs a **public base URL** so `<img>` / `<video>` / `next/image` can fetch objects.

Easiest path — Cloudflare-managed `r2.dev` subdomain:

1. Open the bucket → **Settings** → **Public access**.
2. Allow access via **r2.dev** subdomain.
3. Copy the public URL, e.g. `https://pub-xxxxxxxxxxxxxxxx.r2.dev` (no trailing slash).
4. Set `R2_PUBLIC_BASE_URL` to that value.

Optional: attach a custom domain (`media.iimb-ug.vasumitragajbhiye.com`) in bucket settings and use that as `R2_PUBLIC_BASE_URL` instead. You do not need `r2.dev` if the custom domain is live.

Object keys look like `gallery/{userId}/{year}/{uuid}.jpg`, so a file is served at:

```text
https://pub-xxxxxxxxxxxxxxxx.r2.dev/gallery/{userId}/{year}/{uuid}.jpg
```

## 4. CORS (required for browser PUTs)

Bucket → **Settings** → **CORS policy**. Allow the local app and production site to `PUT` with the headers the presigned URL signs:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://iimb-ug.vasumitragajbhiye.com"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Add any preview-deployment origins you actually use. `AllowedMethods` `GET`/`HEAD` are optional for playback (`<img>` / `<video>` are not CORS-gated) but help if you ever draw onto a canvas.

## 5. Environment variables

| Variable | Where it is used | Example |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | S3 endpoint `https://{account}.r2.cloudflarestorage.com` | `a1b2c3d4e5f6…` |
| `R2_ACCESS_KEY_ID` | Presign + delete (server only) | token access key |
| `R2_SECRET_ACCESS_KEY` | Presign + delete (server only) | token secret |
| `R2_BUCKET_NAME` | Bucket the API talks to | `iimb-ug-gallery` |
| `R2_PUBLIC_BASE_URL` | Public object URLs + `next/image` host | `https://pub-xxxx.r2.dev` |

None of these should be prefixed with `NEXT_PUBLIC_`. The client never sees the keys — only a time-limited PUT URL.

Local `.env.local`:

```bash
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=iimb-ug-gallery
R2_PUBLIC_BASE_URL=https://pub-xxxxxxxxxxxxxxxx.r2.dev
```

Vercel: **Project → Settings → Environment Variables** (Production + Preview). `R2_PUBLIC_BASE_URL` is read at **build** time for `images.remotePatterns`, so set it before the first deploy that serves gallery images. Redeploy after changing it.

## 6. Limits the app enforces

- Images: JPEG, PNG, WebP, GIF (HEIC is converted to JPEG in the browser). Max **25 MB**.
- Videos: MP4, WebM, MOV. Max **200 MB**.
- Max **40 files** per Post.
- Validation is **per file**. A 300 MB video is rejected; the other files in the same drop stay in the preview.

## 7. Smoke test

1. `npm run dev`
2. Sign in with an allowlisted account → **Studio → Gallery**
3. Drop one small JPEG and click **Post**
4. Confirm it appears on `/gallery`
5. Delete the post from Studio and confirm the object disappears from the R2 bucket
