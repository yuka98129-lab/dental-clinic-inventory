"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProductField } from "@/lib/actions/inventory";

type EditableField = "unit" | "low_stock_threshold" | "storage_location" | "notes";

export function InlineEditableField({
  id,
  itemTypeId,
  field,
  value,
  type = "text",
  emptyLabel = "(未設定・クリックして入力)",
}: {
  id: string;
  itemTypeId: string;
  field: EditableField;
  value: string | number;
  type?: "text" | "number";
  emptyLabel?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    const isEmpty = value === "" || value === null || value === undefined;
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded px-1 py-0.5 text-left hover:bg-muted hover:underline"
      >
        {isEmpty ? (
          <span className="text-muted-foreground text-xs italic">
            {emptyLabel}
          </span>
        ) : (
          String(value)
        )}
      </button>
    );
  }

  return (
    <form action={updateProductField} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="item_type_id" value={itemTypeId} />
      <input type="hidden" name="field" value={field} />
      <Input
        type={type}
        name="value"
        defaultValue={value}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        autoFocus
        className="h-7 w-28"
      />
      <Button type="submit" size="sm" variant="outline">
        保存
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setEditing(false)}
      >
        キャンセル
      </Button>
    </form>
  );
}
