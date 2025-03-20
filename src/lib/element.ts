import { createClient } from "./supabase/server";
import { Database } from "../../supabase/database.types";
import { Page } from "@/types/zine";

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

interface Position {
  x: number;
  y: number;
}

interface ResizeParams {
  corner: string;
  e: MouseEvent;
  scale: number;
  startWidth: number;
  startHeight: number;
  startPosition: Position;
  onResize: (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => void;
  elementId: string;
  minSize?: number;
}

export const handleImageResize = ({
  corner,
  e,
  scale,
  startWidth,
  startHeight,
  startPosition,
  onResize,
  elementId,
  minSize = 50,
}: ResizeParams) => {
  const startX = e.clientX;
  const aspectRatio = startWidth / startHeight;

  const onMouseMove = (e: MouseEvent) => {
    const deltaX = (e.clientX - startX) / scale;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newX = startPosition.x;
    let newY = startPosition.y;

    switch (corner) {
      case "bottomRight":
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
        break;
      case "bottomLeft":
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
        newX = startPosition.x + startWidth - newWidth;
        newY = startPosition.y;
        break;
      case "topRight":
        newWidth = startWidth + deltaX;
        newHeight = newWidth / aspectRatio;
        newX = startPosition.x;
        newY = startPosition.y + (startHeight - newHeight);
        break;
      case "topLeft":
        newWidth = startWidth - deltaX;
        newHeight = newWidth / aspectRatio;
        newX = startPosition.x + (startWidth - newWidth);
        newY = startPosition.y + (startHeight - newHeight);
        break;
    }

    // Ensure minimum size
    if (newWidth >= minSize && newHeight >= minSize) {
      onResize(elementId, newWidth, newHeight, newX, newY);
    }
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

export async function handleDeleteElement(
  id: string,
  currentPageData: Page | null,
  setCurrentPageData: (page: Page) => void
) {
  if (!currentPageData) return;

  try {
    await deleteElement(id);
    setCurrentPageData({
      ...currentPageData,
      elements: currentPageData.elements.filter((el) => el.id !== id),
    });
  } catch (error) {
    console.error("Error deleting element:", error);
  }
}

export async function handleUpdateContent(
  id: string,
  content: string,
  currentPageData: Page | null,
  setCurrentPageData: (page: Page) => void
) {
  if (!currentPageData) return;

  try {
    await updateElement(id, { content });
    setCurrentPageData({
      ...currentPageData,
      elements: currentPageData.elements.map((el) =>
        el.id === id ? { ...el, content } : el
      ),
    });
  } catch (error) {
    console.error("Error updating element content:", error);
  }
}

export async function handleDragStop(
  id: string,
  x: number,
  y: number,
  currentPageData: Page | null,
  setCurrentPageData: (page: Page) => void
) {
  if (!currentPageData) return;

  // Update local state first (optimistic update)
  setCurrentPageData({
    ...currentPageData,
    elements: currentPageData.elements.map((el) =>
      el.id === id ? { ...el, position_x: x, position_y: y } : el
    ),
  });

  await updateElement(id, { position_x: x, position_y: y }).catch(() => {});
}

export async function handleResize(
  id: string,
  width: number,
  height: number,
  x: number,
  y: number,
  currentPageData: Page | null,
  setCurrentPageData: (page: Page) => void
) {
  if (!currentPageData) return;

  // Update local state first (optimistic update)
  setCurrentPageData({
    ...currentPageData,
    elements: currentPageData.elements.map((el) =>
      el.id === id
        ? {
            ...el,
            width,
            height,
            position_x: x,
            position_y: y,
          }
        : el
    ),
  });

  try {
    await updateElement(id, {
      width,
      height,
      position_x: x,
      position_y: y,
    });
  } catch (error) {
    console.error("Error updating element size:", error);
  }
}

export async function handleMoveLayer(
  id: string,
  direction: "up" | "down",
  currentPageData: Page | null,
  setCurrentPageData: (page: Page) => void
) {
  if (!currentPageData) return;

  const currentElements = [...currentPageData.elements];
  const elementIndex = currentElements.findIndex((el) => el.id === id);

  if (
    (direction === "up" && elementIndex === currentElements.length - 1) ||
    (direction === "down" && elementIndex === 0)
  ) {
    return;
  }

  const swapIndex = direction === "up" ? elementIndex + 1 : elementIndex - 1;

  // Update local state first
  const newElements = currentElements.map((el, idx) => {
    if (idx === elementIndex) {
      return {
        ...el,
        type: el.type as "text" | "image",
        z_index: direction === "up" ? el.z_index + 1 : el.z_index - 1,
      };
    }
    if (idx === swapIndex) {
      return {
        ...el,
        type: el.type as "text" | "image",
        z_index: direction === "up" ? el.z_index - 1 : el.z_index + 1,
      };
    }
    return { ...el, type: el.type as "text" | "image" };
  });

  newElements.sort((a, b) => a.z_index - b.z_index);

  setCurrentPageData({
    ...currentPageData,
    elements: newElements,
  });

  try {
    await Promise.all([
      updateElement(currentElements[elementIndex].id, {
        z_index:
          direction === "up"
            ? currentElements[elementIndex].z_index + 1
            : currentElements[elementIndex].z_index - 1,
      }),
      updateElement(currentElements[swapIndex].id, {
        z_index:
          direction === "up"
            ? currentElements[swapIndex].z_index - 1
            : currentElements[swapIndex].z_index + 1,
      }),
    ]);
  } catch (error) {
    console.error("Error updating element layers:", error);
  }
}

export async function addText(
  pageId: string,
  width: number,
  height: number,
  currentPageData: Page | null,
  setCurrentPageData: (page: Page) => void
) {
  if (!pageId || !currentPageData) return;

  try {
    const newElement = await createElement({
      page_id: pageId,
      type: "text",
      content: "Double click to edit",
      position_x: width / 2 - 50,
      position_y: height / 2 - 10,
      scale: 1,
      z_index: currentPageData.elements.length + 1,
      width: null,
      height: null,
      filter: "none",
      crop: null,
    });

    setCurrentPageData({
      ...currentPageData,
      elements: [
        ...currentPageData.elements,
        {
          ...newElement,
          type: newElement.type as "text" | "image",
          filter: "none",
          crop: null,
        },
      ],
    });
  } catch (error) {
    console.error("Error adding text element:", error);
  }
}

export async function addImage(
  pageId: string,
  width: number,
  height: number,
  currentPageData: Page | null,
  setCurrentPageData: (page: Page) => void
) {
  if (!pageId || !currentPageData) return;

  return new Promise<void>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            let imgSrc = e.target?.result as string;

            // Check if the file is HEIC format
            const isHeic =
              file.type === "image/heic" ||
              file.name.toLowerCase().endsWith(".heic") ||
              file.name.toLowerCase().endsWith(".heif");

            if (isHeic) {
              // For HEIC conversion, we need to dynamically import the heic2any library
              try {
                const heic2any = (await import("heic2any")).default;

                // Convert HEIC to PNG blob
                const pngBlob = await heic2any({
                  blob: file,
                  toType: "image/png",
                  quality: 0.8,
                });

                // Convert blob to data URL
                imgSrc = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(pngBlob as Blob);
                });
              } catch (heicError) {
                console.error("Error converting HEIC image:", heicError);
                // Continue with original format if conversion fails
              }
            }

            // Create an image element to load the image
            const img = new Image();
            img.src = imgSrc;

            await new Promise((resolve) => (img.onload = resolve));

            // Create a canvas to convert the image
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not get canvas context");

            ctx.drawImage(img, 0, 0);

            // Convert to WebP
            const webpData = canvas.toDataURL("image/webp", 0.8);

            const newElement = await createElement({
              page_id: pageId,
              type: "image",
              content: webpData,
              position_x: width / 2 ,
              position_y: height / 2 ,
              scale: 1,
              z_index: currentPageData.elements.length + 1,
              width: null,
              height: null,
              filter: "none",
              crop: null,
            });

            setCurrentPageData({
              ...currentPageData,
              elements: [
                ...currentPageData.elements,
                {
                  ...newElement,
                  type: newElement.type as "text" | "image",
                  filter: "none",
                  crop: null,
                },
              ],
            });
            resolve();
          } catch (error) {
            console.error("Error adding image element:", error);
            resolve();
          }
        };
        reader.readAsDataURL(file);
      } else {
        resolve();
      }
    };
    input.click();
  });
}

export async function handleUpdateFilter(
  id: string,
  filter: string,
  currentPageData: Page | null,
  setCurrentPageData: (page: Page) => void
) {
  if (!currentPageData) return;
  console.log("id", id);
  console.log("filter", filter);

  // Update local state first
  setCurrentPageData({
    ...currentPageData,
    elements: currentPageData.elements.map((el) =>
      el.id === id ? { ...el, filter } : el
    ),
  });

  // Update database
  try {
    await updateElement(id, { filter });
  } catch (error) {
    console.error("Error updating element filter:", error);
  }
}

export async function updateElementCrop(
  id: string,
  crop: { top: number; right: number; bottom: number; left: number },
  currentPageData: Page | null,
  setCurrentPageData: (page: Page) => void
) {
  if (!currentPageData) return;

  // Update local state first
  setCurrentPageData({
    ...currentPageData,
    elements: currentPageData.elements.map((el) =>
      el.id === id ? { ...el, crop } : el
    ),
  });

  // Update database
  try {
    await updateElement(id, { crop });
  } catch (error) {
    console.error("Error updating element crop:", error);
  }
}
