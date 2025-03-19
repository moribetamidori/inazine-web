import { useState, useCallback, useEffect } from "react";
import { Page, Element } from "@/types/zine";
import { createElement } from "@/lib/element";
import { createPage } from "@/lib/page";
import { createClient } from "@/lib/supabase/client";

interface UseCopyPasteProps {
  pages: Page[];
  setPages: (pages: Page[]) => void;
  currentPage: number;
  zineId?: string;
  width: number;
  height: number;
  cleanupActiveEditors: () => Promise<void>;
}

export function useCopyPaste({
  pages,
  setPages,
  currentPage,
  zineId,
  width,
  height,
  cleanupActiveEditors,
}: UseCopyPasteProps) {
  const [copiedElement, setCopiedElement] = useState<Element | null>(null);
  const [copiedPage, setCopiedPage] = useState<Page | null>(null);

  const handleCopy = (element: Element) => {
    setCopiedElement(element);
  };

  const handlePaste = useCallback(async () => {
    if (!copiedElement || !pages[currentPage]?.id) {
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
        page_id: pages[currentPage].id,
        type: newElement.type,
        content: newElement.content,
        position_x: newElement.position_x,
        position_y: newElement.position_y,
        width: newElement.width,
        height: newElement.height,
        scale: newElement.scale,
        z_index: pages[currentPage].elements.length + 1,
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

      setPages((prevPages) =>
        prevPages.map((page, index) =>
          index === currentPage
            ? { ...page, elements: [...page.elements, typedElement] }
            : page
        )
      );
    } catch (error) {
      console.error("Error pasting element:", error);
    }
  }, [copiedElement, pages, currentPage, width, height, setPages]);

  // Function to copy the current page
  const handleCopyPage = useCallback(() => {
    if (!pages[currentPage]) return;
    setCopiedPage(pages[currentPage]);
  }, [pages, currentPage]);

  // Function to paste a copied page
  const handlePastePage = useCallback(async () => {
    if (!copiedPage || !zineId) return;

    try {
      // Ensure all editors are properly cleaned up
      await cleanupActiveEditors();

      // Add extra delay to ensure DOM is settled
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create a new page in the database
      const newPage = await createPage(zineId);

      // First, update the state with a new page that has no elements yet
      // This ensures the DOM container for the page exists before elements are added
      const emptyNewPage = {
        ...newPage,
        elements: [],
        page_order: newPage.page_order || 0,
      };

      // Insert the empty page after the current page
      const updatedPagesWithEmptyPage = [
        ...pages.slice(0, currentPage + 1),
        emptyNewPage,
        ...pages.slice(currentPage + 1),
      ];

      setPages(updatedPagesWithEmptyPage);

      // Wait for the new page to be rendered in the DOM
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Then create elements for the new page in the database
      const newElements = await Promise.all(
        copiedPage.elements.map(async (element) => {
          // Create a deep copy of the element for the new page
          const createdElement = await createElement({
            page_id: newPage.id,
            type: element.type,
            content: element.content,
            position_x: element.position_x,
            position_y: element.position_y,
            width: element.width,
            height: element.height,
            scale: element.scale,
            z_index: element.z_index,
            filter: element.filter,
            crop: element.crop,
          });

          // Ensure proper typing for the element
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

      // Now update the page with the created elements
      const newPageWithElements = {
        ...newPage,
        elements: newElements,
        page_order: newPage.page_order || 0,
      };

      // Update state with the new page including elements
      const finalUpdatedPages = updatedPagesWithEmptyPage.map((page) =>
        page.id === newPage.id ? newPageWithElements : page
      );

      setPages(finalUpdatedPages);

      // Update page_order in database for all affected pages
      const supabase = createClient();

      // Get the current page's order
      const currentPageOrder = pages[currentPage].page_order || currentPage;

      // For all pages after the insertion point, increment their page_order
      const pagesToUpdate = pages.slice(currentPage + 1).map((page, index) => ({
        id: page.id,
        page_order: currentPageOrder + 2 + index,
        zine_id: zineId,
      }));

      // Update the new page's order to be right after the current page
      pagesToUpdate.unshift({
        id: newPage.id,
        page_order: currentPageOrder + 1,
        zine_id: zineId,
      });

      // Update all page orders in a single batch
      if (pagesToUpdate.length > 0) {
        await supabase
          .from("pages")
          .upsert(pagesToUpdate, { onConflict: "id" });
      }

      // Wait for everything to settle before changing the current page
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Set focus to the new page safely
      await cleanupActiveEditors();
      setPages(finalUpdatedPages);
    } catch (error) {
      console.error("Error pasting page:", error);
    }
  }, [copiedPage, pages, currentPage, zineId, cleanupActiveEditors, setPages]);

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
