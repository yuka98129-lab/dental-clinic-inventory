"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDeleteButton({
  action,
  hiddenFields,
  label = "完全に削除",
  confirmQuestion = "本当に削除しますか?",
  confirmActionLabel = "削除する",
  triggerSize = "sm",
}: {
  action: (formData: FormData) => void;
  hiddenFields: Record<string, string>;
  label?: ReactNode;
  confirmQuestion?: string;
  confirmActionLabel?: string;
  triggerSize?: "sm" | "icon-sm";
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        size={triggerSize}
        onClick={() => setConfirming(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <span className="text-destructive text-xs whitespace-nowrap">
        {confirmQuestion}
      </span>
      <Button type="submit" variant="destructive" size="sm">
        {confirmActionLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirming(false)}
      >
        キャンセル
      </Button>
    </form>
  );
}
