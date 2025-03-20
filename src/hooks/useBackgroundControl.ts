import { useState, useCallback } from "react";
import { Page } from "@/types/zine";
import { createElement } from "@/lib/element";

interface UseBackgroundControlProps {
  currentPageData: Page | null;
  setCurrentPageData: (page: Page) => void;
  width: number;
  height: number;
}

export function useBackgroundControl({
  currentPageData,
  setCurrentPageData,
  width,
  height,
}: UseBackgroundControlProps) {
  const [currentBackgroundColor, setCurrentBackgroundColor] =
    useState<string>("#ffffff");

  const setBackgroundColor = useCallback(
    async (color: string) => {
      if (!currentPageData?.id) return;

      // Check if there's already a background element (assumed to be at z-index 0)
      const existingBackgroundIndex = currentPageData.elements.findIndex(
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
        const updatedElements = [...currentPageData.elements];
        updatedElements[existingBackgroundIndex] = {
          ...updatedElements[existingBackgroundIndex],
          content: dataUrl,
        };

        setCurrentPageData({
          ...currentPageData,
          elements: updatedElements,
        });
      } else {
        // Create new background element
        try {
          const newElement = await createElement({
            page_id: currentPageData.id,
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

          setCurrentPageData({
            ...currentPageData,
            elements: [
              {
                ...newElement,
                type: newElement.type as "text" | "image",
                filter: "none",
                crop: null,
              },
              ...currentPageData.elements.map((el) => ({
                ...el,
                z_index: el.z_index + 1, // Increment z-index of all other elements
              })),
            ],
          });
        } catch (error) {
          console.error("Error adding background element:", error);
        }
      }
    },
    [currentPageData, width, height, setCurrentPageData]
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
