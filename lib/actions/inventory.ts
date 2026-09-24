"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";

export async function addItemType(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");

  if (!name || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("item_types")
    .insert({ name, category })
    .select("id")
    .single();

  revalidatePath("/inventory");

  if (data) {
    redirect(`/inventory/${data.id}`);
  }
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
