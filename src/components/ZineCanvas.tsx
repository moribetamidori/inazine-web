import { useState, useRef, useEffect } from "react";
import type { Zine } from "@/types/zine";
import { useSinglePage } from "@/hooks/useSinglePage";
import { usePageManagement } from "@/hooks/usePageManagement";
import { useElementManagement } from "@/hooks/useElementManagement";
import { useZoomControl } from "@/hooks/useZoomControl";
import { useBackgroundControl } from "@/hooks/useBackgroundControl";
import { useCopyPaste } from "@/hooks/useCopyPaste";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { CanvasContainer } from "@/components/canvas/CanvasContainer";
import { PageRenderer } from "@/components/canvas/PageRenderer";
import Thumbnail from "@/components/Thumbnail";
import { fetchPageThumbnails } from "@/lib/page";
import { PreviewManager } from "@/components/PreviewManager";

interface ZineCanvasProps {
  width?: number;
  height?: number;
  zine?: Zine;
}

export default function ZineCanvas({
  width = 900,
  height = 1200,
  zine,
}: ZineCanvasProps) {
  // State for page management
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [thumbnailPages, setThumbnailPages] = useState<
    Array<{ id: string; page_order: number }>
  >([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Use useSinglePage for the active editing page
  const {
    page: currentPage,
    setPage: setCurrentPage,
    loading: pageLoading,
  } = useSinglePage(zine?.id, currentPageIndex);

  // Only fetch thumbnails information, not full page content
  useEffect(() => {
    if (!zine?.id) return;

    const fetchThumbnails = async () => {
      try {
        // This would be a lightweight API call that only returns page IDs and order
        const thumbnails = await fetchPageThumbnails(zine.id);
        setThumbnailPages(
          thumbnails.map((page) => ({
            id: page.id,
            page_order: page.page_order ?? 0,
          }))
        );
      } catch (err) {
        console.error("Error fetching page thumbnails:", err);
      }
    };

    fetchThumbnails();
  }, [zine?.id]);

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Custom hooks for various functionalities
  const { scale, setScale, handleWheel } = useZoomControl(containerRef);

  const {
    addNewPage,
    safeSetCurrentPage,
    cleanupActiveEditors,
    privacy,
    togglePrivacy,
    isLoadingPrivacy,
  } = usePageManagement({
    zine,
    currentPage: currentPageIndex,
    setCurrentPage: setCurrentPageIndex,
    thumbnailPages,
    setThumbnailPages,
    pageRefs,
    width,
    height,
    cleanupEditors: true,
  });

  // Add this useEffect after the existing useEffect for fetching thumbnails
  useEffect(() => {
    const handlePagesCreated = async (
      event: CustomEvent<{ pageIds: string[] }>
    ) => {
      // Fetch updated thumbnails
      if (zine?.id) {
        try {
          const thumbnails = await fetchPageThumbnails(zine.id);
          setThumbnailPages(
            thumbnails.map((page) => ({
              id: page.id,
              page_order: page.page_order ?? 0,
            }))
          );

          // Navigate to the last created page
          if (event.detail.pageIds.length > 0) {
            // Find the index of the last created page in the updated thumbnails
            const lastPageId =
              event.detail.pageIds[event.detail.pageIds.length - 1];
            const lastPageIndex = thumbnails.findIndex(
              (page) => page.id === lastPageId
            );

            if (lastPageIndex !== -1) {
              safeSetCurrentPage(lastPageIndex);
            }
          }
        } catch (err) {
          console.error("Error updating thumbnails after page creation:", err);
        }
      }
    };

    // Add event listener
    document.addEventListener(
      "pagesCreated",
      handlePagesCreated as unknown as EventListener
    );

    // Cleanup
    return () => {
      document.removeEventListener(
        "pagesCreated",
        handlePagesCreated as unknown as EventListener
      );
    };
  }, [zine?.id, safeSetCurrentPage]);

  const {
    addText,
    addImage,
    handleElementDragStop,
    handleElementResize,
    handleElementMoveLayer,
    handleDeleteElement,
    handleUpdateContent,
    handleUpdateFilter,
    handleUpdateCrop,
    currentFilter,
    setCurrentFilter,
    handleFilterChange,
  } = useElementManagement({
    currentPageData: currentPage,
    setCurrentPageData: setCurrentPage,
    width,
    height,
  });

  const { handleCopy, handlePaste } = useCopyPaste({
    currentPageData: currentPage,
    setCurrentPageData: setCurrentPage,
    zineId: zine?.id,
    width,
    height,
    cleanupActiveEditors,
  });

  const { currentBackgroundColor, handleSetBackgroundColor } =
    useBackgroundControl({
      currentPageData: currentPage,
      setCurrentPageData: setCurrentPage,
      width,
      height,
    });

  const {
    isProcessingAutoLayout,
    handleAutoLayoutImages,
    isRemovingBackground,
    handleRemoveBackground,
    addSticker,
  } = useImageProcessing({
    currentPageData: currentPage,
    setCurrentPageData: setCurrentPage,
    zineId: zine?.id,
    selectedImageId,
    width,
    height,
    handleUpdateContent,
  });

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedImageId(null);
      setCurrentFilter("none");
    }
  };

  const handleImageSelect = (elementId: string) => {
    setSelectedImageId(elementId);
    const element = currentPage?.elements.find((el) => el.id === elementId);
    if (element?.type === "image") {
      setCurrentFilter(element.filter || "none");
    }
  };

  return (
    <div className="relative rounded-lg h-screen">
      <div className="flex h-[90vh]">
        {/* Left sidebar with page thumbnails - now using lightweight thumbnailPages */}
        <Thumbnail
          pages={thumbnailPages}
          currentPage={currentPageIndex}
          setCurrentPage={safeSetCurrentPage}
          addNewPage={addNewPage}
          setPages={setThumbnailPages}
        />

        {/* Main canvas area */}
        <div className="flex flex-1">
          <CanvasContainer
            ref={containerRef}
            handleWheel={handleWheel}
            handleCanvasClick={handleCanvasClick}
          >
            {pageLoading ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading page...</p>
              </div>
            ) : (
              <PageRenderer
                currentPageData={currentPage}
                scale={scale}
                width={width}
                height={height}
                pageRefs={pageRefs}
                handleElementDragStop={handleElementDragStop}
                handleUpdateContent={handleUpdateContent}
                handleElementResize={handleElementResize}
                handleElementMoveLayer={handleElementMoveLayer}
                handleUpdateFilter={handleUpdateFilter}
                handleUpdateCrop={handleUpdateCrop}
                handleDeleteElement={handleDeleteElement}
                handleCopy={handleCopy}
                handlePaste={handlePaste}
                selectedImageId={selectedImageId}
                handleImageSelect={handleImageSelect}
              />
            )}
          </CanvasContainer>

          {/* Replace VerticalToolbar with PreviewManager */}
          <PreviewManager
            elementId={selectedImageId ?? ""}
            currentFilter={currentFilter}
            onFilterChange={handleFilterChange}
            disabled={
              !selectedImageId ||
              !currentPage?.elements.find(
                (el) => el.id === selectedImageId && el.type === "image"
              )
            }
            addText={addText}
            addImage={addImage}
            scale={scale}
            setScale={setScale}
            addSticker={addSticker}
            privacy={privacy}
            togglePrivacy={togglePrivacy}
            isLoadingPrivacy={isLoadingPrivacy}
            onAutoLayoutImages={handleAutoLayoutImages}
            isProcessingAutoLayout={isProcessingAutoLayout}
            setBackgroundColor={handleSetBackgroundColor}
            currentBackgroundColor={currentBackgroundColor}
            removeImageBackground={handleRemoveBackground}
            isRemovingBackground={isRemovingBackground}
            hasSelectedImage={
              !!currentPage?.elements.find(
                (el) => el.id === selectedImageId && el.type === "image"
              )
            }
            zineId={zine?.id ?? ""}
            isPreviewOpen={isPreviewOpen}
            setIsPreviewOpen={setIsPreviewOpen}
          />
        </div>
      </div>
    </div>
  );
}
