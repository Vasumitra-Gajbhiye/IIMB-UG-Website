# IIMB UG — Site Build Plan

**Spec is locked. You can start coding.** Work phase-wise from Phase 1. New chat prompt:

```text
Implement Phase 1 from plan.md. Read plan.md first and follow that phase only.
Do not start Phase 2 until Phase 1's Definition of Done is checked off.
```

Use this file as the coding spec. Follow phases in order. Do not skip the Definition of Done at the end of a phase.

This is a **student-run public site** for the inaugural IIM Bangalore undergraduate cohort (AY 2026–27): 80 students, 40 per major, School of Multidisciplinary Studies, Jigani campus. Official programme names:

- B.Sc. (Hons) in **Data Science** (minor in Economics and Business)
- B.Sc. (Hons) in **Economics** (minor in Data Science and Business)

It is **not** a replacement for [ug.iimb.ac.in](https://ug.iimb.ac.in). Footer must say this is a student project, not an official IIMB admissions site. **IIMB logo is allowed** on this site.

---

## How to use this file

1. Read **Repo snapshot** and **Locked decisions**. There are **no blocking open questions**.
2. Implement one phase at a time. Check that phase’s **Definition of Done** before starting the next.
3. When a decision changes, update this file first, then the code.

**New chat kickoff:** paste `Implement Phase N from plan.md. Read plan.md first and follow that phase only.` Start at **Phase 1**. Do not skip ahead.

**Editor reference (do not copy the whole Ralevel app):** the Notion-like editor and review flow live in `ralevel-website` at:

- `apps/website/src/components/blogs-v2/BlockNoteEditor.tsx`
- `apps/website/src/components/blogs-v2/BlockNoteViewer.tsx`
- `apps/website/src/app/(admin)/admin/blogs/v2/[blogId]/edit/BlogEditorClient.tsx`
- `apps/website/src/components/blogs-v2/BlogReviewActions.tsx`
- `apps/website/src/models/blogV2.ts` (status machine only — we reimplement in Prisma)

Port the **UX and BlockNote wiring**, not Mongo, likes, comments, or version history.

---

## Repo snapshot (today)

Already done:

- Next.js **16.3.1** App Router, React **19.2.8**, TypeScript, Tailwind **v4**
- `src/` directory (`@/*` → `./src/*`)
- Default `create-next-app` landing page, Geist fonts, no shadcn, no Prisma, no Clerk, no routes
- IIMB sunburst logo at `public/iimb-logo.png`

Do **not** run `create-next-app` again. Phase 1 starts from this tree.

Package manager: **npm**.

---

## Product in one sentence

A public batch site: meet students, open a profile, read reviewed writing, and vote on batch **proposals** — plus a Clerk-gated `/admin` where allowlisted emails edit their card, share resources, manage proposals, and submit BlockNote posts that a super-admin must approve before they go live.

Primary audience: the 80 batchmates, families, and curious outsiders. Secondary: future applicants (link them to official IIMB pages; do not invent admissions policy).

---

## Locked decisions

| Topic | Decision |
| --- | --- |
| Site name | **IIMB UG** |
| Tagline | Inaugural undergraduate batch · Class of 2030 |
| Production URL | `https://iimb-ug.vasumitragajbhiye.com` (`NEXT_PUBLIC_SITE_URL`) |
| Official status | Student-run. Disclaimer in footer. Navbar uses `public/iimb-logo.png` (sunburst) + **IIMB UG** wordmark |
| Super-admin | `vasumitragajbhiye20@gmail.com` — also the seed `AllowedEmail` and `SUPER_ADMIN_EMAILS` |
| Resources | **Links only in v1**: title + URL + optional one-line description. No file uploads |
| Tracks | `DATA_SCIENCE` and `ECONOMICS` only |
| Public vs private | Entire public site is open. No batch password |
| Directory | `/directory` grid of listed students |
| Profiles | `/directory/[slug]` — bio, extra fields, socials, published blogs, shared resources |
| Student fields (public) | name, slug, track, bio, avatar, hometown, previous school, LinkedIn, GitHub, X/Twitter, Instagram, personal site |
| Student fields (private) | `email` — used only to link a Clerk user. **Never render on the public site** |
| Listing | `isListed`. Unlisted students are omitted from directory, home teaser, and public profile (`notFound`) |
| Who edits cards now | Only **super-admin** (you). The product still has “edit my profile” so adding emails later is data, not a rewrite |
| Who edits cards later | Super-admin adds official emails to the allowlist and links them to `Student.email` |
| Blogs | Public index `/blogs` + `/blogs/[slug]`. Author is a `Student` |
| Blog editor | **BlockNote** (same stack as Ralevel blogs-v2). Notion-like, not a Markdown textarea |
| Blog review | Nobody self-publishes. Flow: `DRAFT` → `IN_REVIEW` → `PUBLISHED` or `CHANGES_REQUESTED` |
| Super-admin publish | Super-admin may approve (and can write posts). Even super-admin posts should go through Save draft → Submit → Approve so the queue stays honest. Shortcut: super-admin **Approve** on their own submission is enough |
| FAQ | Pretty **dummy** accordion. Placeholder copy. Real answers later |
| Proposals | Public index `/proposals` + `/proposals/[slug]`. Admins author a proposal (blog-like body), students vote via a form, results list at the bottom with optional **anonymity**. Printable for college review. **Full build = Phase 2.5** (before Directory). Schema/auth details locked in that phase’s kickoff |
| Gallery | Public `/gallery` — **last** content page (Phase 8). Placeholder in Phase 2 |
| `/me` | Signed-in self page (placeholder). Edit own student card later; avatar in navbar links here after Sign in |
| Landing | Simple and honest. Visual polish is a later pass, not Phase 5 scope |
| Auth | **Clerk** (`@clerk/nextjs` v7). New Clerk application — do **not** reuse the Ralevel instance |
| Admin access | Clerk proves identity. **`AllowedEmail` in Postgres** is the source of truth for who may enter `/admin` |
| Mods | `Role.SUPER_ADMIN` (env `SUPER_ADMIN_EMAILS` **or** `AllowedEmail.role`). Access + admin Directory are mod-only |
| Super-admin immutability | Emails in `SUPER_ADMIN_EMAILS` are always allowed/mod. **Nobody** can remove or demote them via Access UI |
| Admin Directory | `/admin/directory` — paginated (20) list of real Clerk sign-ups (`User`), not public `/directory` |
| Sign-in methods | Google + email one-time code (Clerk defaults). **Public sign-up stays enabled** so Directory can list sign-ups; authorization is still `AllowedEmail` |
| Design | Light, editorial. Zinc + IIMB maroon accent. Geist Sans UI, Source Serif 4 for titles |
| Dark mode | No toggle in v1. Design for light |
| Images | Avatars/covers in `public/` for seed/static. BlockNote inline images: **URL embed only in v1** (no R2/Cloudinary yet) |
| Comments / likes / RSS | Out of scope |
| Analytics | `@vercel/analytics` in Phase 7 |
| ORM | Prisma **7** + Neon pooled URL for queries, direct URL for migrations |

### IIMB maroon token

Use one accent everywhere (buttons, track badge for DS, links, OG background):

```css
--iimb-maroon: oklch(0.42 0.16 20); /* ~ #8B1A2B — tune against the logo */
```

Map shadcn `--primary` to this maroon.

### Roles

| Role | Who | Can do |
| --- | --- | --- |
| Anonymous | Public | Read home, directory, profiles, published blogs, FAQ |
| `STUDENT` | Allowlisted email, linked to a `Student` | `/admin`: edit **own** profile + resources; create/edit **own** blogs; submit for review. **Cannot** open Access or admin Directory |
| `SUPER_ADMIN` (mod) | `SUPER_ADMIN_EMAILS` and/or `AllowedEmail.role = SUPER_ADMIN` | Everything a student can, plus Access allowlist, admin Directory of sign-ups, edit any profile, review queue |

Unlinked allowlisted users (email on the list, no `Student` row yet): can sign in, see a “ask super-admin to link your profile” screen, cannot publish.

Until other emails are added, **only** `vasumitragajbhiye20@gmail.com` is on the allowlist + super-admin list. Students cannot edit cards yet; the UI is built.

---

## Deploy-time notes (not blockers)

Do these in **Phase 7**, not before coding Phase 1:

- New Clerk application named `iimb-ug` (dev keys can be created in Phase 6)
- Add production domain `https://iimb-ug.vasumitragajbhiye.com` in Clerk + Vercel DNS when you have it

---

## Target file tree

```text
.
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── prisma.config.ts
├── src/
│   ├── proxy.ts                         # clerkMiddleware — Next 16, not middleware.ts
│   ├── generated/prisma/                # gitignored
│   ├── app/
│   │   ├── layout.tsx                   # ClerkProvider + SiteShell
│   │   ├── page.tsx                     # /
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── opengraph-image.tsx
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── me/page.tsx                  # signed-in self profile (edit later)
│   │   ├── directory/page.tsx
│   │   ├── directory/[slug]/page.tsx
│   │   ├── proposals/page.tsx
│   │   ├── proposals/[slug]/page.tsx
│   │   ├── blogs/page.tsx
│   │   ├── blogs/[slug]/page.tsx
│   │   ├── gallery/page.tsx             # last content page (Phase 8)
│   │   ├── faq/page.tsx
│   │   └── admin/
│   │       ├── layout.tsx               # thin (no allowlist)
│   │       ├── forbidden/page.tsx       # signed in, not allowlisted
│   │       └── (studio)/                # requireAllowlisted + sidebar
│   │           ├── layout.tsx
│   │           ├── page.tsx             # dashboard
│   │           ├── access/page.tsx      # mod allowlist
│   │           ├── directory/page.tsx   # mod signed-up users (20/page)
│   │           ├── profile/page.tsx     # edit own student card + resources
│   │           ├── proposals/page.tsx   # SUPER_ADMIN proposal roster
│   │           ├── blogs/page.tsx       # my posts
│   │           ├── blogs/[id]/edit/page.tsx
│   │           ├── review/page.tsx      # SUPER_ADMIN queue
│   │           └── students/page.tsx    # SUPER_ADMIN roster (CRUD later)
│   ├── components/
│   │   ├── layout/navbar.tsx
│   │   ├── layout/footer.tsx
│   │   ├── layout/site-shell.tsx
│   │   ├── directory/student-card.tsx
│   │   ├── directory/student-grid.tsx
│   │   ├── directory/profile-header.tsx
│   │   ├── directory/resource-list.tsx
│   │   ├── proposals/proposal-card.tsx
│   │   ├── proposals/vote-form.tsx
│   │   ├── proposals/vote-results.tsx
│   │   ├── blogs/blog-card.tsx
│   │   ├── blogs/blocknote-editor.tsx   # dynamic, ssr:false
│   │   ├── blogs/blocknote-viewer.tsx
│   │   ├── blogs/blog-status-badge.tsx
│   │   ├── faq/faq-list.tsx
│   │   ├── landing/hero.tsx
│   │   ├── landing/recent-insights.tsx
│   │   ├── landing/batch-preview.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   ├── env.ts
│   │   ├── slug.ts
│   │   ├── auth.ts                      # current user + role from Clerk + Prisma
│   │   ├── allowlist.ts
│   │   ├── queries/{students,blogs,faqs,resources,proposals}.ts
│   │   └── actions/{profile,blogs,review,access,students,proposals}.ts
│   └── app/api/webhooks/clerk/route.ts
└── public/
    ├── iimb-logo.png                    # already in repo (sunburst mark)
    ├── avatars/
    └── blogs/
```

Pages stay **Server Components**. `"use client"` only for: directory filter, BlockNote editor, admin forms, Clerk buttons, mobile nav sheet.

---

## Stack & commands

| Layer | Choice |
| --- | --- |
| App | Next 16 App Router, **Node** runtime (Prisma + Clerk webhooks) |
| UI | shadcn/ui new-york, Radix, zinc, primary = maroon |
| Auth | Clerk v7, `proxy.ts` + `auth.protect()` on `/admin` |
| DB | Neon Postgres |
| ORM | Prisma 7 + `@prisma/adapter-neon` |
| Editor | `@blocknote/core` `@blocknote/react` `@blocknote/mantine` (same as Ralevel) |
| Icons | lucide-react |

```bash
# Phase 1 data
npm install prisma @prisma/client dotenv
npm install @prisma/adapter-neon @neondatabase/serverless
npm install -D tsx

# Phase 2 UI
npx shadcn@latest init -d --base radix
npx shadcn@latest add button card input label textarea select badge avatar accordion separator skeleton sheet dropdown-menu tabs alert dialog sonner

# Phase 4–6 editor + auth
npm install @clerk/nextjs @blocknote/core @blocknote/react @blocknote/mantine @mantine/core @mantine/hooks
npm install svix   # Clerk webhook verification
```

Typography (Tailwind v4):

```bash
npm install @tailwindcss/typography
```

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

After `shadcn init`: in `@theme inline` use **literal** font names, not `var(--font-geist-sans)`. Keep font variables on `<html>`.

npm scripts:

```json
{
  "postinstall": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:deploy": "prisma migrate deploy",
  "db:seed": "prisma db seed",
  "db:studio": "prisma studio",
  "db:generate": "prisma generate"
}
```

Vercel build: `prisma generate && prisma migrate deploy && next build`.

`.gitignore` currently ignores `.env*`. Fix:

```gitignore
.env*
!.env.example
/src/generated
```

`.env.example`:

```bash
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/me
SUPER_ADMIN_EMAILS=vasumitragajbhiye20@gmail.com
```

Prisma v7 does not auto-load `.env`. First line of `prisma.config.ts`: `import "dotenv/config"`.

---

# Phase 1 — Neon, Prisma, seed

**Goal:** Typed data layer. No public UI yet besides the stock homepage.

### 1.1 Neon

Create a Neon project (Singapore `ap-southeast-1` or closest to Vercel `bom1`).

- Pooled (`-pooler`) → `DATABASE_URL`
- Direct → `DIRECT_URL`

### 1.2 `prisma.config.ts`

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
    directUrl: env("DIRECT_URL"),
  },
});
```

### 1.3 Schema

UUIDs as specified. `createdAt` / `updatedAt` and indexes. Both sides of every relation.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Track {
  DATA_SCIENCE
  ECONOMICS
}

enum Role {
  SUPER_ADMIN
  STUDENT
}

enum PostStatus {
  DRAFT
  IN_REVIEW
  CHANGES_REQUESTED
  PUBLISHED
}

enum FaqCategory {
  ADMISSIONS
  ACADEMICS
  CAMPUS_LIFE
}

model User {
  id        String   @id @default(uuid())
  clerkId   String   @unique
  email     String   @unique
  role      Role     @default(STUDENT)
  studentId String?  @unique
  student   Student? @relation(fields: [studentId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  reviewedBlogs Blog[] @relation("BlogReviewer")
}

model AllowedEmail {
  id        String   @id @default(uuid())
  email     String   @unique
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Student {
  id             String   @id @default(uuid())
  slug           String   @unique
  name           String
  track          Track
  bio            String?  @db.Text
  avatarUrl      String?
  hometown       String?
  previousSchool String?
  linkedinUrl    String?
  githubUrl      String?
  twitterUrl     String?
  instagramUrl   String?
  websiteUrl     String?
  email          String?  @unique
  isListed       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  blogs          Blog[]
  resources      Resource[]
  user           User?

  @@index([track])
  @@index([isListed])
}

model Resource {
  id          String   @id @default(uuid())
  title       String
  url         String
  description String?
  sortOrder   Int      @default(0)
  studentId   String
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([studentId, sortOrder])
}

model Blog {
  id            String     @id @default(uuid())
  slug          String     @unique
  title         String
  excerpt       String?
  content       Json       @default("[]")
  coverImageUrl String?
  tags          String[]
  status        PostStatus @default(DRAFT)
  reviewNote    String?    @db.Text
  submittedAt   DateTime?
  publishedAt   DateTime?
  reviewedAt    DateTime?
  authorId      String
  author        Student    @relation(fields: [authorId], references: [id], onDelete: Restrict)
  reviewedById  String?
  reviewedBy    User?      @relation("BlogReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([status, publishedAt])
  @@index([authorId])
}

model Faq {
  id        String      @id @default(uuid())
  question  String
  answer    String      @db.Text
  category  FaqCategory
  sortOrder Int         @default(0)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([category, sortOrder])
}
```

Notes:

- `Blog.content` is a BlockNote document (`Block[]`), not Markdown.
- `Blog.excerpt` — 160 chars for cards and OG. Admin can type it; otherwise first text block on submit.
- `Student.email` is confidential. Select it only in admin queries.
- `AllowedEmail.email` store **lowercase**. Compare with `email.toLowerCase()`.
- Do **not** use Clerk Organizations. Roles live in Prisma.

### 1.4 Prisma singleton — `src/lib/prisma.ts`

```ts
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Confirm the generated import path after `prisma generate`.

### 1.5 Migrate (not `db push`)

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 1.6 Seed

Idempotent upserts:

- 6 students (3 DS, 3 Eco), extra fields filled on some, empty on others, one without avatar
- 2 **link** resources on two different students (title + URL + optional description)
- 2 `PUBLISHED` blogs with a tiny valid BlockNote JSON body, 1 `IN_REVIEW`, 1 `DRAFT`
- 6 dummy FAQs (2 per category) — lorem that looks like real questions
- `AllowedEmail` for `vasumitragajbhiye20@gmail.com`
- Do **not** seed a `User` row (Clerk ids are unknown until first login)

Placeholder avatars in `public/avatars/`.

### 1.7 Constants — `src/lib/constants.ts`

```ts
export const SITE_NAME = "IIMB UG";
export const SITE_TAGLINE = "Inaugural undergraduate batch · Class of 2030";
export const OFFICIAL_UG_URL = "https://ug.iimb.ac.in";
export const LOGO_SRC = "/iimb-logo.png";
export const SUPER_ADMIN_EMAIL = "vasumitragajbhiye20@gmail.com";

export const TRACK_LABEL = {
  DATA_SCIENCE: "Data Science",
  ECONOMICS: "Economics",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Directory" },
  { href: "/proposals", label: "Proposals" },
  { href: "/blogs", label: "Blogs" },
  { href: "/gallery", label: "Gallery" },
  { href: "/faq", label: "FAQ" },
] as const;
```

Public nav: **Blogs** (`/blogs`), **Proposals**, **Gallery** (placeholder until Phase 8). No admin link in the public nav. Signed-in users see a grey avatar → `/me`; allowlisted Studio access still lives under `/admin` (Phase 6 gate).

### Definition of Done — Phase 1

- [ ] Neon pooled + direct URLs in `.env.local`
- [ ] `prisma migrate dev` created `init`
- [ ] Studio shows students, resources, blogs, dummy FAQs, one allowed email
- [ ] Prisma client uses Neon adapter + singleton
- [ ] `.env.example` committed; `.env.local` ignored

---

# Phase 2 — Global UI & routing skeleton

**Goal:** Chrome, maroon tokens, empty routes, Clerk provider **without** gating yet (keys can wait until Phase 6 if you prefer; adding the provider empty-safe is fine once keys exist).

### 2.1 Design

Light editorial. `--primary` = IIMB maroon, sampled against the red in `/iimb-logo.png`.

Navbar mark: `next/image` of `/iimb-logo.png` (sunburst only — pair it with the text **IIMB UG**). The PNG is a red mark; if the file has a dark/black matte, use a small height (~28–32px) and do not put a second black box around it. Footer: same mark, smaller.

Replace the `prefers-color-scheme` dark homepage so the first paint is light.

Source Serif 4 for article/profile H1.

### 2.2 Layout

- `metadataBase` from `NEXT_PUBLIC_SITE_URL`
- Title template `%s · IIMB UG`
- `ClerkProvider` wrapping the tree (Phase 6 if keys are not ready)
- `SiteShell`: Navbar + `<main className="flex-1">` + Footer
- Footer: unofficial student project + link to `ug.iimb.ac.in` + IIMB logo (small)

### 2.3 Navbar

Desktop links from `NAV_LINKS`. Mobile: shadcn `Sheet`. Active state via a small client `NavLinks`.

Auth chrome (once Clerk keys exist): **Sign in** button when signed out; when signed in, a grey profile avatar linking to `/me` (Clerk image if present, grey fallback otherwise). Sign-out via `UserButton` on `/me` for now. Full allowlist / Studio gate remains Phase 6.

### 2.4 Routes (placeholder `h1` is enough)

| URL | File |
| --- | --- |
| `/` | `src/app/page.tsx` (delete the Next starter) |
| `/directory` | `directory/page.tsx` |
| `/directory/[slug]` | `directory/[slug]/page.tsx` |
| `/proposals` | `proposals/page.tsx` |
| `/proposals/[slug]` | `proposals/[slug]/page.tsx` |
| `/blogs` | `blogs/page.tsx` |
| `/blogs/[slug]` | `blogs/[slug]/page.tsx` |
| `/gallery` | `gallery/page.tsx` |
| `/faq` | `faq/page.tsx` |
| `/me` | `me/page.tsx` — signed-in “edit my info” placeholder |
| `/sign-in/[[...sign-in]]` | Clerk `<SignIn />` (keys ready); else placeholder |
| `/admin` and nested | placeholders (includes `/admin/proposals`) |

`not-found.tsx` + `loading.tsx` for directory, blogs, proposals, gallery.

### 2.5 Assets

```bash
mkdir -p public/avatars public/blogs
```

Logo is already at `public/iimb-logo.png`. Do not add a second copy under `public/brand/`.

Naming: `/avatars/{slug}.jpg`, `/blogs/{slug}-cover.jpg`.

`next.config.ts`: no remote image hosts in v1.

### Definition of Done — Phase 2

- [ ] All public routes 200 with shared nav/footer (including `/proposals` placeholders)
- [ ] Mobile nav works
- [ ] Starter page gone; maroon primary visible on a Button
- [ ] Navbar shows `/iimb-logo.png` + **IIMB UG** text, linking to `/`

---

# Phase 2.5 — Proposals (voting)

**Goal:** Admins publish batch proposals; students open them, vote via a form, and see a printable results list (with anonymity options). **Runs after Phase 2 chrome, before Phase 3 Directory.**

Kickoff prompt:

```text
Implement Phase 2.5 from plan.md. Read plan.md first and follow that phase only.
Do not start Phase 3 until Phase 2.5's Definition of Done is checked off.
```

### Intent (locked at a high level; details in kickoff)

1. **Index** `/proposals` — list of proposals authored by admins.
2. **Detail** `/proposals/[slug]` — blog-like body explaining the proposal; vote form for students; results table/list at the bottom (who voted what), with an **anonymity** feature suitable for printing and submitting to the college.
3. **Admin** `/admin/proposals` — create / edit / close proposals (exact fields TBD).

### Open questions (resolve in the Phase 2.5 chat before coding schema)

- Who may vote: allowlisted signed-in students only vs public form (name/email) vs hybrid?
- Vote shape: yes/no, multi-choice, free-text, ranked — what fields does the college need?
- Anonymity: voter opt-in per ballot, admin toggle per proposal, or always anonymized on the public print view while admins see names?
- Does voting need Clerk first (Phase 6), or a no-auth form that Phase 6 later hardens?
- One vote per person — how enforced (student link, email OTP, honor system)?
- Print: browser print stylesheet vs dedicated `/proposals/[slug]/print` page vs export PDF?

### Phase 2 (done) scope for this feature

Placeholders only: public `/proposals`, `/proposals/[slug]`, `loading.tsx`, nav label **Proposals**, admin `/admin/proposals`. No Prisma models yet.

### Definition of Done — Phase 2.5

- [ ] Schema + migrate for proposals and votes (fields locked in kickoff)
- [ ] Admin can create/publish a proposal with a body
- [ ] Students can open a proposal and submit a vote
- [ ] Results list shows votes with anonymity behavior as locked
- [ ] Page is printable for college submission
- [ ] Unlisted / closed proposals behave as specified

---

# Phase 3 — Directory + profile pages

**Goal:** Networking hub + per-student page.

### 3.1 Queries

`getListedStudents()` — `where: { isListed: true }`, `orderBy: { name: "asc" }`. **Do not** `select` `email`.

`getStudentBySlug(slug)` — listed only; include `resources` (ordered) and published blogs (`status: PUBLISHED`, newest first, take 20). Missing/unlisted → `notFound()`.

### 3.2 `/directory`

Server page fetches students, passes to client `StudentGrid`:

- Search on `name` (and `slug`)
- Toggles: All · Data Science · Economics
- Grid `1 / 2 / 3 / 4` cols
- Empty: “No students match.”

`StudentCard`: `Card` + `Avatar` + track `Badge` (DS = maroon, Eco = outline). Social icons only if URL present (`Linkedin`, `Github`, `Twitter`, `Instagram`, `Globe`). **Whole card links to `/directory/[slug]`.**

### 3.3 `/directory/[slug]`

Await `params` (Next 16).

1. Header: avatar, name, track, hometown, previous school
2. Bio
3. Social row
4. **Writing** — `BlogCard` list or “No published pieces yet”
5. **Resources** — link list only: title, optional description, outbound URL (`rel="noopener noreferrer"`). Hide the section if empty. No files.

`generateMetadata`: title = name, description = first 160 of bio.

### Definition of Done — Phase 3

- [ ] Search + track filter
- [ ] Card click opens profile
- [ ] Profile shows published blogs + resources
- [ ] Unlisted slug 404s
- [ ] Email never appears in HTML

---

# Phase 4 — Public writing (`/blogs`)

**Goal:** Read published BlockNote posts. Editor is Phase 6.

### 4.1 Viewer

Dynamic import, `ssr: false`, same pattern as Ralevel:

```ts
export const BlockNoteViewer = dynamic(() => import("./blocknote-viewer"), { ssr: false });
```

`resolveInitialContent` — empty/invalid array → `undefined` (BlockNote rejects `[]`).

Wrap viewer in a readable column. Isolate BlockNote/Mantine CSS under `.bn-notion-editor` so it does not restyle the rest of the site. Copy `blocknote-notion.css` ideas from Ralevel; restyle to maroon/zinc.

### 4.2 Queries

`getPublishedBlogs()` — `PUBLISHED`, `publishedAt desc`, include `author` (no email).

`getBlogBySlug(slug)` — published only, else `notFound()`.

### 4.3 Index + article

Index cards: cover (16/9), title, excerpt, author name + track, date `en-IN`. Link to `/blogs/[slug]`. Author name also links to their profile.

Article: cover, serif title, author badge (link to profile), tags, BlockNote body, “More from the batch”.

`params` is a Promise. `generateMetadata` uses excerpt + cover or default OG.

### Definition of Done — Phase 4

- [ ] Only `PUBLISHED` posts list
- [ ] Draft / in-review slugs 404 for anonymous users
- [ ] Seed BlockNote JSON renders
- [ ] Author links to `/directory/[slug]`

---

# Phase 5 — Landing + dummy FAQ

**Goal:** Simple home + a FAQ that already looks good. No visual overhaul.

### 5.1 `/`

1. **Hero** — Welcome to the inaugural IIMB UG batch. One short paragraph (programmes, Jigani, August 2026). CTAs: Directory (primary), Blogs (secondary). Student-run, not official.
2. **Recent insights** — 3 latest published posts. Hide section if zero.
3. **Batch preview** — up to 8 listed avatars → `/directory`.

Do not dump curriculum. Optional one-line track cards that link to official IIMB pages.

### 5.2 `/faq`

Fetch seeded dummy FAQs, group by category, shadcn `Accordion` (`type="single"` `collapsible`). Looks finished; copy is placeholder. Super-admin can edit later (out of v1 admin unless it is cheap to add a textarea on `/admin` — **skip FAQ CMS in v1**).

### Definition of Done — Phase 5

- [ ] Home has hero + posts + avatars
- [ ] FAQ accordion is keyboard-accessible and not empty

---

# Phase 6 — Clerk, allowlist, studio, BlockNote, review

**Goal:** The actual publishing product.

### 6.1 Clerk application

New Clerk app `iimb-ug` (CLI or Dashboard). **Do not** share Ralevel keys.

Dashboard:

- Google + email code
- **Leave public sign-up enabled** so arbitrary accounts can appear in `/admin/directory`. Identity is Google/email; **authorization** is our `AllowedEmail` table
- Paths: `/sign-in`
- Production domain later: `iimb-ug.vasumitragajbhiye.com`

Install `@clerk/nextjs`. `ClerkProvider` in `layout.tsx`. Sign-in page with `<SignIn />`. Theme Clerk to zinc + maroon (shadcn appearance).

### 6.2 `src/proxy.ts` (public-first)

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/me(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

`/admin/forbidden` is still under `/admin` so it requires sign-in — that is correct. Webhook routes under `/api/webhooks` stay public (not in the protected matcher).

### 6.3 Sync Clerk → Prisma

Webhook `user.created` / `user.updated` / `user.deleted`:

- Verify with `verifyWebhook` from `@clerk/nextjs/webhooks` (`CLERK_WEBHOOK_SIGNING_SECRET`)
- Upsert `User` on `clerkId`
- Email = primary email, lowercase
- If email is in `SUPER_ADMIN_EMAILS` → `role = SUPER_ADMIN`
- Else if in `AllowedEmail` → `role` from that row (usually `STUDENT`)
- Else still upsert `User` (they signed in) but they fail the allowlist gate
- Auto-link: if `Student.email` matches, set `User.studentId`

Also upsert on first `/admin` **and** `/me` hit (`ensureUser()`) so local dev works before the webhook is tunneled and Directory captures sign-ups that only visit `/me`.

### 6.4 Allowlist gate — `src/lib/auth.ts`

```
await auth() → clerk userId
load User
if email not in AllowedEmail AND not super-admin → redirect /admin/forbidden
```

Super-admin emails are always treated as allowed (seed + env), even if someone deletes the row.

Studio shell uses a route group so forbidden is ungated by allowlist:

- `admin/layout.tsx` — thin (no allowlist)
- `admin/forbidden` — signed-in, not allowlisted
- `admin/(studio)/layout.tsx` — `requireAllowlisted()` + left sidebar

| Nav | Who |
| --- | --- |
| Access (first) | mods (`SUPER_ADMIN`) |
| Directory | mods (`SUPER_ADMIN`) |
| Home (dashboard) | all allowlisted |
| My profile / writing / review / students / proposals | later Phase 6 (placeholders stay unlinked for now) |

Navbar public: grey avatar → `/me` when signed in (UserButton on `/me`).

### 6.5 Access UI — `/admin/access`

Mods only. Table of `AllowedEmail`. Add email (lowercase, Zod email) + role `STUDENT` | `SUPER_ADMIN` (UI label **Mod**). Remove / change role for non-env rows. **Cannot remove or demote emails in `SUPER_ADMIN_EMAILS`.**

This is how you grant Studio entry (`STUDENT`) or mod powers (`SUPER_ADMIN`). Later you paste official batch emails here and set `Student.email` on `/admin/students`.

### 6.5b Admin Directory — `/admin/directory`

Mods only. Paginated table (20/page) of Prisma `User` (everyone who signed up via Clerk). Columns: email, name and course from linked `Student` (or `—` placeholders until they fill `/me` / profile), signed-up date. Not the public `/directory` grid (Phase 3).

### 6.6 Profile edit — `/admin/profile`

Linked student only (super-admin can also use `/admin/students`).

Fields matching public card + private email (email change = relink risk; super-admin should edit email on the roster). Resources: add/remove **links** (title + URL + optional description). No uploads.

Server actions: **student can only update `where: { id: session.studentId }`.** Never trust `studentId` from the client.

### 6.7 BlockNote editor (Ralevel-like, simpler)

`/admin/blogs` — list **my** posts (super-admin: filter mine / all). Status badge: Draft, In review, Changes requested, Published.

`/admin/blogs/[id]/edit` — client editor:

- Untitled-style **title** at top
- Cover URL + excerpt + tags (popover or side fields, like Ralevel details popover)
- BlockNote (`theme="light"`, slash menu, headings, lists, quotes, links, images-as-URL)
- Buttons: **Save draft** · **Submit for review**
- If `CHANGES_REQUESTED`, show `reviewNote` banner (Ralevel pattern)
- If `IN_REVIEW`, lock editing or allow save-only without resubmit — **lock content edits until changes requested or approved**, to match a real review queue
- Autosave is nice-to-have; v1 explicit Save is enough

Store `editor.document` as `Blog.content` JSON.

Submit:

- `DRAFT` or `CHANGES_REQUESTED` → `IN_REVIEW`, set `submittedAt`
- Generate slug from title on first submit if empty (`slugify`, unique suffix)
- `revalidatePath` is not needed until publish

New post: server action creates `DRAFT` with `authorId = session.studentId` and redirects to edit. Super-admin must pick an author if they write on behalf of someone — for v1 super-admin posts are authored by **their linked student row** (create a Student for yourself in seed).

### 6.8 Review queue — `/admin/review`

Super-admin. List `IN_REVIEW`. Open read-only BlockNote viewer + **Approve** / **Request changes** (note required, max ~3000 chars) — same UX as `BlogReviewActions` in Ralevel.

Approve:

- `status = PUBLISHED`
- `publishedAt = now()` if null (keep original date on re-approve of updates — v1 has no separate “update review”; edits to published posts: **new draft layer skipped**. v1 rule: published posts become `DRAFT` on edit and must be re-submitted. Live page keeps old content until re-approval. Simplest implementation: editing a published post sets status back to `DRAFT` and **does not** change live `content` until approve overwrites it.

To avoid a two-layer snapshot (Ralevel’s `draft` + `pendingReview`):

**v1 content model:** one `content` JSON column.

- While `PUBLISHED`, Save draft is disabled; “Create revision” copies the row’s content into a new `DRAFT` **child**? Too heavy.

**Simpler v1:** published posts are frozen. To change them, super-admin can still edit and the live page updates only after Approve. Writer clicking Save on a published post is blocked; they click “Submit update” which sets `IN_REVIEW` without unpublishing. Approve overwrites live content.

Lock:

- `PUBLISHED` + writer: read-only with “Submit update for review”
- Super-admin Approve on an already-published in-review update: overwrite `content`, keep `publishedAt`

Skip Ralevel version history, preview tokens, comments, likes.

After approve:

```ts
revalidatePath("/blogs");
revalidatePath(`/blogs/${slug}`);
revalidatePath("/");
revalidatePath(`/directory/${authorSlug}`);
revalidateTag("blogs", "max"); // only if queries use cacheTag
```

### 6.9 Roster — `/admin/students`

Super-admin CRUD for student cards (including `email` and `isListed`). Linking: set email → next login attaches `User.studentId`.

### Definition of Done — Phase 6

- [ ] Unsigned `/admin` → Clerk sign-in
- [ ] Signed-in but not allowlisted → `/admin/forbidden`
- [ ] Super-admin adds an email; that Google account reaches Studio
- [ ] Linked student edits only their profile
- [ ] BlockNote save + submit
- [ ] Public `/blogs` unchanged until Approve
- [ ] Request changes shows the note in the editor
- [ ] Webhook or `ensureUser` creates `User`

---

# Phase 7 — SEO, subdomain, polish

**Goal:** Live at `iimb-ug.vasumitragajbhiye.com`.

### 7.1 Metadata

- Root metadata + per-route titles
- Blog + profile `generateMetadata`
- Default `opengraph-image.tsx`: maroon, IIMB UG, tagline
- `sitemap.ts` / `robots.ts` using `NEXT_PUBLIC_SITE_URL`

### 7.2 Deploy

1. GitHub + Vercel project.
2. Env: Neon URLs, Clerk **production** keys, `CLERK_WEBHOOK_SECRET`, `SUPER_ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL=https://iimb-ug.vasumitragajbhiye.com`.
3. Build: `prisma generate && prisma migrate deploy && next build`.
4. DNS: CNAME `iimb-ug` on `vasumitragajbhiye.com` → Vercel.
5. Clerk: add production domain + Google redirect URIs.
6. Clerk webhook endpoint: `https://iimb-ug.vasumitragajbhiye.com/api/webhooks/clerk`.

### 7.3 Light polish (not a redesign)

- Skeletons, 404 copy, favicon `icon.tsx` (“UG”)
- `@vercel/analytics`
- WhatsApp/LinkedIn OG check on one post

### Definition of Done — Phase 7

- [ ] Subdomain serves Home, Directory, profile, Blogs, Proposals, FAQ
- [ ] Clerk production sign-in works
- [ ] Approve on production appears on `/blogs` without redeploy
- [ ] OG image on share

---

# Phase 8 — Gallery

**Goal:** Last public content page — batch photo gallery at `/gallery`. Placeholder exists from Phase 2; implement last (after SEO/deploy is fine, or just before polish).

Kickoff:

```text
Implement Phase 8 from plan.md. Read plan.md first and follow that phase only.
```

Details TBD in that chat (upload strategy, albums, captions). Do not invent an image CDN in earlier phases.

### Definition of Done — Phase 8

- [ ] `/gallery` shows real batch photos (not placeholder)
- [ ] Works on mobile; images use local/`public` or a locked upload plan

---

## Out of scope (v1)

- Cloudflare R2 / Cloudinary / Vercel Blob uploads
- Google Docs paste pipeline (replaced by BlockNote)
- FAQ CMS
- Comments, likes, RSS, newsletter
- Individual Clerk Organizations / IIMB SSO
- Dark mode toggle
- File-type resources (v1 is URL links only)
- Ralevel blog version history / preview tokens
- Visual landing redesign (“make it aesthetic later”)

---

## Suggested order inside a phase

1. Schema / queries / auth helpers
2. Server page that renders data
3. Presentational component
4. Client island
5. Empty / loading / not-found
6. Metadata

---

## Risks

| Risk | Mitigation |
| --- | --- |
| Sharing Ralevel Clerk keys | New Clerk application |
| Random Google accounts in Clerk | Disable sign-up; allowlist gate still required |
| Student A edits student B | Actions keyed to `session.studentId` only |
| Email leaked on profile | Never `select` email in public queries |
| Prisma 7 without adapter | Always `PrismaNeon` |
| Next 16 `params` | Always `await params` |
| `revalidateTag(tag)` TS error | Second arg `"max"` |
| BlockNote `[]` crash | `resolveInitialContent` |
| Mantine CSS leaks | Scope under `.bn-notion-editor` |
| Logo / trademark | Student-run disclaimer; you confirmed logo use |
| Self-publish bypass | No `PUBLISHED` write from student actions |

---

## Phase status

| Phase | Status |
| --- | --- |
| 1 Neon & Prisma | Done (see `docs/phase-1-report.md`) |
| 2 Global UI & skeleton | Done (see `docs/phase-2-report.md`) — Clerk Sign in + `/me` + Gallery placeholder added after |
| 2.5 Proposals (voting) | Not started — placeholders in Phase 2; full feature next |
| 3 Directory & profiles | Not started |
| 4 Public blogs (viewer) | Not started |
| 5 Landing & dummy FAQ | Not started |
| 6 Clerk studio, BlockNote, review | Partial — Sign in / `/me` chrome early; allowlist + studio still here |
| 7 SEO & `iimb-ug.vasumitragajbhiye.com` | Not started |
| 8 Gallery | Not started — last content page |
