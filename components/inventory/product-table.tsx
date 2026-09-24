import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteProduct, updateStock } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/inventory/confirm-delete-button";
import { InlineEditableField } from "@/components/inventory/inline-editable-field";
import type { Product } from "@/lib/types/database";

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>商品名</TableHead>
          <TableHead>単位</TableHead>
          <TableHead>在庫数</TableHead>
          <TableHead>必要な数</TableHead>
          <TableHead>保管場所</TableHead>
          <TableHead>備考</TableHead>
          <TableHead>状態</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const isLow = product.current_stock <= product.low_stock_threshold;
          const detailHref = `/inventory/${product.item_type_id}/${product.id}`;
          return (
            <TableRow key={product.id}>
              <TableCell className="font-medium">
                <Link href={detailHref} className="hover:underline">
                  <div>{product.name}</div>
                  {product.manufacturer && (
                    <div className="text-muted-foreground text-xs font-normal">
                      メーカー: {product.manufacturer}
                    </div>
                  )}
                </Link>
              </TableCell>
              <TableCell>
                <InlineEditableField
                  key={product.unit}
                  id={product.id}
                  itemTypeId={product.item_type_id}
                  field="unit"
                  value={product.unit}
                />
              </TableCell>
              <TableCell>{product.current_stock}</TableCell>
              <TableCell>
                <InlineEditableField
                  key={product.low_stock_threshold}
                  id={product.id}
                  itemTypeId={product.item_type_id}
                  field="low_stock_threshold"
                  type="number"
                  value={product.low_stock_threshold}
                />
              </TableCell>
              <TableCell>
                <InlineEditableField
                  key={product.storage_location ?? ""}
                  id={product.id}
                  itemTypeId={product.item_type_id}
                  field="storage_location"
                  value={product.storage_location ?? ""}
                />
              </TableCell>
              <TableCell>
                <InlineEditableField
                  key={product.notes ?? ""}
                  id={product.id}
                  itemTypeId={product.item_type_id}
                  field="notes"
                  value={product.notes ?? ""}
                />
              </TableCell>
              <TableCell>
                {isLow ? (
                  <Badge variant="destructive">要発注</Badge>
                ) : (
                  <Badge variant="secondary">在庫あり</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <form
                    action={updateStock}
                    className="flex items-center gap-2"
                  >
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
                      className="w-24"
                    />
                    <Button type="submit" size="sm" variant="outline">
                      更新
                    </Button>
                  </form>
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
              </TableCell>
            </TableRow>
          );
        })}
        {products.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-muted-foreground text-center">
              登録されている商品がありません。
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
