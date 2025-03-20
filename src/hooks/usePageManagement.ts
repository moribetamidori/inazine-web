import { useState, useCallback, MutableRefObject } from "react";
import {  Zine } from "@/types/zine";
import { createPage } from "@/lib/page";
import { generatePreview as generateZinePreview, updateZine } from "@/lib/zine";

interface UsePageManagementProps {
  zine?: Zine;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  thumbnailPages: Array<{ id: string; page_order: number }>;
  setThumbnailPages: (pages: Array<{ id: string; page_order: number }>) => void;
  pageRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  width: number;
  height: number;
  cleanupEditors?: boolean;
}

export function usePageManagement({
  zine,
  currentPage: currentPageIndex,
  setCurrentPage: setCurrentPageIndex,
  thumbnailPages,
  setThumbnailPages,
  pageRefs,
  width,
  height,
  cleanupEditors = true,
}: UsePageManagementProps) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [privacy, setPrivacy] = useState(zine?.privacy || "closed");
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(false);

  // Function to toggle privacy
  const togglePrivacy = async () => {
    if (!zine?.id) return;

    setIsLoadingPrivacy(true);
    try {
      const newPrivacy = privacy === "public" ? "closed" : "public";
      await updateZine(zine.id, { privacy: newPrivacy });
      setPrivacy(newPrivacy);
    } catch (error) {
      console.error("Error updating zine privacy:", error);
    } finally {
      setIsLoadingPrivacy(false);
    }
  };

  // Function to ensure editors are properly cleaned up
  const cleanupActiveEditors = useCallback(() => {
    if (!cleanupEditors) return Promise.resolve<void>(undefined);

    // Blur any active element
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Clear any text selection
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }

    // Force a small delay to ensure editor state is updated
    return new Promise<void>((resolve) => setTimeout(resolve, 50));
  }, [cleanupEditors]);

  // Update the setCurrentPage function to clean up editors first
  const safeSetCurrentPage = useCallback(
    async (pageIndex: number) => {
      await cleanupActiveEditors();
      setCurrentPageIndex(pageIndex);
    },
    [cleanupActiveEditors, setCurrentPageIndex]
  );

  // Function to add a new page
  const addNewPage = async () => {
    if (!zine?.id) return;

    try {
      const newPage = await createPage(zine.id);

      // Update thumbnails with the new page
      const newThumbnail = {
        id: newPage.id,
        page_order: thumbnailPages.length,
      };

      setThumbnailPages([...thumbnailPages, newThumbnail]);

      // Navigate to the new page
      setCurrentPageIndex(thumbnailPages.length);
    } catch (error) {
      console.error("Error creating new page:", error);
    }
  };

  // Function to generate preview
  const generatePreview = async () => {
    if (!zine?.id) return;

    setIsLoadingPreview(true);

    try {
      // First clean up any active editors
      await cleanupActiveEditors();

      // Store current page index
      const previousPageIndex = currentPageIndex;

      // Temporarily show the current page (remove hidden class)
      if (pageRefs.current[0]) {
        const wasHidden = pageRefs.current[0].classList.contains("hidden");
        pageRefs.current[0].classList.remove("hidden");

        // Wait for render
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Generate preview for the current page
        const filteredRefs = pageRefs.current.filter(
          (ref): ref is HTMLDivElement => ref !== null
        );

        const images = await generateZinePreview(
          filteredRefs,
          width,
          height,
          zine.id
        );

        // Restore hidden state if needed
        if (wasHidden) {
          pageRefs.current[0].classList.add("hidden");
        }

        // Return to the previous page index
        setCurrentPageIndex(previousPageIndex);

        return images;
      }

      return [];
    } catch (error) {
      console.error("Error generating preview:", error);
      return [];
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return {
    addNewPage,
    safeSetCurrentPage,
    cleanupActiveEditors,
    generatePreview,
    isLoadingPreview,
    privacy,
    togglePrivacy,
    isLoadingPrivacy,
  };
}
