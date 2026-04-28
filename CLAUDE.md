# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Next.js dev server with Turbopack on port 3000
- `npm run build` — production build
- `npm start` — run the built app
- `npm run lint` — `next lint`

There is no test runner configured.

## Architecture

GoCart is a Next.js 15 (App Router) + React 19 multi-vendor e-commerce frontend, styled with Tailwind CSS v4 (`@tailwindcss/postcss`). State is managed with Redux Toolkit.

### Route groups

[app/](app/) is split into three top-level surfaces, each with its own `layout.jsx`:
- [app/(public)/](app/(public)/) — customer storefront (home, `shop`, `product`, `cart`, `orders`, `pricing`, `create-store`). The `(public)` segment is a route group, so URLs are not prefixed.
- [app/store/](app/store/) — vendor dashboard (`add-product`, `manage-product`, `orders`).
- [app/admin/](app/admin/) — platform admin panel (`approve`, `coupons`, `stores`).

The matching layout components live in [components/admin/](components/admin/) and [components/store/](components/store/) (sidebar/navbar shells), while shared storefront components are at the top level of [components/](components/).

### Redux store

The store is created per-request via [`makeStore`](lib/store.js) and provided through the client component [app/StoreProvider.js](app/StoreProvider.js), which is mounted in the root [app/layout.jsx](app/layout.jsx). Slices live under [lib/features/](lib/features/): `cart`, `product`, `address`, `rating`. Slices currently seed their state from dummy data in [assets/assets.js](assets/assets.js) — there is no data fetching layer wired up yet.

### Data model

The persistence layer is being built on **Supabase** (Postgres + Auth + Storage + Realtime), not Prisma. Source-of-truth schema lives in [supabase/migrations/](supabase/migrations/) — the original [prisma/schema.prisma](prisma/schema.prisma) was the translation source and is no longer authoritative. Supabase clients are at [lib/supabase/client.js](lib/supabase/client.js) (browser) and [lib/supabase/server.js](lib/supabase/server.js) (server components / route handlers). At the time of writing, RLS policies are commented out in the migration — Phase 1 of the roadmap adds them; until then the UI still reads dummy data from [assets/assets.js](assets/assets.js).

### Roadmap

A phased MVP roadmap (Phase 0 → Phase 9, including locked architecture decisions, deferrals, and verification) lives at `~/.claude/plans/this-is-a-multi-jiggly-galaxy.md`. Read it before starting any non-trivial work to know what phase you're in and what's intentionally deferred (e.g., socket.io is dropped in favor of Supabase Realtime; Stripe is deprioritized in favor of Paystack).

### Conventions

- Path alias `@/*` resolves to the repo root (see [jsconfig.json](jsconfig.json)). Use `@/components/...`, `@/lib/...`, `@/assets/...`.
- `NEXT_PUBLIC_CURRENCY_SYMBOL` (default `$`) is the only env var used by the client; see [.env.example](.env.example).
- Images are served unoptimized ([next.config.mjs](next.config.mjs)) — don't expect `next/image` optimization to apply.
- Font is Outfit via `next/font/google`, applied at the root layout.
- Toast notifications use `react-hot-toast` (mounted once in the root layout).
