"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmDeleteButton({
  action,
  hiddenFields,
  label = "完全に削除",
}: {
  action: (formData: FormData) => void;
  hiddenFields: Record<string, string>;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
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
      <span className="text-destructive text-xs">本当に削除しますか?</span>
      <Button type="submit" variant="destructive" size="sm">
        はい、完全に削除する
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
