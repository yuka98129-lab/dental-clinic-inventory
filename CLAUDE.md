# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project status

The full MVP scope is documented in `requirements.md` (Japanese, source of truth) and the original 3-week plan is at `/Users/macintosh/.claude/plans/merry-discovering-spring.md`. **Current build order deviates from that plan**: by explicit decision, only the inventory list + low-stock alert feature (F-08, plus minimal manual quantity update) is being built first. Staff login (F-01), patients, appointments, treatment logging, and purchase orders are intentionally deferred — do not add them unless asked.

## What this project is

A lightweight, self-hosted system for a single dental clinic combining **appointment scheduling** and **consumable inventory management**. It explicitly excludes accounting/insurance-billing (レセコン) integration and patient-facing online features (deferred to a future version).

## Stack

- **Next.js** (App Router, TypeScript) + **Tailwind CSS** + **shadcn/ui** (`base-nova` preset, Base UI primitives — not Radix; the shadcn `form` component is unavailable in this preset, so forms here use plain `<form action={serverAction}>` + native inputs instead of `react-hook-form`)
- **Supabase** (Postgres) via `@supabase/supabase-js`, called directly with the anon key — no auth/session wiring yet
- **Vercel** for hosting (not yet deployed)

## Commands

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check

## Data model (current)

Three-level hierarchy, not the flat single-table design originally sketched:

- **`item_types`** (品目, e.g. "歯ブラシ") — `id`, `category` (must be one of the 8 fixed values in `lib/constants.ts`'s `CATEGORIES`, also DB-enforced via a `check` constraint), `name`. Freely addable/editable from the UI (`/inventory`'s "新規品目の登録" form). `category` + `name` is unique.
- **`products`** (個別商品, e.g. "ライオン歯科医院用歯ブラシA") — the actual stock-holding record: `item_type_id` (FK), `name`, `unit`, `current_stock`, `low_stock_threshold`, plus optional `manufacturer`, `storage_location`, `notes`. Added from the item-type detail page's "新規商品の登録" form.

`CATEGORIES` in `lib/constants.ts` is the single source of truth for the 8 category names — keep it in sync with the DB `check` constraint if it ever changes.

## Architecture (current)

- `app/inventory/page.tsx` — search (`?q=`, matches `item_types.name`) + category-grouped browse view + a global low-stock alert banner (counts `products` where `current_stock <= low_stock_threshold` across everything) + "新規品目の登録" form. `app/page.tsx` just redirects `/` → `/inventory`.
- `app/inventory/[itemTypeId]/page.tsx` — one item type's product list (table with inline per-row stock-update form) + per-item-type low-stock banner + "新規商品の登録" form.
- `lib/actions/inventory.ts` — Server Actions (`addItemType`, `addProduct`, `updateStock`) using `"use server"`; each calls `revalidatePath` on the affected page(s) after writing.
- `lib/supabase/server.ts` — creates a Supabase client from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Used from Server Components/Actions only; there is no browser client yet since there's no client-side interactivity that needs one.
- `lib/types/database.ts` — hand-written `Database` type for `item_types` and `products`. Not generated via `supabase gen types` (Supabase CLI login/link wasn't set up) — update this by hand if the schema changes, matching the `GenericTable`/`GenericSchema` shape from `@supabase/supabase-js` (needs `Relationships: []` on each table and `Views`/`Functions` on the schema, or TS silently widens query results to `never`).

**⚠ Known security gap (intentional, temporary)**: both tables have RLS enabled but with a permissive `"temporary_allow_all" using (true) with check (true)` policy, because staff auth (F-01) doesn't exist yet — there's no `is_staff()`/`staff` table to gate on. This must be replaced with a real staff-gated policy before this ever runs anywhere besides local dev. Don't build further features on top of this without flagging that the anon key currently has full read/write access to these tables.

## Not built yet (see the original plan for design intent)

`staff`/auth, `patients`, `appointments`, `treatment_menu_items`, `treatment_records`, `inventory_usage_logs`, `purchase_orders`, `middleware.ts`, `scripts/create-staff.ts`. The original plan's schema/RLS/route design for these is still the intended direction when they're picked back up — it just hasn't been implemented.

## No automated test suite

Verification is manual: `next lint` + `tsc --noEmit` as sanity gates, and click-through testing (currently via the `claude-in-chrome` browser tools) against the real Supabase table.
