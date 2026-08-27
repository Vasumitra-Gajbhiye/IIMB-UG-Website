# Phase 2 report — Global UI and routing skeleton

**Date:** 2026-08-27  
**Scope:** Phase 2 only from `plan.md` (shadcn, maroon tokens, SiteShell, placeholder routes).  
**Not started:** Phase 3+ (directory data, blogs viewer, landing copy, Clerk gating, BlockNote, SEO).

---

## Summary

Phase 2 replaced the create-next-app homepage with a light editorial chrome: IIMB maroon primary, Geist + Source Serif 4, shared navbar/footer, and placeholder pages for every public and admin route.

**Follow-up (same phase chrome):** Clerk keys were added to `.env`, so Sign in was wired early — `ClerkProvider`, `src/proxy.ts` (protects `/me` only), navbar **Sign in** → grey avatar → `/me`, real `<SignIn />` at `/sign-in`. Nav label **Writing** renamed to **Blogs**. **Gallery** and **Proposals** placeholders + `/me` added. Allowlist / Studio gate / BlockNote remain Phase 6 / 2.5+.

---

## What shipped

| Item | Path / note |
| --- | --- |
| shadcn init | `components.json` — Radix base (`radix-nova` style, neutral palette) |
| UI primitives | `src/components/ui/*` — button, card, input, label, textarea, select, badge, avatar, accordion, separator, skeleton, sheet, dropdown-menu, tabs, alert, dialog, sonner |
| `cn` helper | `src/lib/utils.ts` |
| Tokens / CSS | `src/app/globals.css` — light-first, `--iimb-maroon`, primary/ring/sidebar-primary mapped to maroon; typography plugin; literal font names in `@theme` |
| Root layout | `src/app/layout.tsx` — Geist, Geist Mono, Source Serif 4; `metadataBase` + `%s · IIMB UG`; `ClerkProvider` + `SiteShell` |
| Clerk | `@clerk/nextjs`; `src/proxy.ts` protects `/me`; fallback redirect `/me` |
| Auth chrome | `src/components/layout/auth-nav.tsx` — Sign in / grey avatar → `/me` |
| Chrome | `src/components/layout/{site-shell,navbar,nav-links,mobile-nav,footer,auth-nav}.tsx` |
| Public pages | `/`, `/directory`, `/directory/[slug]`, `/proposals`, `/proposals/[slug]`, `/blogs`, `/blogs/[slug]`, `/gallery`, `/faq`, `/me`, `/sign-in/[[...sign-in]]` |
| Admin placeholders | `/admin` + forbidden, profile, blogs, blogs/[id]/edit, review, students, access, proposals |
| Loading / 404 | `directory/loading.tsx`, `blogs/loading.tsx`, `proposals/loading.tsx`, `gallery/loading.tsx`, `not-found.tsx` |
| Assets | `public/blogs/.gitkeep`; removed unused starter SVGs |
| Logo | Navbar + footer use `/iimb-logo.png` at small height; wordmark **IIMB UG** |

### Packages installed

- shadcn CLI dependencies (Radix unified `radix-ui`, CVA, `clsx`, `tailwind-merge`, `lucide-react`, `sonner`, `tw-animate-css`, `class-variance-authority`, `shadcn` package)
- `@tailwindcss/typography`
- `@clerk/nextjs` (wired early once keys existed in `.env`)

---

## Design decisions

- **Light only:** removed `prefers-color-scheme` dark homepage. `.dark` token block remains unused (no toggle in v1).
- **Maroon primary:** `--iimb-maroon: oklch(0.42 0.16 20)` → `--primary`, `--ring`, `--sidebar-primary`.
- **Fonts:** `@theme inline` uses literal `"Geist"` / `"Geist Mono"` / `"Source Serif 4"` names (Tailwind v4 parse-time rule). CSS variables from `next/font` stay on `<html>`.
- **Navbar:** desktop `NavLinks`; mobile Sheet; **Sign in** / grey avatar → `/me`. Labels: Directory, Proposals, Blogs, Gallery, FAQ.
- **Footer:** student-run disclaimer + link to `https://ug.iimb.ac.in`.
- **Dynamic routes:** `await params` (Next 16). No Prisma fetches on placeholder pages.
- **Images:** `next.config.ts` unchanged — local only, no remote hosts.
- **Clerk scope now:** Sign in + `/me` only. `/admin` still ungated (allowlist Phase 6). No webhook yet (`CLERK_WEBHOOK_SECRET` empty).

---

## Spec deviations (documented)

1. **Clerk early** — originally deferred to Phase 6; keys appeared in `.env`, so provider + Sign in + `/me` were added to Phase 2 chrome. Studio/allowlist/BlockNote still Phase 6.
2. **shadcn style** — CLI defaults produced `radix-nova` + `neutral` base (not the older “new-york / zinc” wording in plan.md).
3. **Nav label** — public label is **Blogs** (not “Writing”); URL stays `/blogs`.
4. **Gallery** — placeholder now; full build is Phase 8 (last content page).

---

## Verification (HTTP)

All of these returned **200** with shared chrome (re-check after Clerk restart):

`/`, `/directory`, `/proposals`, `/blogs`, `/gallery`, `/faq`, `/sign-in`, `/admin`, …

`/me` requires sign-in (Clerk `auth.protect`). `/this-does-not-exist` → **404**.

---

## Definition of Done — Phase 2

- [x] All public routes 200 with shared nav/footer (including `/proposals`, `/gallery` placeholders)
- [x] Mobile nav markup present (Sheet trigger)
- [x] Starter page gone; maroon primary visible on a Button (`bg-primary`)
- [x] Navbar shows `/iimb-logo.png` + **IIMB UG** text, linking to `/`
- [x] Sign in button when signed out; grey avatar → `/me` when signed in
- [x] `/me` and `/gallery` placeholders
- [x] Nav label **Blogs** (not Writing)

---

## Explicitly not done (later phases)

- **Proposals body + voting + print** (Phase 2.5 — next)
- Directory search/filter + Prisma student cards (Phase 3)
- BlockNote viewer / published blogs (Phase 4)
- Landing hero + FAQ accordion content (Phase 5)
- Allowlist gate, Studio nav, BlockNote editor, review queue, webhooks (Phase 6)
- SEO, OG, sitemap, production domain (Phase 7)
- **Gallery content** (Phase 8 — last)

Phase 2 chrome is complete. Next: Phase **2.5** from `plan.md`, then Phase 3.
