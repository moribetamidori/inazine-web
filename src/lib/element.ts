import { createClient } from "./supabase/server";
import { Database } from "../../supabase/database.types";

type Element = Database["public"]["Tables"]["elements"]["Row"];

export async function createElement(
  element: Omit<Element, "id" | "created_at" | "updated_at">
) {
  const supabase = createClient();

  const { data: newElement, error } = await supabase
    .from("elements")
    .insert(element)
    .select()
    .single();

  if (error) throw error;
  return newElement;
}

export async function getElementsByPageId(pageId: string) {
  const supabase = createClient();

  const { data: elements, error } = await supabase
    .from("elements")
    .select("*")
    .eq("page_id", pageId)
    .order("z_index", { ascending: true });

  if (error) throw error;
  return elements;
}

export async function getElementById(elementId: string) {
  const supabase = createClient();

  const { data: element, error } = await supabase
    .from("elements")
    .select("*")
    .eq("id", elementId)
    .single();

  if (error) throw error;
  return element;
}

export async function updateElement(
  elementId: string,
  updates: Partial<Element>
) {
  const supabase = createClient();

  const { data: element, error } = await supabase
    .from("elements")
    .update(updates)
    .eq("id", elementId)
    .select()
    .single();

  if (error) throw error;
  return element;
}

export async function deleteElement(elementId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("elements")
    .delete()
    .eq("id", elementId);

  if (error) throw error;
}

export async function updateElementZIndex(elementId: string, zIndex: number) {
  const supabase = createClient();

  const { data: element, error } = await supabase
    .from("elements")
    .update({ z_index: zIndex })
    .eq("id", elementId)
    .select()
    .single();

  if (error) throw error;
  return element;
}
