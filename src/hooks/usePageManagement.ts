import { useState, useCallback, MutableRefObject } from "react";
import { Page, Zine } from "@/types/zine";
import { createPage } from "@/lib/page";
import { generatePreview as generateZinePreview, updateZine } from "@/lib/zine";

interface UsePageManagementProps {
  zine?: Zine;
  pages: Page[];
  setPages: (pages: Page[]) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  width: number;
  height: number;
  setPreviewPages: (pages: string[]) => void;
  setIsPreviewOpen: (isOpen: boolean) => void;
  cleanupEditors?: boolean;
}

export function usePageManagement({
  zine,
  pages,
  setPages,
  currentPage,
  setCurrentPage,
  pageRefs,
  width,
  height,
  setPreviewPages,
  setIsPreviewOpen,
  cleanupEditors = true,
}: UsePageManagementProps) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [privacy, setPrivacy] = useState(zine?.privacy || "closed");
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(false);

  // Add this function to toggle privacy
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

  // Add this function to ensure editors are properly cleaned up
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
      setCurrentPage(pageIndex);
    },
    [cleanupActiveEditors, setCurrentPage]
  );

  const addNewPage = async () => {
    if (!zine?.id) return;

    try {
      const newPage = await createPage(zine.id);
      const newPageWithElements = { ...newPage, elements: [] };

      // Update the pages state
      const updatedPages = [...pages, newPageWithElements];
      setPages(updatedPages as Page[]);

      // Set to the correct index (length of updated array - 1)
      setCurrentPage(updatedPages.length - 1);
    } catch (error) {
      console.error("Error creating new page:", error);
    }
  };

  const generatePreview = async () => {
    setIsLoadingPreview(true);

    try {
      // First clean up any active editors
      await cleanupActiveEditors();

      // Load all page elements when preview is requested
      const loadAllPageElements = async () => {
        const loadPromises = pages.map((page) =>
          Promise.all(
            page.elements
              .filter((el) => el.type === "image")
              .map(
                (el) =>
                  new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(true);
                    img.onerror = () => reject();
                    img.src = el.content;
                  })
              )
          )
        );

        await Promise.all(loadPromises);
      };

      await loadAllPageElements();

      // Store current page
      const previousPage = currentPage;

      // Temporarily show all pages
      const currentHiddenPages = pageRefs.current.map((ref) => {
        if (ref) {
          const wasHidden = ref.classList.contains("hidden");
          ref.classList.remove("hidden");
          return wasHidden;
        }
        return false;
      });

      // Temporarily render all pages
      setCurrentPage(-1);

      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 100));

      const filteredRefs = pageRefs.current.filter(
        (ref): ref is HTMLDivElement => ref !== null
      );

      const images = await generateZinePreview(
        filteredRefs,
        width,
        height,
        zine?.id ?? ""
      );

      // Restore hidden state and current page
      pageRefs.current.forEach((ref, index) => {
        if (ref && currentHiddenPages[index]) {
          ref.classList.add("hidden");
        }
      });
      setCurrentPage(previousPage);

      setPreviewPages(images);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Error generating preview:", error);
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
