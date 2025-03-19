import { useState, useCallback } from "react";
import { Page } from "@/types/zine";
import { createElement } from "@/lib/element";

interface UseBackgroundControlProps {
  pages: Page[];
  setPages: (pages: Page[]) => void;
  currentPage: number;
  width: number;
  height: number;
}

export function useBackgroundControl({
  pages,
  setPages,
  currentPage,
  width,
  height,
}: UseBackgroundControlProps) {
  const [currentBackgroundColor, setCurrentBackgroundColor] =
    useState<string>("#ffffff");

  const setBackgroundColor = useCallback(
    async (color: string) => {
      if (!pages[currentPage]?.id) return;

      // Check if there's already a background element (assumed to be at z-index 0)
      const existingBackgroundIndex = pages[currentPage]?.elements.findIndex(
        (el) => el.z_index === 0 && el.type === "image"
      );

      // Create a solid color image data URL
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/png");

      if (existingBackgroundIndex >= 0) {
        // Update existing background
        const updatedPages = [...pages];
        const updatedElements = [...updatedPages[currentPage].elements];
        updatedElements[existingBackgroundIndex] = {
          ...updatedElements[existingBackgroundIndex],
          content: dataUrl,
        };
        updatedPages[currentPage] = {
          ...updatedPages[currentPage],
          elements: updatedElements,
        };
        setPages(updatedPages);
      } else {
        // Create new background element
        try {
          const newElement = await createElement({
            page_id: pages[currentPage].id,
            type: "image",
            content: dataUrl,
            position_x: 0,
            position_y: 0,
            width: width,
            height: height,
            scale: 1,
            z_index: 0, // Set to 0 to ensure it's at the bottom
            filter: "none",
            crop: null,
          });

          setPages(
            pages.map((page, index) =>
              index === currentPage
                ? {
                    ...page,
                    elements: [
                      {
                        ...newElement,
                        type: newElement.type as "text" | "image",
                        filter: "none",
                        crop: null,
                      },
                      ...page.elements.map((el) => ({
                        ...el,
                        z_index: el.z_index + 1, // Increment z-index of all other elements
                      })),
                    ],
                  }
                : page
            )
          );
        } catch (error) {
          console.error("Error adding background element:", error);
        }
      }
    },
    [pages, currentPage, width, height, setPages]
  );

  const handleSetBackgroundColor = (color: string) => {
    setCurrentBackgroundColor(color);
    setBackgroundColor(color);
  };

  return {
    currentBackgroundColor,
    setBackgroundColor,
    handleSetBackgroundColor,
  };
}
