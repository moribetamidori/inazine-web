import { useState } from "react";
import { Page } from "@/types/zine";
import { createElement } from "@/lib/element";
import { createLayoutForImages } from "@/lib/layout";
import { removeBackground } from "@imgly/background-removal";

interface UseImageProcessingProps {
  currentPageData: Page | null;
  setCurrentPageData: (page: Page) => void;
  zineId?: string;
  selectedImageId: string | null;
  width: number;
  height: number;
  handleUpdateContent: (id: string, content: string) => Promise<void>;
}

export function useImageProcessing({
  currentPageData,
  setCurrentPageData,
  zineId,
  selectedImageId,
  width,
  height,
  handleUpdateContent,
}: UseImageProcessingProps) {
  const [isProcessingAutoLayout, setIsProcessingAutoLayout] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  const handleAutoLayoutImages = async (files: File[]) => {
    if (!zineId || !currentPageData?.id || files.length === 0) return;

    setIsProcessingAutoLayout(true);

    try {
      // Process all images first to get their data URLs
      const processedImages = await Promise.all(
        files.map(async (file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                let imgSrc = e.target?.result as string;

                // Check if HEIC format and convert if needed
                const isHeic =
                  file.type === "image/heic" ||
                  file.name.toLowerCase().endsWith(".heic") ||
                  file.name.toLowerCase().endsWith(".heif");

                if (isHeic) {
                  try {
                    const heic2any = (await import("heic2any")).default;
                    const pngBlob = await heic2any({
                      blob: file,
                      toType: "image/png",
                      quality: 0.8,
                    });

                    imgSrc = await new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.readAsDataURL(pngBlob as Blob);
                    });
                  } catch (heicError) {
                    console.error("Error converting HEIC image:", heicError);
                  }
                }

                // Convert to WebP for better performance
                const img = new Image();
                img.src = imgSrc;

                await new Promise((resolve) => (img.onload = resolve));

                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Could not get canvas context");

                ctx.drawImage(img, 0, 0);
                const webpData = canvas.toDataURL("image/webp", 0.8);

                resolve(webpData);
              } catch (error) {
                reject(error);
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      // Shuffle the images for randomness
      const shuffledImages = [...processedImages].sort(
        () => Math.random() - 0.5
      );

      // Create a layout for these images on the current page
      const elements = await createLayoutForImages(
        shuffledImages,
        currentPageData.id,
        width,
        height
      );

      // Add elements to the current page
      setCurrentPageData({
        ...currentPageData,
        elements: [...currentPageData.elements, ...elements],
      });
    } catch (error) {
      console.error("Error in auto layout:", error);
    } finally {
      setIsProcessingAutoLayout(false);
    }
  };

  // Add background removal function
  const handleRemoveBackground = async () => {
    if (!selectedImageId || !currentPageData) return;

    // Find the selected element
    const selectedElement = currentPageData.elements.find(
      (el) => el.id === selectedImageId && el.type === "image"
    );

    if (!selectedElement) return;

    // Remove focus from any active editor elements to prevent editor-related errors
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsRemovingBackground(true);
    try {
      // Get the image URL from the selected element
      const imageUrl = selectedElement.content;

      // Process the image with background removal
      const blob = await fetch(imageUrl).then((r) => r.blob());
      const processedImageBlob = await removeBackground(blob, {
        debug: false, // Disable debug logging unless needed
      });

      // Create a new URL for the processed image
      const processedImageUrl = URL.createObjectURL(processedImageBlob);

      // Update the element with the new image URL
      await handleUpdateContent(selectedImageId, processedImageUrl);
    } catch (error) {
      console.error("Failed to remove background:", error);
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const addSticker = async (stickerUrl: string) => {
    if (!currentPageData?.id) return;

    try {
      const img = new Image();
      img.src = stickerUrl;

      img.onload = async () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const defaultWidth = 200; // Default width for stickers
        const defaultHeight = defaultWidth / aspectRatio; // Calculate height based on aspect ratio

        const element = await createElement({
          page_id: currentPageData.id,
          type: "image",
          content: stickerUrl,
          position_x: width / 2 - defaultWidth / 2, // Center the sticker
          position_y: height / 2 - defaultHeight / 2,
          width: defaultWidth,
          height: defaultHeight,
          scale: 1,
          z_index: currentPageData.elements.length + 1,
          filter: "none",
          crop: null,
        });

        const typedElement = {
          ...element,
          type: element.type as "text" | "image",
          filter: element.filter as string,
          crop: element.crop as {
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
      };
    } catch (error) {
      console.error("Error adding sticker:", error);
    }
  };

  return {
    isProcessingAutoLayout,
    handleAutoLayoutImages,
    isRemovingBackground,
    handleRemoveBackground,
    addSticker,
  };
}
