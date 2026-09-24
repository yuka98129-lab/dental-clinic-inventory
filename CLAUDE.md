# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project status

The full MVP scope is documented in `requirements.md` (Japanese, source of truth) and the original 3-week plan is at `/Users/macintosh/.claude/plans/merry-discovering-spring.md`. **Current build order deviates from that plan**: by explicit decision, only the inventory feature (search, categorized browsing, low-stock alerts, soft-delete/restore) is being built first. Staff login (F-01), patients, appointments, treatment logging, and purchase orders are intentionally deferred — do not add them unless asked.

## What this project is

A lightweight, self-hosted system for a single dental clinic combining **appointment scheduling** and **consumable inventory management**. It explicitly excludes accounting/insurance-billing (レセコン) integration and patient-facing online features (deferred to a future version).

## Stack

- **Next.js** (App Router, TypeScript) + **Tailwind CSS** + **shadcn/ui** (`base-nova` preset, Base UI primitives — not Radix; the shadcn `form` component is unavailable in this preset, so forms here use plain `<form action={serverAction}>` + native inputs instead of `react-hook-form`)
- **`components/ui/input.tsx` is a plain native `<input>`, not Base UI's `Input`/`Field.Control`**: that wrapper's Enter-key handling assumes it's used inside Base UI's own `<Form>` component, and silently swallows Enter (no submit) inside a plain HTML form otherwise. Don't reintroduce the Base UI wrapper here without re-testing Enter-to-submit in every form.
- **Supabase** (Postgres) via `@supabase/supabase-js`, called directly with the anon key — no auth/session wiring yet
- **Vercel** for hosting — deployed at the URL the user configured; pushing to `main` triggers a redeploy

## Commands

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check

## Data model (current)

Three-level hierarchy, not the flat single-table design originally sketched. Both tables use **soft delete** via a nullable `deleted_at` — nothing is ever hard-deleted from the app.

- **`item_types`** (品目, e.g. "歯ブラシ") — `id`, `category` (must be one of the 8 fixed values in `lib/constants.ts`'s `CATEGORIES`, also DB-enforced via a `check` constraint), `name`, `deleted_at`. `category` + `name` is unique. Freely addable from the UI.
- **`products`** (個別商品, e.g. "ライオン歯科医院用歯ブラシA") — the actual stock-holding record: `item_type_id` (FK), `name`, `unit`, `current_stock`, `low_stock_threshold`, optional `manufacturer`/`storage_location`/`notes`, `deleted_at`.

`CATEGORIES` in `lib/constants.ts` is the single source of truth for the 8 category names — keep it in sync with the DB `check` constraint if it ever changes.

Every `select` against these tables must filter `.is("deleted_at", null)` (or explicitly want deleted rows, as `components/inventory/recently-deleted.tsx` does) — there's no RLS-level filtering of soft-deleted rows, it's the app's responsibility everywhere.

## Architecture (current)

- `app/inventory/page.tsx` — search (`?q=`, matches item name/category/product name) + category-grouped browse view (each item type rendered via `ItemTypeSection`) + low-stock alert banner + "最近削除した項目" (`RecentlyDeleted`) + a single combined "新規品目・商品の登録" form that creates an item type (or reuses an existing category+name match) and its first product in one submit, then redirects back to `/inventory?category=<that category>` so the category stays preselected for fast repeated entry. `app/page.tsx` just redirects `/` → `/inventory`.
- `app/inventory/[itemTypeId]/page.tsx` — one item type's product table, its own "新規商品の登録" form, a delete button (cascades to soft-delete its products), and `RecentlyDeleted`.
- `app/inventory/[itemTypeId]/[productId]/page.tsx` — full product edit form (all fields, not just stock) and a delete button.
- `components/inventory/item-type-section.tsx` — item type heading + `ProductTable`, or an empty-state message with a link into the item type's page when it has no products yet.
- `components/inventory/product-table.tsx` — despite the name, this is **not** an HTML `<table>` — it's a list of bordered "card" divs, one per product, deliberately chosen over a table so nothing needs horizontal scrolling (a wide multi-column table was the previous design and was rejected for exactly that reason). Each card: top row is product name (links to its detail page) + 状態 badge + delete button, always visible without scrolling; below that a `flex flex-wrap` row of small field groups (単位, 在庫数, 必要な数, 保管場所, 備考) that reflow onto additional lines as needed at narrow widths instead of overflowing. `current_stock` has its own always-visible quick-update form (input + 更新); `unit`/`low_stock_threshold`/`storage_location`/`notes` are each a click-to-edit `InlineEditableField` (click → input + 保存/キャンセル, submits via the generic `updateProductField` action, remounts closed on success by being keyed on the field's own value). The delete button (`ConfirmDeleteButton` with a `Trash2` icon, `deleteProduct` with no `redirect_to` so it stays on the current page) sits in that same top row, not at the end of a long row, specifically so it's reachable without scrolling.
- `components/inventory/inline-editable-field.tsx` / `confirm-delete-button.tsx` — small client components (`"use client"`, local `useState`) reused across the table, item-type page, product page, and trash page. `ConfirmDeleteButton`'s wording (`label`/`confirmQuestion`/`confirmActionLabel`) and `triggerSize` are overridable per call site — trash uses text + "完全に削除" wording, the table row uses an icon-only trigger with the lighter default "削除"/"削除する" wording.
- `components/inventory/recently-deleted.tsx` — async Server Component, independently queries the last 2 deleted item types and last 2 deleted products, merges/sorts by `deleted_at`, shows the top 2 overall with a restore button each, plus a link to `/inventory/trash`. Rendered on both `/inventory` and `/inventory/[itemTypeId]`.
- `app/inventory/trash/page.tsx` — full trash view (all deleted item types + products, no limit), each with "元に戻す" (restore) and "完全に削除" (hard delete via `ConfirmDeleteButton`, a small client component with an inline two-stage confirm — no `window.confirm`). Reachable from the persistent header's "🗑️ ゴミ箱" link on every page. Note: this is a static route (`app/inventory/trash/`) that takes routing precedence over the sibling dynamic `app/inventory/[itemTypeId]/` route — don't rename it to something that isn't a static segment without checking that precedence still holds.
- `lib/actions/inventory.ts` — Server Actions: `addItemTypeWithProduct`, `addProduct`, `updateProduct`, `updateProductField` (generic single-field update, dispatches on a `field` form value — `unit`/`low_stock_threshold`/`storage_location`/`notes` only), `updateStock`, `deleteItemType`/`restoreItemType`, `deleteProduct`/`restoreProduct`, `permanentlyDeleteItemType`/`permanentlyDeleteProduct`. Delete/restore use soft delete (`deleted_at`); `deleteItemType` stamps the same `deleted_at` on the item type and its then-active products so `restoreItemType` can restore exactly that cascade by matching the timestamp, without also reviving products that were independently deleted earlier. `restoreProduct` also un-deletes its parent item type if that's still soft-deleted, so the restored product isn't left invisible under a hidden item type. `permanentlyDeleteItemType` relies on `products.item_type_id`'s `on delete cascade` to also hard-delete its products in the same statement. `deleteProduct` only `redirect()`s when a `redirect_to` form field is present (the product detail page's own delete button sets it; the table row's inline delete omits it so the row just disappears in place).
- `lib/supabase/server.ts` — creates a Supabase client from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Used from Server Components/Actions only; there is no browser client since there's no client-side interactivity that needs one.
- `lib/types/database.ts` — hand-written `Database` type for `item_types` and `products`. Not generated via `supabase gen types` (Supabase CLI login/link wasn't set up) — update this by hand if the schema changes, matching the `GenericTable`/`GenericSchema` shape from `@supabase/supabase-js` (needs `Relationships: []` on each table and `Views`/`Functions` on the schema, or TS silently widens query results to `never`).

**⚠ Known security gap (intentional, temporary)**: both tables have RLS enabled but with a permissive `"temporary_allow_all" using (true) with check (true)` policy, because staff auth (F-01) doesn't exist yet — there's no `is_staff()`/`staff` table to gate on. This must be replaced with a real staff-gated policy before this ever runs anywhere besides local dev. Don't build further features on top of this without flagging that the anon key currently has full read/write access to these tables.

## Not built yet (see the original plan for design intent)

`staff`/auth, `patients`, `appointments`, `treatment_menu_items`, `treatment_records`, `inventory_usage_logs`, `purchase_orders`, `middleware.ts`, `scripts/create-staff.ts`. The original plan's schema/RLS/route design for these is still the intended direction when they're picked back up — it just hasn't been implemented.

## No automated test suite

Verification is manual: `next lint` + `tsc --noEmit` as sanity gates, and click-through testing (currently via the `claude-in-chrome` browser tools) against the real Supabase table.
