import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addItemType } from "@/lib/actions/inventory";
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
import type { ItemType, Product } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = createSupabaseServerClient();
  const [{ data: itemTypes, error: itemTypesError }, { data: products }] =
    await Promise.all([
      supabase.from("item_types").select("*").order("category").order("name"),
      supabase.from("products").select("*"),
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
          {lowStockProductCount}件の商品が発注点を下回っています。
        </div>
      )}

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
                該当する品目が見つかりませんでした。下の「新規品目の登録」から追加できます。
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

      <Card>
        <CardHeader>
          <CardTitle>新規品目の登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addItemType} className="grid gap-3 sm:grid-cols-4">
            <select
              name="category"
              required
              defaultValue=""
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
            <Input
              name="name"
              placeholder="品目名(例: 歯ブラシ)"
              required
              className="sm:col-span-2"
            />
            <Button type="submit">追加</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
