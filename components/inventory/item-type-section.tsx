import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProductTable } from "@/components/inventory/product-table";
import type { ItemType, Product } from "@/lib/types/database";

export function ItemTypeSection({
  itemType,
  products,
}: {
  itemType: Pick<ItemType, "id" | "name" | "category">;
  products: Product[];
}) {
  return (
    <div className="space-y-2">
      <Link href={`/inventory/${itemType.id}`} className="inline-block hover:underline">
        <span className="font-medium">{itemType.name}</span>
        <span className="text-muted-foreground ml-2 text-xs">{itemType.category}</span>
      </Link>
      {products.length > 0 ? (
        <ProductTable products={products} />
      ) : (
        <div className="flex items-center justify-between rounded-md border border-dashed p-3 text-sm">
          <span className="text-muted-foreground">
            登録されている商品がありません。
          </span>
          <Link
            href={`/inventory/${itemType.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            + 商品を登録
          </Link>
        </div>
      )}
    </div>
  );
}
