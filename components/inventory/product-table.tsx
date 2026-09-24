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

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>商品名</TableHead>
          <TableHead>単位</TableHead>
          <TableHead>在庫数</TableHead>
          <TableHead>発注点</TableHead>
          <TableHead>状態</TableHead>
          <TableHead className="text-right">数量更新</TableHead>
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
                </Link>
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
            <TableCell colSpan={6} className="text-muted-foreground text-center">
              登録されている商品がありません。
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
