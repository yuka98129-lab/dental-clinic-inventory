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
import { ProductTable, type ProductRow } from "@/components/inventory/product-table";

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

  const itemTypeById = new Map((itemTypes ?? []).map((it) => [it.id, it]));

  const allRows: ProductRow[] = (products ?? []).map((product) => {
    const itemType = itemTypeById.get(product.item_type_id);
    return {
      ...product,
      itemTypeName: itemType?.name,
      itemTypeCategory: itemType?.category,
    };
  });

  const lowStockProductCount = allRows.filter(
    (p) => p.current_stock <= p.low_stock_threshold,
  ).length;

  const matchedRows = query
    ? allRows.filter(
        (row) =>
          row.name.includes(query) ||
          row.itemTypeName?.includes(query) ||
          row.itemTypeCategory?.includes(query),
      )
    : null;

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
          {lowStockProductCount}件の商品が在庫閾値を下回っています。
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

      {matchedRows ? (
        <Card>
          <CardHeader>
            <CardTitle>検索結果: 「{query}」</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductTable
              products={matchedRows}
              showItemType
              emptyMessage="該当する商品が見つかりませんでした。"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const categoryItemTypes = (itemTypes ?? []).filter(
              (it) => it.category === category,
            );
            const categoryRows = allRows.filter(
              (row) => row.itemTypeCategory === category,
            );
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryItemTypes.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {categoryItemTypes.map((it) => (
                        <Link
                          key={it.id}
                          href={`/inventory/${it.id}`}
                          className="text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {it.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  <ProductTable
                    products={categoryRows}
                    showItemType
                    emptyMessage={
                      categoryItemTypes.length === 0
                        ? "登録されている品目がありません。"
                        : "登録されている商品がありません。"
                    }
                  />
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
