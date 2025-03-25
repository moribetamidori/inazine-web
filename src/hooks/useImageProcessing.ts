import { useState } from "react";
import { Page } from "@/types/zine";
import { createElement } from "@/lib/element";
import { createLayoutForImages } from "@/lib/layout";
import { removeBackground } from "@imgly/background-removal";
import { createPage } from "@/lib/page";
import { createClient } from "@/lib/supabase/client";

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
  const [processingProgress, setProcessingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const handleAutoLayoutImages = async (files: File[]) => {
    const testCount = null;
    if (!zineId || files.length === 0) return;

    setIsProcessingAutoLayout(true);
    setProcessingProgress({ current: 0, total: files.length });

    try {
      // Process all images first to get their data URLs
      let processedCount = 0;
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

                // After processing each image, update the progress
                processedCount++;
                setProcessingProgress({ current: processedCount, total: files.length });

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

      // If testCount is provided, only use that many images
      const imagesToUse = testCount
        ? processedImages.slice(0, testCount)
        : processedImages;

      // Shuffle the images for randomness
      const shuffledImages = [...imagesToUse].sort(() => Math.random() - 0.5);

      // Get current pages information from the database
      const supabase = createClient();
      const { data: pageList, error: pageError } = await supabase
        .from("pages")
        .select("id, page_order")
        .eq("zine_id", zineId)
        .order("page_order", { ascending: true });

      if (pageError) throw pageError;

      // Track created pages for updating UI
      const createdPageIds: string[] = [];

      // Check if we need to create a new page or if we can use the current one
      let currentPageHasElements = true;

      // If we have the current page data, check if it has elements
      if (currentPageData) {
        currentPageHasElements = currentPageData.elements.length > 0;
      } else if (pageList && pageList.length > 0) {
        // If we don't have current page data but have page list,
        // fetch the most recent page to check
        const lastPageId = pageList[pageList.length - 1].id;
        const { data: lastPage } = await supabase
          .from("pages")
          .select("*, elements(*)")
          .eq("id", lastPageId)
          .single();

        currentPageHasElements = Array.isArray(lastPage?.elements)
          ? lastPage.elements.length > 0
          : false;
      }

      // Create a new page if current page has elements
      let currentPageId: string;
      if (currentPageHasElements) {
        const newPage = await createPage(zineId);
        currentPageId = newPage.id;
        createdPageIds.push(currentPageId);
      } else {
        // Use the current page if it exists and is empty
        currentPageId =
          currentPageData?.id ||
          (pageList && pageList.length > 0
            ? pageList[pageList.length - 1].id
            : (await createPage(zineId)).id);
      }

      // If testCount is provided, use all images on one page
      if (testCount) {
        // Create a layout for these images
        const elements = await createLayoutForImages(
          shuffledImages,
          currentPageId,
          width,
          height
        );

        // If we're currently viewing this page, update its state
        if (currentPageData?.id === currentPageId) {
          setCurrentPageData({
            ...currentPageData,
            elements: [...currentPageData.elements, ...elements],
          });
        }
      } else {
        // Original logic for distributing across multiple pages
        while (shuffledImages.length > 0) {
          // Biased random distribution favoring 1-2 images, then 3-4, with fewer 5+ (but a bump at 7)
          let imagesPerPage;
          const rand = Math.random();

          if (rand < 0.8) {
            // 50% chance for 1-2 images
            imagesPerPage = Math.random() < 0.35 ? 1 : 2;
          } else if (rand < 0.85) {
            // 20% chance for 3-4 images
            imagesPerPage = Math.random() < 0.3 ? 3 : 4;
          } else if (rand < 0.9) {
            // 15% chance for 5-6 images
            imagesPerPage = Math.random() < 0.2 ? 5 : 6;
          } else if (rand < 0.95) {
            // 10% chance for exactly 7 images (the bump)
            imagesPerPage = 7;
          } else {
            // 5% chance for 8-9 images
            imagesPerPage = Math.random() < 0.2 ? 8 : 9;
          }

          // Ensure we don't try to use more images than we have
          imagesPerPage = Math.min(imagesPerPage, shuffledImages.length);

          // Take a batch of images
          const imageBatch = shuffledImages.splice(0, imagesPerPage);

          // Create a layout for these images
          const elements = await createLayoutForImages(
            imageBatch,
            currentPageId,
            width,
            height
          );

          // If we're currently viewing this page, update its state
          if (currentPageData?.id === currentPageId) {
            setCurrentPageData({
              ...currentPageData,
              elements: [...currentPageData.elements, ...elements],
            });
          }

          // Move to next page for the next batch if there are more images
          if (shuffledImages.length > 0) {
            const newPage = await createPage(zineId);
            currentPageId = newPage.id;
            createdPageIds.push(currentPageId);
          }
        }
      }

      // This is a signal to the parent component to update the current page index
      // to the last created page, which will trigger the page to load via useSinglePage
      if (createdPageIds.length > 0) {
        // Dispatch a custom event that the parent can listen for
        const event = new CustomEvent("pagesCreated", {
          detail: { pageIds: createdPageIds },
        });
        document.dispatchEvent(event);
      }

      // Instead of directly setting the current page, we'll return the ID
      // of the last created page so the parent component can handle navigation
      return currentPageId;
    } catch (error) {
      console.error("Error in auto layout:", error);
      return null;
    } finally {
      setIsProcessingAutoLayout(false);
      setProcessingProgress(null);
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
    processingProgress,
  };
}
