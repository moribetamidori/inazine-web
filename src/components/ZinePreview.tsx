import { useRef, useEffect, useState, useCallback } from "react";
import { useFlipbook } from "../hooks/useFlipbook";
import { generatePreview as generateZinePreview } from "@/lib/zine";
import { jsPDF } from "jspdf";

import { useZinePages } from "@/hooks/useZinePages";
import { ReadOnlyPageRenderer } from "@/components/preview/ReadOnlyPageRenderer";
import ZineBook from "@/components/ZineBook";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

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
    if (isLoading && pages.length > 0 && !isGenerating) {
      generatePreview();
    }
  }, [isLoading, pages, isGenerating]);

  const generatePreview = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setIsLoading(true);
    setGeneratingProgress({ current: 0, total: pages.length });

    try {
      // First clean up any active editors
      console.time("cleanupActiveEditors");
      await cleanupActiveEditors();
      console.timeEnd("cleanupActiveEditors");

      console.time("loadAllPageElements");
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

      console.timeEnd("loadAllPageElements");

      console.time("loadAllPageElements");
      await loadAllPageElements();
      console.timeEnd("loadAllPageElements");

      const previousPage = currentPage;

      console.time("currentHiddenPages");
      const currentHiddenPages = pageRefs.current.map((ref) => {
        if (ref) {
          const wasHidden = ref.classList.contains("hidden");
          ref.classList.remove("hidden");
          return wasHidden;
        }
        return false;
      });
      console.timeEnd("currentHiddenPages");
      // Temporarily render all pages
      setCurrentPage(-1);

      console.time("setTimeout");
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.timeEnd("setTimeout");

      console.time("filteredRefs");
      const filteredRefs = pageRefs.current.filter(
        (ref): ref is HTMLDivElement => ref !== null
      );
      console.timeEnd("filteredRefs");

      console.time("generateZinePreview");
      const images = await generateZinePreview(
        filteredRefs,
        width,
        height,
        zineId ?? "",
        true,
        (pageIndex) => {
          setGeneratingProgress({
            current: pageIndex + 1,
            total: pages.length,
          });
        }
      );
      console.timeEnd("generateZinePreview");

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
      setIsGenerating(false);
      setGeneratingProgress(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (previewPages.length === 0) return;

    // Use higher quality settings for PDF generation
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [width, height],
      compress: false, // Disable compression for better quality
    });

    try {
      for (let i = 0; i < previewPages.length; i++) {
        if (i > 0) {
          pdf.addPage([width, height], "portrait");
        }

        const imgData = previewPages[i];
        // Improved image quality settings
        pdf.addImage({
          imageData: imgData,
          format: "PNG",
          x: 0,
          y: 0,
          width,
          height,
          compression: "NONE",
          alias: `page-${i}`,
        });
      }

      pdf.save(`zine-${zineId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={previewPages.length === 0}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>

        {previewPages.length > 0 ? (
          <ZineBook pages={previewPages} />
        ) : (
          <div className="flex justify-center items-center h-40 bg-gray-100 rounded mb-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
              <span className="ml-3 text-lg">
                {generatingProgress
                  ? `Loading preview... (Page ${generatingProgress.current}/${generatingProgress.total})`
                  : "Loading preview..."}
              </span>
            </div>
          </div>
        )}

        {/* Display pages for debugging (visible) */}
        <div className="flex flex-col items-center gap-8 mb-8">
          {/* <h3 className="text-xl font-semibold">Page Content Preview:</h3> */}
          {pages.map((page, pageIndex) => (
            <div key={page.id} className="hidden">
              <ReadOnlyPageRenderer
                key={page.id}
                pageData={page}
                pageRef={(el) => {
                  pageRefs.current[pageIndex] = el;
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
