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
  pages: Page[],
  currentPage: number,
  setPages: (pages: Page[]) => void
) {
  try {
    await deleteElement(id);
    setPages(
      pages.map((page, idx) =>
        idx === currentPage
          ? {
              ...page,
              elements: page.elements.filter((el) => el.id !== id),
            }
          : page
      )
    );
  } catch (error) {
    console.error("Error deleting element:", error);
  }
}

export async function handleUpdateContent(
  id: string,
  content: string,
  pages: Page[],
  currentPage: number,
  setPages: (pages: Page[]) => void
) {
  try {
    await updateElement(id, { content });
    const newPages = pages.map((page, idx) =>
      idx === currentPage
        ? {
            ...page,
            elements: page.elements.map((el) =>
              el.id === id ? { ...el, content } : el
            ),
          }
        : page
    );
    setPages(newPages);
  } catch (error) {
    console.error("Error updating element content:", error);
  }
}

export async function handleDragStop(
  id: string,
  x: number,
  y: number,
  pages: Page[],
  currentPage: number,
  setPages: (pages: Page[]) => void
) {
  // Update local state first (optimistic update)
  setPages(
    pages.map((page, index) =>
      index === currentPage
        ? {
            ...page,
            elements: page.elements.map((el) =>
              el.id === id ? { ...el, position_x: x, position_y: y } : el
            ),
          }
        : page
    )
  );

  await updateElement(id, { position_x: x, position_y: y }).catch(() => {});
}

export async function handleResize(
  id: string,
  width: number,
  height: number,
  x: number,
  y: number,
  pages: Page[],
  currentPage: number,
  setPages: (pages: Page[]) => void
) {
  // Update local state first (optimistic update)
  setPages(
    pages.map((page, index) =>
      index === currentPage
        ? {
            ...page,
            elements: page.elements.map((el) =>
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
          }
        : page
    )
  );

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
  pages: Page[],
  currentPage: number,
  setPages: (pages: Page[]) => void
) {
  const currentElements = [...pages[currentPage].elements];
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

  setPages(
    pages.map((page, index) =>
      index === currentPage ? { ...page, elements: newElements } : page
    )
  );

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
  pages: Page[],
  currentPage: number,
  setPages: (pages: Page[]) => void
) {
  if (!pageId) return;

  try {
    const newElement = await createElement({
      page_id: pageId,
      type: "text",
      content: "Double click to edit",
      position_x: width / 2 - 50,
      position_y: height / 2 - 10,
      scale: 1,
      z_index: pages[currentPage].elements.length + 1,
      width: null,
      height: null,
    });

    setPages(
      pages.map((page, index) =>
        index === currentPage
          ? {
              ...page,
              elements: [
                ...page.elements,
                { ...newElement, type: newElement.type as "text" | "image" },
              ],
            }
          : page
      )
    );
  } catch (error) {
    console.error("Error adding text element:", error);
  }
}

export async function addImage(
  pageId: string,
  width: number,
  height: number,
  pages: Page[],
  currentPage: number,
  setPages: (pages: Page[]) => void
) {
  if (!pageId) return;

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
            const newElement = await createElement({
              page_id: pageId,
              type: "image",
              content: e.target?.result as string,
              position_x: width / 2 - 100,
              position_y: height / 2 - 100,
              scale: 1,
              z_index: pages[currentPage].elements.length + 1,
              width: null,
              height: null,
            });

            setPages(
              pages.map((page, index) =>
                index === currentPage
                  ? {
                      ...page,
                      elements: [
                        ...page.elements,
                        {
                          ...newElement,
                          type: newElement.type as "text" | "image",
                        },
                      ],
                    }
                  : page
              )
            );
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
