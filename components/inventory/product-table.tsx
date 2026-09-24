import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteProduct, updateStock } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/inventory/confirm-delete-button";
import { InlineEditableField } from "@/components/inventory/inline-editable-field";
import type { Product } from "@/lib/types/database";

export function ProductTable({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        登録されている商品がありません。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const isLow = product.current_stock <= product.low_stock_threshold;
        const detailHref = `/inventory/${product.item_type_id}/${product.id}`;
        return (
          <div key={product.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-2">
              <Link href={detailHref} className="min-w-0 hover:underline">
                <div className="font-medium">{product.name}</div>
                {product.manufacturer && (
                  <div className="text-muted-foreground text-xs">
                    メーカー: {product.manufacturer}
                  </div>
                )}
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                {isLow ? (
                  <Badge variant="destructive">要発注</Badge>
                ) : (
                  <Badge variant="secondary">在庫あり</Badge>
                )}
                <ConfirmDeleteButton
                  action={deleteProduct}
                  hiddenFields={{
                    id: product.id,
                    item_type_id: product.item_type_id,
                  }}
                  label={<Trash2 className="size-4" />}
                  triggerSize="icon-sm"
                />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">単位:</span>
                <InlineEditableField
                  key={product.unit}
                  id={product.id}
                  itemTypeId={product.item_type_id}
                  field="unit"
                  value={product.unit}
                />
              </div>
              <form
                action={updateStock}
                className="flex items-center gap-1"
              >
                <span className="text-muted-foreground text-xs">在庫数:</span>
                <input type="hidden" name="id" value={product.id} />
                <input
                  type="hidden"
                  name="item_type_id"
                  value={product.item_type_id}
                />
                <Input
                  key={product.current_stock}
                  type="number"
                  name="current_stock"
                  defaultValue={product.current_stock}
                  min={0}
                  step="any"
                  className="h-7 w-20"
                />
                <Button type="submit" size="sm" variant="outline">
                  更新
                </Button>
              </form>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">
                  必要な数:
                </span>
                <InlineEditableField
                  key={product.low_stock_threshold}
                  id={product.id}
                  itemTypeId={product.item_type_id}
                  field="low_stock_threshold"
                  type="number"
                  value={product.low_stock_threshold}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">
                  保管場所:
                </span>
                <InlineEditableField
                  key={product.storage_location ?? ""}
                  id={product.id}
                  itemTypeId={product.item_type_id}
                  field="storage_location"
                  value={product.storage_location ?? ""}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">備考:</span>
                <InlineEditableField
                  key={product.notes ?? ""}
                  id={product.id}
                  itemTypeId={product.item_type_id}
                  field="notes"
                  value={product.notes ?? ""}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
