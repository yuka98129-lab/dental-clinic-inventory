import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProduct } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ itemTypeId: string; productId: string }>;
}) {
  const { itemTypeId, productId } = await params;
  const supabase = createSupabaseServerClient();

  const [{ data: itemType }, { data: product }] = await Promise.all([
    supabase.from("item_types").select("*").eq("id", itemTypeId).single(),
    supabase.from("products").select("*").eq("id", productId).single(),
  ]);

  if (!itemType || !product) notFound();

  const isLow = product.current_stock <= product.low_stock_threshold;

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <div>
        <Link
          href={`/inventory/${itemTypeId}`}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← {itemType.name} に戻る
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {isLow ? (
            <Badge variant="destructive">在庫少</Badge>
          ) : (
            <Badge variant="secondary">正常</Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {itemType.category} / {itemType.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>商品情報の編集</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            key={product.updated_at}
            action={updateProduct}
            className="grid gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="id" value={product.id} />
            <input type="hidden" name="item_type_id" value={itemTypeId} />
            <label className="grid gap-1 text-sm sm:col-span-2">
              商品名
              <Input name="name" defaultValue={product.name} required />
            </label>
            <label className="grid gap-1 text-sm">
              単位
              <Input name="unit" defaultValue={product.unit} required />
            </label>
            <label className="grid gap-1 text-sm">
              在庫数
              <Input
                type="number"
                name="current_stock"
                defaultValue={product.current_stock}
                min={0}
                step="any"
              />
            </label>
            <label className="grid gap-1 text-sm">
              発注点
              <Input
                type="number"
                name="low_stock_threshold"
                defaultValue={product.low_stock_threshold}
                min={0}
                step="any"
              />
            </label>
            <label className="grid gap-1 text-sm">
              メーカー
              <Input
                name="manufacturer"
                defaultValue={product.manufacturer ?? ""}
              />
            </label>
            <label className="grid gap-1 text-sm">
              保管場所
              <Input
                name="storage_location"
                defaultValue={product.storage_location ?? ""}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              備考
              <Input name="notes" defaultValue={product.notes ?? ""} />
            </label>
            <Button type="submit" className="sm:col-span-2 sm:w-fit">
              保存
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
