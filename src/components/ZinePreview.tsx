import { useRef, useEffect, useState, useCallback } from "react";
import { useFlipbook } from "../hooks/useFlipbook";
import ZinePage from "./ZinePage";
import { generatePreview as generateZinePreview } from "@/lib/zine";

import { useZinePages } from "@/hooks/useZinePages";
import { ReadOnlyPageRenderer } from "@/components/preview/ReadOnlyPageRenderer";

interface PreviewProps {
  onClose: () => void;
  zineId: string;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export default function ZinePreview({
  onClose,
  zineId,
  isLoading,
  setIsLoading,
}: PreviewProps) {
  const { pages } = useZinePages(zineId);
  const [currentPage, setCurrentPage] = useState(0);

  const flipbookRef = useRef<HTMLDivElement>(null);
  useFlipbook(flipbookRef);

  // State variables
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Define dimensions for preview
  const width = 900;
  const height = 1200;
  const cleanupActiveEditors = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    return new Promise((resolve) => setTimeout(resolve, 50));
  }, []);
  useEffect(() => {
    if (isLoading && pages.length > 0) {
      generatePreview();
    }
  }, [isLoading, pages]);

  const generatePreview = async () => {
    setIsLoading(true);

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
        zineId ?? ""
      );

      // Restore hidden state and current page
      pageRefs.current.forEach((ref, index) => {
        if (ref && currentHiddenPages[index]) {
          ref.classList.add("hidden");
        }
      });
      setCurrentPage(previousPage);

      setPreviewPages(images);
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
            <span className="ml-3 text-lg">Loading preview...</span>
          </div>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg">
          <h2 className="text-xl mb-4">No Preview Available</h2>
          <p className="mb-4">
            Unable to generate preview. Please try again later.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">Preview</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>

        {/* Display pages for debugging (visible) */}
        <div className="flex flex-col items-center gap-8 mb-8">
          <h3 className="text-xl font-semibold">Page Content Preview:</h3>
          {pages.map((page, pageIndex) => (
            <ReadOnlyPageRenderer
              key={page.id}
              pageData={page}
              pageRef={(el) => {
                pageRefs.current[pageIndex] = el;
              }}
            />
          ))}
        </div>

        <div className="flex justify-center w-full overflow-visible">
          <div
            ref={flipbookRef}
            className="flipbook"
            style={{
              width: "840px",
              height: "1120px",
              visibility: "hidden",
              opacity: 0,
              transformOrigin: "center center",
              transition: "opacity 0.3s ease-in-out",
            }}
          >
            {previewPages.map((pageUrl, index) =>
              pageUrl ? (
                <ZinePage key={index} pageUrl={pageUrl} index={index} />
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
