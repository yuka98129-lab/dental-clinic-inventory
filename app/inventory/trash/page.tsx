import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  permanentlyDeleteItemType,
  permanentlyDeleteProduct,
  restoreItemType,
  restoreProduct,
} from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteButton } from "@/components/inventory/confirm-delete-button";

export const dynamic = "force-dynamic";

type TrashEntry =
  | {
      kind: "item_type";
      id: string;
      deletedAt: string;
      label: string;
      sublabel: string;
    }
  | {
      kind: "product";
      id: string;
      itemTypeId: string;
      deletedAt: string;
      label: string;
      sublabel: string;
    };

export default async function TrashPage() {
  const supabase = createSupabaseServerClient();

  const [{ data: itemTypes }, { data: deletedItemTypes }, { data: deletedProducts }] =
    await Promise.all([
      supabase.from("item_types").select("id, name, category"),
      supabase
        .from("item_types")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false }),
      supabase
        .from("products")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false }),
    ]);

  const itemTypeById = new Map(
    (itemTypes ?? []).map((it) => [it.id, { name: it.name, category: it.category }]),
  );

  const entries: TrashEntry[] = [
    ...(deletedItemTypes ?? []).map((it): TrashEntry => ({
      kind: "item_type",
      id: it.id,
      deletedAt: it.deleted_at!,
      label: it.name,
      sublabel: `品目・${it.category}`,
    })),
    ...(deletedProducts ?? []).map((p): TrashEntry => {
      const itemType = itemTypeById.get(p.item_type_id);
      return {
        kind: "product",
        id: p.id,
        itemTypeId: p.item_type_id,
        deletedAt: p.deleted_at!,
        label: p.name,
        sublabel: itemType
          ? `商品・${itemType.category} / ${itemType.name}`
          : "商品",
      };
    }),
  ].sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1));

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <div>
        <Link
          href="/inventory"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← 在庫一覧に戻る
        </Link>
        <h1 className="mt-1 text-2xl font-bold">🗑️ ゴミ箱</h1>
        <p className="text-muted-foreground text-sm">
          削除した品目・商品の一覧です。「元に戻す」で復元、「完全に削除」で二度と復元できない状態にします。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>削除済みの項目({entries.length}件)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              削除された品目・商品はありません。
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={`${entry.kind}-${entry.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{entry.label}</div>
                  <div className="text-muted-foreground text-xs">
                    {entry.sublabel}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form
                    action={
                      entry.kind === "item_type" ? restoreItemType : restoreProduct
                    }
                  >
                    <input type="hidden" name="id" value={entry.id} />
                    {entry.kind === "product" && (
                      <input
                        type="hidden"
                        name="item_type_id"
                        value={entry.itemTypeId}
                      />
                    )}
                    <Button type="submit" size="sm" variant="outline">
                      元に戻す
                    </Button>
                  </form>
                  <ConfirmDeleteButton
                    action={
                      entry.kind === "item_type"
                        ? permanentlyDeleteItemType
                        : permanentlyDeleteProduct
                    }
                    hiddenFields={
                      entry.kind === "item_type"
                        ? { id: entry.id }
                        : { id: entry.id, item_type_id: entry.itemTypeId }
                    }
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
