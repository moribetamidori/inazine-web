import { createClient } from "./supabase/server";
import { Element } from "@/types/zine";

export async function convertImageToWebP(
  imageDataUrl: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const webpData = canvas.toDataURL("image/webp", 0.8);
      resolve(webpData);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageDataUrl;
  });
}

export async function getAllImageElements(): Promise<Element[]> {
  const supabase = createClient();
  const { data: elements, error } = await supabase
    .from("elements")
    .select("*")
    .eq("type", "image");

  if (error) throw error;
  return elements as Element[];
}

export async function convertAllImagesToWebP(): Promise<{
  total: number;
  converted: number;
  errors: number;
}> {
  const supabase = createClient();
  const elements = await getAllImageElements();
  let converted = 0;
  let errors = 0;

  for (const element of elements) {
    if (!element.content.startsWith("data:image/webp")) {
      try {
        const webpData = await convertImageToWebP(element.content);
        await supabase
          .from("elements")
          .update({ content: webpData })
          .eq("id", element.id);
        converted++;
      } catch (error) {
        console.error(`Error converting image ${element.id}:`, error);
        errors++;
      }
    }
  }

  return {
    total: elements.length,
    converted,
    errors,
  };
}

export async function convertPreviewsToWebP(): Promise<{
  total: number;
  converted: number;
  errors: number;
}> {
  const supabase = createClient();
  const { data: pages, error } = await supabase
    .from("pages")
    .select("*")
    .not("preview", "is", null)
    .not("preview", "ilike", "%.webp%");

  if (error) throw error;

  let converted = 0;
  let errors = 0;

  for (const page of pages || []) {
    if (page.preview && !page.preview.startsWith("data:image/webp")) {
      try {
        const webpData = await convertImageToWebP(page.preview);
        await supabase
          .from("pages")
          .update({ preview: webpData })
          .eq("id", page.id);
        converted++;
      } catch (error) {
        console.error(`Error converting preview for page ${page.id}:`, error);
        errors++;
      }
    }
  }

  return {
    total: (pages || []).length,
    converted,
    errors,
  };
}
