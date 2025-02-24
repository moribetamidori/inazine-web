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

export async function getZineTitle(zineId: string) {
  const supabase = createClient();

  const { data: zine, error } = await supabase
    .from("zines")
    .select("title")
    .eq("id", zineId)
    .single();

  if (error) throw error;
  return zine?.title;
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
      .order("page_order", { ascending: true });
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
          // Generate JPEG first
          const jpegUrl = await domToJpeg(pageClone, {
            quality: 0.8,
            width,
            height,
            backgroundColor: "#ffffff",
          });

          // Convert JPEG to WebP
          const webpUrl = await convertToWebP(jpegUrl);

          // Calculate and log sizes
          const jpegSize = calculateDataUrlSize(jpegUrl);
          const webpSize = calculateDataUrlSize(webpUrl);
          console.log(`Page ${i + 1} sizes:`, {
            jpeg: `${(jpegSize / 1024).toFixed(2)} KB`,
            webp: `${(webpSize / 1024).toFixed(2)} KB`,
            reduction: `${((1 - webpSize / jpegSize) * 100).toFixed(1)}%`,
          });

          pageImages.push(webpUrl);

          // Save preview to database if requested
          if (saveToDb && pageIds[i]) {
            const supabase = createClient();
            await supabase
              .from("pages")
              .update({ preview: webpUrl })
              .eq("id", pageIds[i]);
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

// Helper function to convert JPEG to WebP
function convertToWebP(jpegDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      // Convert to WebP with 0.8 quality
      const webpDataUrl = canvas.toDataURL("image/webp", 0.8);
      resolve(webpDataUrl);
    };
    img.src = jpegDataUrl;
  });
}

// Helper function to calculate size of data URL in bytes
function calculateDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1];
  const padding = base64.length % 4 ? 4 - (base64.length % 4) : 0;
  return (base64.length + padding) * 0.75;
}
