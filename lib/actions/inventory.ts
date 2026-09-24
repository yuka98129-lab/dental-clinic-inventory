"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";

export async function addItemTypeWithProduct(formData: FormData) {
  const category = String(formData.get("category") ?? "");
  const itemTypeName = String(formData.get("item_type_name") ?? "").trim();
  const productName = String(formData.get("product_name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const currentStock = Number(formData.get("current_stock") ?? 0);
  const lowStockThreshold = Number(formData.get("low_stock_threshold") ?? 0);
  const manufacturer = String(formData.get("manufacturer") ?? "").trim();
  const storageLocation = String(formData.get("storage_location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (
    !itemTypeName ||
    !productName ||
    !unit ||
    !CATEGORIES.includes(category as (typeof CATEGORIES)[number])
  ) {
    return;
  }

  const supabase = createSupabaseServerClient();

  const { data: insertedItemType } = await supabase
    .from("item_types")
    .insert({ name: itemTypeName, category })
    .select("id")
    .single();

  let itemTypeId = insertedItemType?.id;

  if (!itemTypeId) {
    // Item type with this category+name already exists — reuse it so this
    // form can also be used to add another product to an existing item type.
    const { data: existingItemType } = await supabase
      .from("item_types")
      .select("id")
      .eq("category", category)
      .eq("name", itemTypeName)
      .single();
    itemTypeId = existingItemType?.id;
  }

  if (!itemTypeId) return;

  await supabase.from("products").insert({
    item_type_id: itemTypeId,
    name: productName,
    unit,
    current_stock: currentStock,
    low_stock_threshold: lowStockThreshold,
    manufacturer: manufacturer || null,
    storage_location: storageLocation || null,
    notes: notes || null,
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${itemTypeId}`);
  redirect(`/inventory?category=${encodeURIComponent(category)}`);
}

export async function addProduct(formData: FormData) {
  const itemTypeId = String(formData.get("item_type_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const currentStock = Number(formData.get("current_stock") ?? 0);
  const lowStockThreshold = Number(formData.get("low_stock_threshold") ?? 0);
  const manufacturer = String(formData.get("manufacturer") ?? "").trim();
  const storageLocation = String(formData.get("storage_location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!itemTypeId || !name || !unit) return;

  const supabase = createSupabaseServerClient();
  await supabase.from("products").insert({
    item_type_id: itemTypeId,
    name,
    unit,
    current_stock: currentStock,
    low_stock_threshold: lowStockThreshold,
    manufacturer: manufacturer || null,
    storage_location: storageLocation || null,
    notes: notes || null,
  });

  revalidatePath(`/inventory/${itemTypeId}`);
  revalidatePath("/inventory");
}

export async function updateProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const itemTypeId = String(formData.get("item_type_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const currentStock = Number(formData.get("current_stock") ?? 0);
  const lowStockThreshold = Number(formData.get("low_stock_threshold") ?? 0);
  const manufacturer = String(formData.get("manufacturer") ?? "").trim();
  const storageLocation = String(formData.get("storage_location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!id || !name || !unit) return;

  const supabase = createSupabaseServerClient();
  await supabase
    .from("products")
    .update({
      name,
      unit,
      current_stock: currentStock,
      low_stock_threshold: lowStockThreshold,
      manufacturer: manufacturer || null,
      storage_location: storageLocation || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (itemTypeId) {
    revalidatePath(`/inventory/${itemTypeId}`);
    revalidatePath(`/inventory/${itemTypeId}/${id}`);
  }
  revalidatePath("/inventory");
}

export async function updateStock(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const itemTypeId = String(formData.get("item_type_id") ?? "");
  const currentStock = Number(formData.get("current_stock") ?? 0);

  if (!id || Number.isNaN(currentStock)) return;

  const supabase = createSupabaseServerClient();
  await supabase
    .from("products")
    .update({ current_stock: currentStock, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (itemTypeId) revalidatePath(`/inventory/${itemTypeId}`);
  revalidatePath("/inventory");
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const itemTypeId = String(formData.get("item_type_id") ?? "");
  const redirectTo = formData.get("redirect_to");

  if (!id) return;

  const supabase = createSupabaseServerClient();
  await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/inventory");
  revalidatePath("/inventory/trash");
  if (itemTypeId) revalidatePath(`/inventory/${itemTypeId}`);

  // Only navigate away when explicitly asked to (e.g. deleting from the
  // product's own detail page) — deleting inline from a list should just
  // remove the row in place and keep the user where they were.
  if (typeof redirectTo === "string" && redirectTo) {
    redirect(redirectTo);
  }
}

export async function updateProductField(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const itemTypeId = String(formData.get("item_type_id") ?? "");
  const field = String(formData.get("field") ?? "");
  const rawValue = formData.get("value");

  if (!id) return;

  const supabase = createSupabaseServerClient();
  const updatedAt = new Date().toISOString();

  switch (field) {
    case "unit": {
      const unit = String(rawValue ?? "").trim();
      if (!unit) return;
      await supabase
        .from("products")
        .update({ unit, updated_at: updatedAt })
        .eq("id", id);
      break;
    }
    case "low_stock_threshold": {
      const lowStockThreshold = Number(rawValue ?? 0);
      if (Number.isNaN(lowStockThreshold)) return;
      await supabase
        .from("products")
        .update({ low_stock_threshold: lowStockThreshold, updated_at: updatedAt })
        .eq("id", id);
      break;
    }
    case "storage_location": {
      const storageLocation = String(rawValue ?? "").trim();
      await supabase
        .from("products")
        .update({ storage_location: storageLocation || null, updated_at: updatedAt })
        .eq("id", id);
      break;
    }
    case "notes": {
      const notes = String(rawValue ?? "").trim();
      await supabase
        .from("products")
        .update({ notes: notes || null, updated_at: updatedAt })
        .eq("id", id);
      break;
    }
    default:
      return;
  }

  if (itemTypeId) revalidatePath(`/inventory/${itemTypeId}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/trash");
}

export async function restoreProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const itemTypeId = String(formData.get("item_type_id") ?? "");

  if (!id) return;

  const supabase = createSupabaseServerClient();
  await supabase.from("products").update({ deleted_at: null }).eq("id", id);

  if (itemTypeId) {
    // If the parent item type is still (soft-)deleted, restore it too —
    // otherwise the restored product would be invisible under a hidden item type.
    await supabase
      .from("item_types")
      .update({ deleted_at: null })
      .eq("id", itemTypeId)
      .not("deleted_at", "is", null);
    revalidatePath(`/inventory/${itemTypeId}`);
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/trash");
}

export async function permanentlyDeleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const itemTypeId = String(formData.get("item_type_id") ?? "");

  if (!id) return;

  const supabase = createSupabaseServerClient();
  await supabase.from("products").delete().eq("id", id);

  revalidatePath("/inventory");
  revalidatePath("/inventory/trash");
  if (itemTypeId) revalidatePath(`/inventory/${itemTypeId}`);
}

export async function permanentlyDeleteItemType(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) return;

  const supabase = createSupabaseServerClient();
  // `products.item_type_id` has `on delete cascade`, so this also removes
  // (permanently) any products still attached to this item type.
  await supabase.from("item_types").delete().eq("id", id);

  revalidatePath("/inventory");
  revalidatePath("/inventory/trash");
}

export async function deleteItemType(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) return;

  const supabase = createSupabaseServerClient();
  const deletedAt = new Date().toISOString();

  await supabase.from("item_types").update({ deleted_at: deletedAt }).eq("id", id);
  await supabase
    .from("products")
    .update({ deleted_at: deletedAt })
    .eq("item_type_id", id)
    .is("deleted_at", null);

  revalidatePath("/inventory");
  revalidatePath("/inventory/trash");
  redirect("/inventory");
}

export async function restoreItemType(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) return;

  const supabase = createSupabaseServerClient();
  const { data: itemType } = await supabase
    .from("item_types")
    .select("deleted_at")
    .eq("id", id)
    .single();

  await supabase.from("item_types").update({ deleted_at: null }).eq("id", id);

  // Restore products that were soft-deleted at the same moment as the item
  // type (i.e. deleted as part of this same cascade), not ones a user
  // deleted individually before the item type itself was removed.
  if (itemType?.deleted_at) {
    await supabase
      .from("products")
      .update({ deleted_at: null })
      .eq("item_type_id", id)
      .eq("deleted_at", itemType.deleted_at);
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/trash");
  revalidatePath(`/inventory/${id}`);
}
