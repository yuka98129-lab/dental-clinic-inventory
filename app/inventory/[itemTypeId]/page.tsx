import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addProduct, deleteItemType } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductTable } from "@/components/inventory/product-table";
import { RecentlyDeleted } from "@/components/inventory/recently-deleted";

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
      supabase
        .from("item_types")
        .select("*")
        .eq("id", itemTypeId)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("products")
        .select("*")
        .eq("item_type_id", itemTypeId)
        .is("deleted_at", null)
        .order("name"),
    ]);

  if (!itemType) notFound();

  const lowStockCount =
    products?.filter((p) => p.current_stock <= p.low_stock_threshold)
      .length ?? 0;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-4">
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
        <form action={deleteItemType}>
          <input type="hidden" name="id" value={itemType.id} />
          <Button type="submit" variant="destructive" size="sm">
            この品目を削除
          </Button>
        </form>
      </div>
      <p className="text-muted-foreground -mt-4 text-xs">
        品目を削除すると、登録されている商品もまとめて削除されます(削除後は「元に戻す」から復元できます)。
      </p>

      {productsError && (
        <p className="text-destructive text-sm">
          在庫データの取得に失敗しました: {productsError.message}
        </p>
      )}

      {lowStockCount > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {lowStockCount}件の商品が要発注です。
        </div>
      )}

      <RecentlyDeleted />

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
          <form action={addProduct} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="item_type_id" value={itemTypeId} />
            <label className="grid gap-1 text-sm sm:col-span-2">
              商品名
              <Input name="name" placeholder="例: 〇〇歯科医院用A" required />
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
              追加
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
