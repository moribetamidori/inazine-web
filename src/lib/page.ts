import { createClient } from "./supabase/server";
import { Database } from "../../supabase/database.types";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export async function createPage(zineId: string) {
  const supabase = createClient();

  // Get the current highest page_order
  const { data: lastPage } = await supabase
    .from("pages")
    .select("page_order")
    .eq("zine_id", zineId)
    .order("page_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (lastPage?.page_order ?? -1) + 1;

  const { data: page, error } = await supabase
    .from("pages")
    .insert({
      zine_id: zineId,
      page_order: nextOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return page;
}

export async function getPagesByZineId(zineId: string) {
  const supabase = createClient();

  const { data: pages, error } = await supabase
    .from("pages")
    .select("*, elements(*), preview")
    .eq("zine_id", zineId)
    .order("page_order", { ascending: true });

  if (error) throw error;
  return pages;
}

export async function getPageById(pageId: string) {
  const supabase = createClient();

  const { data: page, error } = await supabase
    .from("pages")
    .select("*, elements(*)")
    .eq("id", pageId)
    .single();

  if (error) throw error;
  return page;
}

export async function updatePage(pageId: string, updates: Partial<Page>) {
  const supabase = createClient();

  const { data: page, error } = await supabase
    .from("pages")
    .update(updates)
    .eq("id", pageId)
    .select()
    .single();

  if (error) throw error;
  return page;
}

export async function deletePage(pageId: string) {
  const supabase = createClient();

  const { error } = await supabase.from("pages").delete().eq("id", pageId);

  if (error) throw error;
}

export async function getCoverByZineId(zineId: string) {
  const supabase = createClient();

  const { data: coverPage, error } = await supabase
    .from("pages")
    .select("preview")
    .eq("zine_id", zineId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error) throw error;
  return coverPage?.preview || null;
}
