import { createClient } from "./supabase/server";
import { Database } from "../../supabase/database.types";
import html2canvas from "html2canvas";

type Zine = Database["public"]["Tables"]["zines"]["Row"];

export async function createZine(
  title: string,
  description: string,
  userId: string
) {
  const supabase = createClient();

  const { data: zine, error } = await supabase
    .from("zines")
    .insert({
      title,
      description,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return zine;
}

export async function getZinesByUserId(userId: string) {
  const supabase = createClient();

  const { data: zines, error } = await supabase
    .from("zines")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return zines;
}

export async function getZineById(zineId: string) {
  const supabase = createClient();

  const { data: zine, error } = await supabase
    .from("zines")
    .select("*")
    .eq("id", zineId)
    .single();

  if (error) throw error;
  return zine;
}

export async function updateZine(zineId: string, updates: Partial<Zine>) {
  const supabase = createClient();

  const { data: zine, error } = await supabase
    .from("zines")
    .update(updates)
    .eq("id", zineId)
    .select()
    .single();

  if (error) throw error;
  return zine;
}

export async function deleteZine(zineId: string) {
  const supabase = createClient();

  const { error } = await supabase.from("zines").delete().eq("id", zineId);

  if (error) throw error;
}
//getpagesbyzineid
export async function getPagesByZineId(zineId: string) {
  const supabase = createClient();

  const { data: pages, error } = await supabase
    .from("pages")
    .select("*")
    .eq("zine_id", zineId);

  if (error) throw error;
  return pages;
}

export async function generatePreview(
  pages: HTMLDivElement[],
  width: number,
  height: number,
  zineId: string,
  saveToDb: boolean = true
): Promise<string[]> {
  const pageImages: string[] = [];
  const tempPages = document.createElement("div");
  tempPages.style.position = "absolute";
  tempPages.style.left = "-9999px";
  document.body.appendChild(tempPages);

  let pageIds: string[] = [];
  if (saveToDb) {
    const supabase = createClient();
    const { data: pagesData } = await supabase
      .from("pages")
      .select("id")
      .eq("zine_id", zineId)
      .order("created_at", { ascending: true });
    pageIds = pagesData?.map((page) => page.id) || [];
  }

  try {
    for (let i = 0; i < pages.length; i++) {
      const pageRef = pages[i];
      if (pageRef) {
        const pageClone = pageRef.cloneNode(true) as HTMLElement;
        pageClone.style.transform = "scale(1)";
        pageClone.style.display = "block";
        tempPages.appendChild(pageClone);

        try {
          const canvas = await html2canvas(pageClone, {
            scale: 2,
            useCORS: true,
            backgroundColor: "white",
            width,
            height,
          });
          const imageUrl = canvas.toDataURL("image/png");
          console.log("Image URL:", imageUrl);
          pageImages.push(imageUrl);

          // Save preview to database if requested
          if (saveToDb && pageIds[i]) {
            console.log(`Saving preview for page ID: ${pageIds[i]}`);
            const supabase = createClient();
            await supabase
              .from("pages")
              .update({ preview: imageUrl })
              .eq("id", pageIds[i]);
            console.log("Preview saved to database");
          }
        } catch (error) {
          console.error(`Error generating preview for page ${i + 1}:`, error);
        }

        tempPages.removeChild(pageClone);
      }
    }
  } finally {
    document.body.removeChild(tempPages);
  }

  return pageImages;
}
