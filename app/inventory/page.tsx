import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addItemTypeWithProduct } from "@/lib/actions/inventory";
import { CATEGORIES } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ItemTypeSection } from "@/components/inventory/item-type-section";
import { RecentlyDeleted } from "@/components/inventory/recently-deleted";
import type { ItemType, Product } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category: preselectedCategory } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = createSupabaseServerClient();
  const [{ data: itemTypes, error: itemTypesError }, { data: products }] =
    await Promise.all([
      supabase
        .from("item_types")
        .select("*")
        .is("deleted_at", null)
        .order("category")
        .order("name"),
      supabase.from("products").select("*").is("deleted_at", null),
    ]);

  const productsByItemType = new Map<string, Product[]>();
  for (const product of products ?? []) {
    const list = productsByItemType.get(product.item_type_id) ?? [];
    list.push(product);
    productsByItemType.set(product.item_type_id, list);
  }

  const lowStockProductCount = (products ?? []).filter(
    (p) => p.current_stock <= p.low_stock_threshold,
  ).length;

  let matchedItemTypes: ItemType[] | null = null;
  if (query) {
    matchedItemTypes = (itemTypes ?? []).filter((it) => {
      if (it.name.includes(query) || it.category.includes(query)) return true;
      return (productsByItemType.get(it.id) ?? []).some((p) =>
        p.name.includes(query),
      );
    });
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold">在庫一覧</h1>
        <p className="text-muted-foreground text-sm">
          品目・カテゴリー・商品名で検索、またはカテゴリーから選んで在庫情報を確認・編集します。
        </p>
      </div>

      {itemTypesError && (
        <p className="text-destructive text-sm">
          品目データの取得に失敗しました: {itemTypesError.message}
        </p>
      )}

      {lowStockProductCount > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {lowStockProductCount}件の商品が要発注です。
        </div>
      )}

      <RecentlyDeleted />

      <form className="flex gap-2">
        <Input
          key={query}
          type="search"
          name="q"
          placeholder="カテゴリー・品目・商品名で検索(例: 滅菌, 歯ブラシ)"
          defaultValue={query}
        />
        <Button type="submit">検索</Button>
        {query && (
          <Link href="/inventory" className={buttonVariants({ variant: "outline" })}>
            クリア
          </Link>
        )}
      </form>

      {matchedItemTypes ? (
        <Card>
          <CardHeader>
            <CardTitle>検索結果: 「{query}」</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {matchedItemTypes.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                該当する品目が見つかりませんでした。下の「新規品目・商品の登録」から追加できます。
              </p>
            ) : (
              matchedItemTypes.map((it) => (
                <ItemTypeSection
                  key={it.id}
                  itemType={it}
                  products={productsByItemType.get(it.id) ?? []}
                />
              ))
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const categoryItemTypes = (itemTypes ?? []).filter(
              (it) => it.category === category,
            );
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryItemTypes.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      登録されている品目がありません。
                      <Link
                        href={`/inventory?category=${encodeURIComponent(category)}#new-item-form`}
                        className="ml-1 underline"
                      >
                        このカテゴリーに品目・商品を登録する
                      </Link>
                    </p>
                  ) : (
                    categoryItemTypes.map((it) => (
                      <ItemTypeSection
                        key={it.id}
                        itemType={it}
                        products={productsByItemType.get(it.id) ?? []}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card id="new-item-form">
        <CardHeader>
          <CardTitle>新規品目・商品の登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={addItemTypeWithProduct}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className="grid gap-1 text-sm">
              カテゴリー
              <select
                key={preselectedCategory ?? "none"}
                name="category"
                required
                defaultValue={preselectedCategory ?? ""}
                className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="" disabled>
                  カテゴリーを選択
                </option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              品目名
              <Input name="item_type_name" placeholder="例: 歯ブラシ" required />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              商品名
              <Input
                name="product_name"
                placeholder="例: 〇〇歯科医院用A"
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              単位
              <Input name="unit" placeholder="例: 本" required />
            </label>
            <label className="grid gap-1 text-sm">
              現在の在庫数
              <Input
                type="number"
                name="current_stock"
                min={0}
                step="any"
                defaultValue={0}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              必要な数(発注の目安)
              <span className="text-muted-foreground text-xs">
                この数より在庫が少なくなったら「要発注」と表示されます
              </span>
              <Input
                type="number"
                name="low_stock_threshold"
                min={0}
                step="any"
                defaultValue={0}
              />
            </label>
            <label className="grid gap-1 text-sm">
              メーカー(任意)
              <Input name="manufacturer" />
            </label>
            <label className="grid gap-1 text-sm">
              保管場所(任意)
              <Input name="storage_location" />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              備考(任意)
              <Input name="notes" />
            </label>
            <Button type="submit" className="sm:col-span-2 sm:w-fit">
              登録
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
