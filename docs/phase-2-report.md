# Phase 2 report — Global UI and routing skeleton

**Date:** 2026-08-27  
**Scope:** Phase 2 only from `plan.md` (shadcn, maroon tokens, SiteShell, placeholder routes).  
**Not started:** Phase 3+ (directory data, blogs viewer, landing copy, Clerk gating, BlockNote, SEO).

---

## Summary

Phase 2 replaced the create-next-app homepage with a light editorial chrome: IIMB maroon primary, Geist + Source Serif 4, shared navbar/footer, and placeholder pages for every public and admin route. Clerk was **not** installed — keys are empty and Phase 2 allows deferring the provider until Phase 6. `/sign-in` exists as a plain placeholder so the URL returns 200.

---

## What shipped

| Item | Path / note |
| --- | --- |
| shadcn init | `components.json` — Radix base (`radix-nova` style, neutral palette) |
| UI primitives | `src/components/ui/*` — button, card, input, label, textarea, select, badge, avatar, accordion, separator, skeleton, sheet, dropdown-menu, tabs, alert, dialog, sonner |
| `cn` helper | `src/lib/utils.ts` |
| Tokens / CSS | `src/app/globals.css` — light-first, `--iimb-maroon`, primary/ring/sidebar-primary mapped to maroon; typography plugin; literal font names in `@theme` |
| Root layout | `src/app/layout.tsx` — Geist, Geist Mono, Source Serif 4; `metadataBase` + `%s · IIMB UG`; `SiteShell`; **no** `ClerkProvider` |
| Chrome | `src/components/layout/{site-shell,navbar,nav-links,mobile-nav,footer}.tsx` |
| Public pages | `/`, `/directory`, `/directory/[slug]`, `/proposals`, `/proposals/[slug]`, `/blogs`, `/blogs/[slug]`, `/faq`, `/sign-in/[[...sign-in]]` |
| Admin placeholders | `/admin` + forbidden, profile, blogs, blogs/[id]/edit, review, students, access, **proposals** |
| Loading / 404 | `directory/loading.tsx`, `blogs/loading.tsx`, `proposals/loading.tsx`, `not-found.tsx` |
| Assets | `public/blogs/.gitkeep`; removed unused starter SVGs (`next.svg`, `vercel.svg`, etc.) |
| Logo | Navbar + footer use `/iimb-logo.png` at small height; wordmark **IIMB UG** |

### Packages installed

- shadcn CLI dependencies (Radix unified `radix-ui`, CVA, `clsx`, `tailwind-merge`, `lucide-react`, `sonner`, `tw-animate-css`, `class-variance-authority`, `shadcn` package)
- `@tailwindcss/typography`

---

## Design decisions

- **Light only:** removed `prefers-color-scheme` dark homepage. `.dark` token block remains unused (no toggle in v1).
- **Maroon primary:** `--iimb-maroon: oklch(0.42 0.16 20)` → `--primary`, `--ring`, `--sidebar-primary`.
- **Fonts:** `@theme inline` uses literal `"Geist"` / `"Geist Mono"` / `"Source Serif 4"` names (Tailwind v4 parse-time rule). CSS variables from `next/font` stay on `<html>`.
- **Navbar:** desktop `NavLinks` (client, active via `usePathname`); mobile shadcn `Sheet`. Includes **Proposals**. No Studio / Sign-in / `UserButton` (Phase 6).
- **Footer:** student-run disclaimer + link to `https://ug.iimb.ac.in`.
- **Dynamic routes:** `await params` (Next 16). No Prisma fetches on placeholder pages.
- **Images:** `next.config.ts` unchanged — local only, no remote hosts.

---

## Spec deviations (documented)

1. **Clerk deferred** — plan allows skipping `ClerkProvider` until keys exist. No `@clerk/nextjs`, no `proxy.ts`, no `<SignIn />`. `/sign-in` is a static placeholder.
2. **shadcn style** — CLI defaults produced `radix-nova` + `neutral` base (not the older “new-york / zinc” wording in plan.md). Zinc-like neutrals + maroon primary still match the locked design intent.
3. **Browser automation** — no browser MCP in this session. Routes verified with HTTP fetches against the running `next dev` on port 3000 (HTML contains nav, maroon `bg-primary` button, logo, footer disclaimer; unknown paths return 404 with not-found copy). Mobile Sheet open/close was not click-tested in a real viewport; the Sheet trigger and nav markup are present in the HTML.

---

## Verification (HTTP)

All of these returned **200** with shared chrome:

`/`, `/directory`, `/directory/test-slug`, `/proposals`, `/proposals/test-slug`, `/blogs`, `/blogs/test-slug`, `/faq`, `/sign-in`, `/admin`, `/admin/forbidden`, `/admin/profile`, `/admin/blogs`, `/admin/blogs/abc/edit`, `/admin/review`, `/admin/students`, `/admin/access`, `/admin/proposals`

`/this-does-not-exist` → **404** (“Page not found”).

Home HTML includes: `IIMB UG`, `iimb-logo`, `Browse directory`, `bg-primary`, student-run disclaimer, `ug.iimb.ac.in`. Starter “Create Next App” / `next.svg` gone. `tsc --noEmit` clean.

---

## Definition of Done — Phase 2

- [x] All public routes 200 with shared nav/footer (including `/proposals` placeholders)
- [x] Mobile nav markup present (Sheet trigger); full viewport click not automated here
- [x] Starter page gone; maroon primary visible on a Button (`bg-primary`)
- [x] Navbar shows `/iimb-logo.png` + **IIMB UG** text, linking to `/`
- [x] Proposals placeholders: `/proposals`, `/proposals/[slug]`, nav link, `/admin/proposals` (full feature = Phase 2.5)

---

## Proposals note (added after initial Phase 2 ship)

Placeholder routes and nav were added so Phase **2.5** can implement voting before Directory (Phase 3). No Prisma models or vote forms yet — see `plan.md` Phase 2.5 open questions.

---

## Explicitly not done (later phases)

- **Proposals body + voting + print** (Phase 2.5 — next)
- Directory search/filter + Prisma student cards (Phase 3)
- BlockNote viewer / published blogs (Phase 4)
- Landing hero + FAQ accordion content (Phase 5)
- Clerk app, `ClerkProvider`, `proxy.ts`, allowlist gate, Studio auth UI (Phase 6)
- SEO, OG, sitemap, production domain (Phase 7)

Phase 2 is complete (placeholders include Proposals). Next: Phase **2.5** from `plan.md`, then Phase 3.
