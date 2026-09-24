import Link from "next/link";
import { updateStock } from "@/lib/actions/inventory";
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
import type { Product } from "@/lib/types/database";

export type ProductRow = Product & {
  itemTypeName?: string;
  itemTypeCategory?: string;
};

export function ProductTable({
  products,
  showItemType = false,
  emptyMessage = "登録されている商品がありません。",
}: {
  products: ProductRow[];
  showItemType?: boolean;
  emptyMessage?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showItemType && <TableHead>品目 / カテゴリー</TableHead>}
          <TableHead>商品名</TableHead>
          <TableHead>単位</TableHead>
          <TableHead>在庫数</TableHead>
          <TableHead>閾値</TableHead>
          <TableHead>状態</TableHead>
          <TableHead className="text-right">数量更新</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const isLow = product.current_stock <= product.low_stock_threshold;
          return (
            <TableRow key={product.id}>
              {showItemType && (
                <TableCell>
                  <Link
                    href={`/inventory/${product.item_type_id}`}
                    className="hover:underline"
                  >
                    <div className="font-medium">{product.itemTypeName}</div>
                    <div className="text-muted-foreground text-xs">
                      {product.itemTypeCategory}
                    </div>
                  </Link>
                </TableCell>
              )}
              <TableCell className="font-medium">
                <div>{product.name}</div>
                {(product.manufacturer || product.storage_location) && (
                  <div className="text-muted-foreground text-xs font-normal">
                    {[
                      product.manufacturer && `メーカー: ${product.manufacturer}`,
                      product.storage_location &&
                        `保管場所: ${product.storage_location}`,
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </div>
                )}
                {product.notes && (
                  <div className="text-muted-foreground text-xs font-normal">
                    備考: {product.notes}
                  </div>
                )}
              </TableCell>
              <TableCell>{product.unit}</TableCell>
              <TableCell>{product.current_stock}</TableCell>
              <TableCell>{product.low_stock_threshold}</TableCell>
              <TableCell>
                {isLow ? (
                  <Badge variant="destructive">在庫少</Badge>
                ) : (
                  <Badge variant="secondary">正常</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <form
                  action={updateStock}
                  className="flex items-center justify-end gap-2"
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
              </TableCell>
            </TableRow>
          );
        })}
        {products.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={showItemType ? 7 : 6}
              className="text-muted-foreground text-center"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
