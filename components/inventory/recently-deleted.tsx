import { createSupabaseServerClient } from "@/lib/supabase/server";
import { restoreItemType, restoreProduct } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DeletedEntry =
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

export async function RecentlyDeleted() {
  const supabase = createSupabaseServerClient();

  const [{ data: deletedItemTypes }, { data: deletedProducts }] =
    await Promise.all([
      supabase
        .from("item_types")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(2),
      supabase
        .from("products")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(2),
    ]);

  if (!deletedItemTypes?.length && !deletedProducts?.length) return null;

  let itemTypeNameById = new Map<string, { name: string; category: string }>();
  const neededIds = (deletedProducts ?? []).map((p) => p.item_type_id);
  if (neededIds.length > 0) {
    const { data: relatedItemTypes } = await supabase
      .from("item_types")
      .select("id, name, category")
      .in("id", neededIds);
    itemTypeNameById = new Map(
      (relatedItemTypes ?? []).map((it) => [it.id, { name: it.name, category: it.category }]),
    );
  }

  const entries: DeletedEntry[] = [
    ...(deletedItemTypes ?? []).map((it): DeletedEntry => ({
      kind: "item_type",
      id: it.id,
      deletedAt: it.deleted_at!,
      label: it.name,
      sublabel: `品目・${it.category}`,
    })),
    ...(deletedProducts ?? []).map((p): DeletedEntry => {
      const itemType = itemTypeNameById.get(p.item_type_id);
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
  ]
    .sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1))
    .slice(0, 2);

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">最近削除した項目</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map((entry) => (
          <div
            key={`${entry.kind}-${entry.id}`}
            className="flex items-center justify-between rounded-md border p-3 text-sm"
          >
            <div>
              <div className="font-medium">{entry.label}</div>
              <div className="text-muted-foreground text-xs">
                {entry.sublabel}
              </div>
            </div>
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
