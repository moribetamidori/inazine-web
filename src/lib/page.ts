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
    .select("*, preview")
    .eq("zine_id", zineId)
    .order("page_order", { ascending: true });

  if (error) throw error;
  return pages;
}
export async function getElementsByZineId(zineId: string) {
  const supabase = createClient();

  const { data: pages, error } = await supabase
    .from("pages")
    .select("*, elements(*)")
    .eq("zine_id", zineId)
    .order("page_order", { ascending: true });

  if (error) throw error;
  return pages;
}

export async function getPreviewsByZineId(zineId: string) {
  const supabase = createClient();

  const { data: pages, error } = await supabase
    .from("pages")
    .select("preview")
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
    .order("page_order", { ascending: true })
    .limit(1)
    .single();

  if (error) throw error;
  return coverPage?.preview || null;
}

export async function getPageWithElements(zineId: string, pageIndex: number) {
  const supabase = createClient();

  // First, get all pages to find the right one by index
  const { data: pages, error: pagesError } = await supabase
    .from("pages")
    .select("id")
    .eq("zine_id", zineId)
    .order("page_order", { ascending: true });

  if (pagesError) throw pagesError;

  // If pageIndex is out of bounds, return null
  if (!pages || pageIndex < 0 || pageIndex >= pages.length) {
    return null;
  }

  // Now fetch the specific page with all its elements
  const pageId = pages[pageIndex].id;
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("*, elements(*)")
    .eq("id", pageId)
    .single();

  if (pageError) throw pageError;
  return page;
}

export async function fetchPageThumbnails(zineId: string) {
  const supabase = createClient();

  const { data: thumbnailPages, error } = await supabase
    .from("pages")
    .select("id, page_order")
    .eq("zine_id", zineId)
    .order("page_order", { ascending: true });

  if (error) throw error;
  return thumbnailPages || [];
}

export async function fetchAllPages(zineId: string) {
  const supabase = createClient();

  const { data: pages, error } = await supabase
    .from("pages")
    .select("*")
    .eq("zine_id", zineId)
    .order("page_order", { ascending: true });

  if (error) throw error;
  return pages || [];
}
