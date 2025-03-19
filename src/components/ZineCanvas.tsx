import { useState, useRef } from "react";
import type { Zine } from "@/types/zine";
import ZinePreview from "./ZinePreview";
import { useZinePages } from "@/hooks/useZinePages";
import { usePageManagement } from "@/hooks/usePageManagement";
import { useElementManagement } from "@/hooks/useElementManagement";
import { useZoomControl } from "@/hooks/useZoomControl";
import { useBackgroundControl } from "@/hooks/useBackgroundControl";
import { useCopyPaste } from "@/hooks/useCopyPaste";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { CanvasContainer } from "@/components/canvas/CanvasContainer";
import { PageRenderer } from "@/components/canvas/PageRenderer";
import { VerticalToolbar } from "@/components/VerticalToolbar";
import Thumbnail from "@/components/Thumbnail";

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
  const { pages, setPages } = useZinePages(zine?.id);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Custom hooks for various functionalities
  const { scale, setScale, handleWheel } = useZoomControl(containerRef);

  const {
    addNewPage,
    safeSetCurrentPage,
    cleanupActiveEditors,
    generatePreview,
    isLoadingPreview,
    privacy,
    togglePrivacy,
    isLoadingPrivacy,
  } = usePageManagement({
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
    cleanupEditors: true,
  });

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
    pages,
    setPages,
    currentPage,
    width,
    height,
  });

  const {
    handleCopy,
    handlePaste,
  } = useCopyPaste({
    pages,
    setPages,
    currentPage,
    zineId: zine?.id,
    width,
    height,
    cleanupActiveEditors,
  });

  const {
    currentBackgroundColor,
    handleSetBackgroundColor,
  } = useBackgroundControl({
    pages,
    setPages,
    currentPage,
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
    pages,
    setPages,
    currentPage,
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
    const element = pages[currentPage]?.elements.find(
      (el) => el.id === elementId
    );
    if (element?.type === "image") {
      setCurrentFilter(element.filter || "none");
    }
  };

  return (
    <div className="relative rounded-lg h-screen">
      <div className="flex h-[90vh]">
        {/* Left sidebar with page thumbnails */}
        <Thumbnail
          pages={pages}
          currentPage={currentPage}
          setCurrentPage={safeSetCurrentPage}
          addNewPage={addNewPage}
          setPages={setPages}
        />

        {/* Main canvas area */}
        <div className="flex flex-1">
          <CanvasContainer
            ref={containerRef}
            handleWheel={handleWheel}
            handleCanvasClick={handleCanvasClick}
          >
            <PageRenderer
              pages={pages}
              currentPage={currentPage}
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
          </CanvasContainer>

          {/* Tools sidebar */}
          <VerticalToolbar
            currentFilter={currentFilter}
            onFilterChange={handleFilterChange}
            disabled={
              !selectedImageId ||
              !pages[currentPage]?.elements.find(
                (el) => el.id === selectedImageId && el.type === "image"
              )
            }
            addText={addText}
            addImage={addImage}
            generatePreview={generatePreview}
            isLoadingPreview={isLoadingPreview}
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
              !!pages[currentPage]?.elements.find(
                (el) => el.id === selectedImageId && el.type === "image"
              )
            }
          />
        </div>
      </div>

      {isPreviewOpen && (
        <ZinePreview
          pages={previewPages}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}
