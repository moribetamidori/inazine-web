import { useState, useCallback } from "react";
import { VerticalToolbar } from "./VerticalToolbar";
import ZinePreview from "./ZinePreview";

interface PreviewManagerProps {
  // Props for VerticalToolbar
  elementId: string;
  currentFilter: string;
  onFilterChange: (id: string, filter: string) => void;
  disabled: boolean;
  addText: () => void;
  addImage: () => void;
  scale: number;
  setScale: (scale: number) => void;
  addSticker: (stickerUrl: string) => void;
  privacy: string;
  togglePrivacy: () => void;
  isLoadingPrivacy?: boolean;
  onAutoLayoutImages: (files: File[]) => void;
  isProcessingAutoLayout: boolean;
  processingProgress?: { current: number; total: number } | null;
  setBackgroundColor: (color: string) => void;
  currentBackgroundColor?: string;
  removeImageBackground?: () => Promise<void>;
  isRemovingBackground?: boolean;
  hasSelectedImage?: boolean;
  zineId: string;

  // Props for preview control
  isPreviewOpen: boolean;
  setIsPreviewOpen: (isOpen: boolean) => void;
}

export function PreviewManager({
  elementId,
  currentFilter,
  onFilterChange,
  disabled,
  addText,
  addImage,
  scale,
  setScale,
  addSticker,
  privacy,
  togglePrivacy,
  isLoadingPrivacy = false,
  onAutoLayoutImages,
  isProcessingAutoLayout,
  processingProgress,
  setBackgroundColor,
  currentBackgroundColor,
  removeImageBackground,
  isRemovingBackground = false,
  hasSelectedImage = false,
  zineId,
  isPreviewOpen,
  setIsPreviewOpen,
}: PreviewManagerProps) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleGeneratePreview = useCallback(() => {
    setIsPreviewOpen(true);
    setIsLoadingPreview(true);
  }, [setIsPreviewOpen]);

  return (
    <>
      <VerticalToolbar
        elementId={elementId}
        currentFilter={currentFilter}
        onFilterChange={onFilterChange}
        disabled={disabled}
        addText={addText}
        addImage={addImage}
        isLoadingPreview={isLoadingPreview}
        scale={scale}
        setScale={setScale}
        addSticker={addSticker}
        privacy={privacy}
        togglePrivacy={togglePrivacy}
        isLoadingPrivacy={isLoadingPrivacy}
        onAutoLayoutImages={onAutoLayoutImages}
        isProcessingAutoLayout={isProcessingAutoLayout}
        processingProgress={processingProgress}
        setBackgroundColor={setBackgroundColor}
        currentBackgroundColor={currentBackgroundColor}
        removeImageBackground={removeImageBackground}
        isRemovingBackground={isRemovingBackground}
        hasSelectedImage={hasSelectedImage}
        zineId={zineId}
        generatePreview={handleGeneratePreview}
      />

      {isPreviewOpen && (
        <ZinePreview
          zineId={zineId}
          isLoading={isLoadingPreview}
          onClose={() => setIsPreviewOpen(false)}
          setIsLoading={setIsLoadingPreview}
        />
      )}
    </>
  );
}
