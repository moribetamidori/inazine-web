import { createClient } from "./supabase/server";
import { Database } from "../../supabase/database.types";
import { domToJpeg } from "modern-screenshot";

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

export async function compressImage(
  dataUrl: string,
  maxSizeInMB: number = 0.5
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate aspect ratio
      const aspectRatio = width / height;

      // More aggressive size reduction
      const maxWidth = 800;
      const maxHeight = 1067;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Start with lower quality
      let quality = 0.5;
      let compressed = canvas.toDataURL("image/jpeg", quality);

      // If still too large, reduce quality until under maxSize
      while (compressed.length > maxSizeInMB * 1024 * 1024 && quality > 0.1) {
        quality -= 0.05;
        compressed = canvas.toDataURL("image/jpeg", quality);
      }

      resolve(compressed);
    };
  });
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

        // Add inline styles to prevent CORS issues
        const computedStyle = window.getComputedStyle(pageRef);
        pageClone.style.cssText = Array.from(computedStyle).reduce(
          (str, property) => {
            return `${str} ${property}: ${computedStyle.getPropertyValue(
              property
            )};`;
          },
          ""
        );

        tempPages.appendChild(pageClone);

        try {
          const initialImageUrl = await domToJpeg(pageClone, {
            quality: 0.8,
            width,
            height,
            backgroundColor: "#ffffff",
            style: {
              transform: "none",
              transformOrigin: "center",
            },
          });
          console.log(
            "Initial Image Size:",
            Math.round((initialImageUrl.length / 1024 / 1024) * 100) / 100,
            "MB"
          );

          const compressedImageUrl = await compressImage(initialImageUrl);
          console.log(
            "Compressed Image Size:",
            Math.round((compressedImageUrl.length / 1024 / 1024) * 100) / 100,
            "MB"
          );

          pageImages.push(compressedImageUrl);

          // Save preview to database if requested
          if (saveToDb && pageIds[i]) {
            console.log(`Saving preview for page ID: ${pageIds[i]}`);
            const supabase = createClient();
            await supabase
              .from("pages")
              .update({ preview: compressedImageUrl })
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
