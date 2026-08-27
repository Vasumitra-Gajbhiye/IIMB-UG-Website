# Phase 1 report — Neon, Prisma, seed

**Date:** 2026-08-27  
**Scope:** Phase 1 only from `plan.md` (Neon + Prisma 7 + migrate + seed + constants).  
**Not started:** Phase 2 (shadcn, chrome, routes, Clerk provider).

---

## Summary

Phase 1 wired a typed Postgres data layer on Neon (Singapore `ap-southeast-1`) using Prisma ORM **7.10.0**, the Neon serverless adapter, an `init` migration, and an idempotent seed. The stock Next.js homepage was left unchanged. No public UI, auth, or admin work was done.

---

## What shipped

| Item | Path / note |
| --- | --- |
| Env template | `.env.example` (Clerk placeholders empty; site URL + super-admin listed) |
| Local secrets | `.env` and `.env.local` (both gitignored; same pooled + direct URLs) |
| Prisma config | `prisma.config.ts` — loads `.env` then `.env.local`, seed via `tsx prisma/seed.ts` |
| Schema | `prisma/schema.prisma` — models/enums as specified |
| Migration | `prisma/migrations/20260827012112_init/` |
| Client singleton | `src/lib/prisma.ts` — `PrismaNeon` + global singleton |
| Constants | `src/lib/constants.ts` — site name, tagline, nav, tracks, super-admin email |
| Seed | `prisma/seed.ts` — upserts; does **not** seed `User` |
| Avatars | `public/avatars/placeholder-{1..5}.svg` |
| Gitignore | `!.env.example`, `/src/generated` |
| npm scripts | `postinstall`, `db:*`, build = `prisma generate && prisma migrate deploy && next build` |

### Packages installed

- `prisma@7.10.0`, `@prisma/client@7.10.0`
- `@prisma/adapter-neon`, `@neondatabase/serverless`
- `dotenv`, `tsx` (dev)

npm initially resolved `prisma` to an 8.x RC; it was pinned back to **7.10.0** to match the locked stack.

---

## Database / env

- `DATABASE_URL` → Neon **pooled** (`-pooler`) host — used by Prisma Client / adapter  
- `DIRECT_URL` → Neon **direct** (non-pooler) host — used for migrations via `prisma.config.ts`  
- Region: `ap-southeast-1` (Singapore), suitable for a later Vercel `bom1` deploy  

DoD asked for `.env.local`; URLs were copied from `.env` into `.env.local`. Neither file is committed. No connection strings or passwords appear in this report.

`prisma.config.ts` loads both `.env` and `.env.local` (override) because Prisma CLI does not auto-load Next.js env files. That is a small intentional deviation from the one-line `import "dotenv/config"` snippet in the plan.

Vercel env push / project link was **not** done in this phase. The build script is ready for when Phase 7 deploys.

---

## Migration and generate

```bash
npx prisma migrate dev --name init
npx prisma generate
```

- Migration applied: `20260827012112_init`
- Client generated to `./src/generated/prisma` (gitignored)

### Confirmed client import path

Prisma 7 emits `client.ts` under the output directory. Imports use:

```ts
import { PrismaClient } from "@/generated/prisma/client";
```

(not bare `@/generated/prisma`). Same path is used in `src/lib/prisma.ts` and `prisma/seed.ts`.

---

## Seed results (verified)

Idempotent upserts / find-first updates. Counts after `npx prisma db seed`:

| Table | Count | Notes |
| --- | ---: | --- |
| `Student` | 6 | 3 `DATA_SCIENCE`, 3 `ECONOMICS`; 1 with `avatarUrl: null` |
| `Resource` | 2 | Link-only; on two different students |
| `Blog` | 4 | 2 `PUBLISHED`, 1 `IN_REVIEW`, 1 `DRAFT`; tiny BlockNote JSON bodies |
| `Faq` | 6 | 2 per `ADMISSIONS` / `ACADEMICS` / `CAMPUS_LIFE` |
| `AllowedEmail` | 1 | `vasumitragajbhiye20@gmail.com`, role `SUPER_ADMIN` |
| `User` | 0 | Intentionally not seeded (Clerk ids unknown) |

Studio was not left running in this session; row counts were verified with Prisma Client queries against the same Neon database Studio would show.

---

## Spec deviations (documented)

1. **dotenv loading** — `prisma.config.ts` and seed load `.env` + `.env.local` explicitly instead of only `import "dotenv/config"`.
2. **Import path** — `@/generated/prisma/client` instead of `@/generated/prisma` because of Prisma 7.10 output layout.
3. **Prisma version pin** — forced `prisma@7` / `@prisma/client@7` after npm pulled an 8 RC.
4. **`directUrl` removed in Prisma 7 config** — plan.md shows `datasource.url` + `directUrl`. Prisma 7.10 types only allow `url` (and optional `shadowDatabaseUrl`). Config uses `url: env("DIRECT_URL")` for CLI/migrations; runtime singleton still uses pooled `DATABASE_URL`. Both env vars remain in `.env.example` / `.env.local`.

No other Phase 1 scope changes.

---

## Definition of Done — Phase 1

- [x] Neon pooled + direct URLs in `.env.local`
- [x] `prisma migrate dev` created `init`
- [x] DB shows students, resources, blogs, dummy FAQs, one allowed email (verified via queries)
- [x] Prisma client uses Neon adapter + singleton
- [x] `.env.example` committed (ready); `.env` / `.env.local` ignored

---

## Explicitly not done (later phases)

- shadcn / maroon tokens / navbar / footer  
- Public routes (`/directory`, `/blogs`, `/faq`, …)  
- Clerk application, `proxy.ts`, admin gating  
- BlockNote editor packages  
- Vercel project link, production env sync, domain  

Phase 1 is complete. Ready for Phase 2 when kicked off from `plan.md`.
