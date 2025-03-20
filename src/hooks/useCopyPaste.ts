import { useState, useCallback, useEffect } from "react";
import { Page, Element } from "@/types/zine";
import { createElement } from "@/lib/element";

interface UseCopyPasteProps {
  currentPageData: Page | null;
  setCurrentPageData: (page: Page) => void;
  zineId?: string;
  width: number;
  height: number;
  cleanupActiveEditors: () => Promise<void>;
}

export function useCopyPaste({
  currentPageData,
  setCurrentPageData,
  zineId,
  width,
  height,
}: UseCopyPasteProps) {
  const [copiedElement, setCopiedElement] = useState<Element | null>(null);
  const [copiedPage, setCopiedPage] = useState<Page | null>(null);

  const handleCopy = (element: Element) => {
    setCopiedElement(element);
  };

  const handlePaste = useCallback(async () => {
    if (!copiedElement || !currentPageData?.id) {
      return;
    }

    const newElement = {
      ...copiedElement,
      id: `copy-${Date.now()}`,
      position_x: Math.min(
        copiedElement.position_x,
        width - (copiedElement.width || 100)
      ),
      position_y: Math.min(
        copiedElement.position_y,
        height - (copiedElement.height || 100)
      ),
    };

    try {
      console.log("Creating new element:", newElement); // Debug log
      const createdElement = await createElement({
        page_id: currentPageData.id,
        type: newElement.type,
        content: newElement.content,
        position_x: newElement.position_x,
        position_y: newElement.position_y,
        width: newElement.width,
        height: newElement.height,
        scale: newElement.scale,
        z_index: currentPageData.elements.length + 1,
        filter: newElement.filter,
        crop: null,
      });

      const typedElement: Element = {
        ...createdElement,
        type: createdElement.type as "text" | "image",
        filter: createdElement.filter as string,
        crop: createdElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      };

      setCurrentPageData({
        ...currentPageData,
        elements: [...currentPageData.elements, typedElement],
      });
    } catch (error) {
      console.error("Error pasting element:", error);
    }
  }, [copiedElement, currentPageData, width, height, setCurrentPageData]);

  // Function to copy the current page
  const handleCopyPage = useCallback(() => {
    if (!currentPageData) return;
    setCopiedPage(currentPageData);
  }, [currentPageData]);

  // Function to paste a copied page - we'll need to notify the parent component
  // since we're only handling a single page here
  const handlePastePage = useCallback(async () => {
    if (!copiedPage || !zineId) return;

    // The actual implementation for pasting a full page would need to be handled
    // at a higher level component that has access to the page collection
    console.log("Page paste requested - implement in parent component");

    // In this single-page model, we can only copy elements to the current page
    if (currentPageData) {
      try {
        // Create elements from the copied page in the current page
        const newElements = await Promise.all(
          copiedPage.elements.map(async (element) => {
            const createdElement = await createElement({
              page_id: currentPageData.id,
              type: element.type,
              content: element.content,
              position_x: element.position_x,
              position_y: element.position_y,
              width: element.width,
              height: element.height,
              scale: element.scale,
              z_index: currentPageData.elements.length + element.z_index,
              filter: element.filter,
              crop: element.crop,
            });

            return {
              ...createdElement,
              type: createdElement.type as "text" | "image",
              filter: createdElement.filter as string,
              crop: createdElement.crop as {
                top: number;
                right: number;
                bottom: number;
                left: number;
              } | null,
            };
          })
        );

        setCurrentPageData({
          ...currentPageData,
          elements: [...currentPageData.elements, ...newElements],
        });
      } catch (error) {
        console.error("Error copying elements from page:", error);
      }
    }
  }, [copiedPage, currentPageData, zineId, setCurrentPageData]);

  // Set up keyboard event listeners for element copy/paste
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && copiedElement) {
        e.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [copiedElement, handlePaste]);

  return {
    copiedElement,
    setCopiedElement,
    handleCopy,
    handlePaste,
    copiedPage,
    handleCopyPage,
    handlePastePage,
  };
}
