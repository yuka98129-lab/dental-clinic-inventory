import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addProduct } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductTable } from "@/components/inventory/product-table";

export const dynamic = "force-dynamic";

export default async function ItemTypePage({
  params,
}: {
  params: Promise<{ itemTypeId: string }>;
}) {
  const { itemTypeId } = await params;
  const supabase = createSupabaseServerClient();

  const [{ data: itemType }, { data: products, error: productsError }] =
    await Promise.all([
      supabase.from("item_types").select("*").eq("id", itemTypeId).single(),
      supabase
        .from("products")
        .select("*")
        .eq("item_type_id", itemTypeId)
        .order("name"),
    ]);

  if (!itemType) notFound();

  const lowStockCount =
    products?.filter((p) => p.current_stock <= p.low_stock_threshold)
      .length ?? 0;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <div>
        <Link
          href="/inventory"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← 在庫一覧に戻る
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{itemType.name}</h1>
        <p className="text-muted-foreground text-sm">{itemType.category}</p>
      </div>

      {productsError && (
        <p className="text-destructive text-sm">
          在庫データの取得に失敗しました: {productsError.message}
        </p>
      )}

      {lowStockCount > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {lowStockCount}件の商品が在庫閾値を下回っています。
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>商品一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductTable products={products ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>新規商品の登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addProduct} className="grid gap-3 sm:grid-cols-5">
            <input type="hidden" name="item_type_id" value={itemTypeId} />
            <Input
              name="name"
              placeholder="商品名(例: 〇〇歯科医院用A)"
              required
              className="sm:col-span-2"
            />
            <Input name="unit" placeholder="単位(例: 本)" required />
            <Input
              type="number"
              name="current_stock"
              placeholder="初期在庫数"
              min={0}
              step="any"
              defaultValue={0}
            />
            <Input
              type="number"
              name="low_stock_threshold"
              placeholder="閾値"
              min={0}
              step="any"
              defaultValue={0}
            />
            <Input name="manufacturer" placeholder="メーカー(任意)" />
            <Input name="storage_location" placeholder="保管場所(任意)" />
            <Input
              name="notes"
              placeholder="備考(任意)"
              className="sm:col-span-3"
            />
            <Button type="submit" className="sm:col-span-5 sm:w-fit">
              追加
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
