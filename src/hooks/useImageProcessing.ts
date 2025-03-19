import { useState } from "react";
import { Page } from "@/types/zine";
import { createElement } from "@/lib/element";
import { createPage } from "@/lib/page";
import { createLayoutForImages } from "@/lib/layout";
import { removeBackground } from "@imgly/background-removal";

interface UseImageProcessingProps {
  pages: Page[];
  setPages: (pages: Page[]) => void;
  currentPage: number;
  zineId?: string;
  selectedImageId: string | null;
  width: number;
  height: number;
  handleUpdateContent: (id: string, content: string) => Promise<void>;
}

export function useImageProcessing({
  pages,
  setPages,
  currentPage,
  zineId,
  selectedImageId,
  width,
  height,
  handleUpdateContent,
}: UseImageProcessingProps) {
  const [isProcessingAutoLayout, setIsProcessingAutoLayout] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  const handleAutoLayoutImages = async (files: File[]) => {
    const testCount = null;
    if (!zineId || files.length === 0) return;

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

      // If testCount is provided, only use that many images
      const imagesToUse = testCount
        ? processedImages.slice(0, testCount)
        : processedImages;

      // Shuffle the images for randomness
      const shuffledImages = [...imagesToUse].sort(() => Math.random() - 0.5);

      // Create a copy of the current pages
      let updatedPages = [...pages];
      let currentPageIndex = pages.length - 1;

      // If the current page already has elements, create a new page
      if (pages[currentPageIndex]?.elements.length > 0) {
        const newPage = await createPage(zineId);
        updatedPages = [
          ...updatedPages,
          { ...newPage, elements: [], page_order: newPage.page_order || 0 },
        ];
        currentPageIndex = updatedPages.length - 1;
      }

      // If testCount is provided, use all images on one page
      if (testCount) {
        // Get the current page
        let currentPage = updatedPages[currentPageIndex];

        if (!currentPage) {
          const newPage = await createPage(zineId);
          currentPage = {
            ...newPage,
            elements: [],
            page_order: newPage.page_order || 0,
          };
          updatedPages.push(currentPage);
          currentPageIndex = updatedPages.length - 1;
        }

        // Create a layout for these images
        const elements = await createLayoutForImages(
          shuffledImages,
          currentPage.id,
          width,
          height
        );

        // Add elements to the current page
        updatedPages[currentPageIndex] = {
          ...currentPage,
          elements: [...currentPage.elements, ...elements],
        };
      } else {
        // Original logic for distributing across multiple pages
        while (shuffledImages.length > 0) {
          // Biased random distribution favoring 1-2 images
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

          // Get the current page or create a new one if needed
          let currentPage = updatedPages[currentPageIndex];

          if (!currentPage) {
            const newPage = await createPage(zineId);
            currentPage = {
              ...newPage,
              elements: [],
              page_order: newPage.page_order || 0,
            };
            updatedPages.push(currentPage);
            currentPageIndex = updatedPages.length - 1;
          }

          // Take a batch of images
          const imageBatch = shuffledImages.splice(0, imagesPerPage);

          // Create a layout for these images
          const elements = await createLayoutForImages(
            imageBatch,
            currentPage.id,
            width,
            height
          );

          // Add elements to the current page
          updatedPages[currentPageIndex] = {
            ...currentPage,
            elements: [...currentPage.elements, ...elements],
          };

          // Move to next page for the next batch
          if (shuffledImages.length > 0) {
            const newPage = await createPage(zineId);
            updatedPages.push({
              ...newPage,
              elements: [],
              page_order: newPage.page_order || 0,
            });
            currentPageIndex = updatedPages.length - 1;
          }
        }
      }

      // Update pages state
      setPages(updatedPages);
    } catch (error) {
      console.error("Error in auto layout:", error);
    } finally {
      setIsProcessingAutoLayout(false);
    }
  };

  // Add background removal function
  const handleRemoveBackground = async () => {
    if (!selectedImageId) return;

    // Find the selected element
    const selectedElement = pages[currentPage]?.elements.find(
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
    if (!pages[currentPage]?.id) return;

    try {
      const img = new Image();
      img.src = stickerUrl;

      img.onload = async () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const defaultWidth = 200; // Default width for stickers
        const defaultHeight = defaultWidth / aspectRatio; // Calculate height based on aspect ratio

        const element = await createElement({
          page_id: pages[currentPage].id,
          type: "image",
          content: stickerUrl,
          position_x: width / 2 - defaultWidth / 2, // Center the sticker
          position_y: height / 2 - defaultHeight / 2,
          width: defaultWidth,
          height: defaultHeight,
          scale: 1,
          z_index: pages[currentPage].elements.length + 1,
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

        setPages(
          pages.map((page, index) =>
            index === currentPage
              ? { ...page, elements: [...page.elements, typedElement] }
              : page
          )
        );
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
