import { useState, useRef, useEffect, useCallback } from "react";
import type { Zine, Page } from "@/types/zine";
import ZinePreview from "./ZinePreview";
import { createPage } from "@/lib/page";
import {
  handleDeleteElement,
  handleUpdateContent,
  handleDragStop,
  handleResize,
  handleMoveLayer,
  addText as addTextElement,
  addImage as addImageElement,
  handleUpdateFilter,
  updateElementCrop,
} from "@/lib/element";
import { useZinePages } from "@/hooks/useZinePages";
import { DraggableElement } from "./DraggableElement";
import { generatePreview as generateZinePreview, updateZine } from "@/lib/zine";
import { Element } from "@/types/zine";
import { createElement } from "@/lib/element";
import { VerticalToolbar } from "./VerticalToolbar";
import Thumbnail from "@/components/Thumbnail";
import { createLayoutForImages } from "@/lib/layout";
import { removeBackground } from "@imgly/background-removal";

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
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [copiedElement, setCopiedElement] = useState<Element | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string>("none");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [privacy, setPrivacy] = useState(zine?.privacy || "closed");
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(false);
  const [isProcessingAutoLayout, setIsProcessingAutoLayout] = useState(false);
  const [currentBackgroundColor, setCurrentBackgroundColor] =
    useState<string>("#ffffff");
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [copiedPage, setCopiedPage] = useState<Page | null>(null);

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
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY;
      setScale((prevScale) => {
        const newScale = prevScale - delta * 0.001;
        return Math.min(Math.max(0.5, newScale), 3); // Limit scale between 0.5 and 3
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  const addText = () => {
    if (!pages[currentPage]?.id) return;
    addTextElement(
      pages[currentPage].id,
      width,
      height,
      pages,
      currentPage,
      setPages
    );
  };

  const addImage = () => {
    if (!pages[currentPage]?.id) return;
    addImageElement(
      pages[currentPage].id,
      width,
      height,
      pages,
      currentPage,
      setPages
    );
  };

  const addNewPage = async () => {
    if (!zine?.id) return;

    try {
      const newPage = await createPage(zine.id);
      const newPageWithElements = { ...newPage, elements: [] };
      
      // Update the pages state
      const updatedPages = [...pages, newPageWithElements];
      setPages(updatedPages);
      
      // Set to the correct index (length of updated array - 1)
      setCurrentPage(updatedPages.length - 1);
    } catch (error) {
      console.error("Error creating new page:", error);
    }
  };

  const handleElementDragStop = async (id: string, x: number, y: number) => {
    await handleDragStop(id, x, y, pages, currentPage, setPages);
  };

  const handleElementResize = async (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => {
    await handleResize(id, width, height, x, y, pages, currentPage, setPages);
  };

  const handleElementMoveLayer = async (
    id: string,
    direction: "up" | "down"
  ) => {
    await handleMoveLayer(id, direction, pages, currentPage, setPages);
  };

  const generatePreview = async () => {
    setIsLoadingPreview(true);

    try {
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

  const handleCopy = (element: Element) => {
    setCopiedElement(element);
  };

  const handlePaste = useCallback(async () => {
    if (!copiedElement || !pages[currentPage]?.id) {
      return;
    }

    const newElement = {
      ...copiedElement,
      id: `copy-${Date.now()}`,
      position_x: Math.min(
        copiedElement.position_x,
        width - (copiedElement.width || 100)
      ),
      position_y: Math.min(
        copiedElement.position_y,
        height - (copiedElement.height || 100)
      ),
    };

    try {
      console.log("Creating new element:", newElement); // Debug log
      const createdElement = await createElement({
        page_id: pages[currentPage].id,
        type: newElement.type,
        content: newElement.content,
        position_x: newElement.position_x,
        position_y: newElement.position_y,
        width: newElement.width,
        height: newElement.height,
        scale: newElement.scale,
        z_index: pages[currentPage].elements.length + 1,
        filter: newElement.filter,
        crop: null,
      });

      const typedElement: Element = {
        ...createdElement,
        type: createdElement.type as "text" | "image",
        filter: createdElement.filter as string,
        crop: createdElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      };

      setPages((prevPages) =>
        prevPages.map((page, index) =>
          index === currentPage
            ? { ...page, elements: [...page.elements, typedElement] }
            : page
        )
      );
    } catch (error) {
      console.error("Error pasting element:", error);
    }
  }, [copiedElement, pages, currentPage, width, height]);

  // Move the keyboard event listener higher in the component
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "v" && copiedElement) {
        e.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [copiedElement, handlePaste]);

  const handleImageSelect = (elementId: string) => {
    setSelectedImageId(elementId);
    const element = pages[currentPage]?.elements.find(
      (el) => el.id === elementId
    );
    if (element?.type === "image") {
      setCurrentFilter(element.filter || "none");
    }
  };

  const handleFilterChange = (filter: string) => {
    if (!selectedImageId) return;

    handleUpdateFilter(selectedImageId, filter, pages, currentPage, setPages);
    setCurrentFilter(filter);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only clear if clicking directly on the canvas container
    if (e.target === e.currentTarget) {
      setSelectedImageId(null);
      setCurrentFilter("none");
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

        const typedElement: Element = {
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

  const handleUpdateCrop = async (
    id: string,
    crop: { top: number; right: number; bottom: number; left: number }
  ) => {
    await updateElementCrop(id, crop, pages, currentPage, setPages);
  };

  const handleAutoLayoutImages = async (files: File[]) => {
    const testCount = null;
    if (!zine?.id || files.length === 0) return;

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

                // Check if HEIC format and convert if needed (reusing your existing code)
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
        const newPage = await createPage(zine.id);
        updatedPages = [...updatedPages, { ...newPage, elements: [] }];
        currentPageIndex = updatedPages.length - 1;
      }

      // If testCount is provided, use all images on one page
      if (testCount) {
        // Get the current page
        let currentPage = updatedPages[currentPageIndex];

        if (!currentPage) {
          const newPage = await createPage(zine.id);
          currentPage = { ...newPage, elements: [] };
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

          // Get the current page or create a new one if needed
          let currentPage = updatedPages[currentPageIndex];

          if (!currentPage) {
            const newPage = await createPage(zine.id);
            currentPage = { ...newPage, elements: [] };
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
            const newPage = await createPage(zine.id);
            updatedPages.push({ ...newPage, elements: [] });
            currentPageIndex = updatedPages.length - 1;
          }
        }
      }

      // Update pages state
      setPages(updatedPages);

      // Set current page to the last page created
      setCurrentPage(updatedPages.length - 1);
    } catch (error) {
      console.error("Error in auto layout:", error);
    } finally {
      setIsProcessingAutoLayout(false);
    }
  };

  const setBackgroundColor = useCallback(
    async (color: string) => {
      if (!pages[currentPage]?.id) return;

      // Check if there's already a background element (assumed to be at z-index 0)
      const existingBackgroundIndex = pages[currentPage]?.elements.findIndex(
        (el) => el.z_index === 0 && el.type === "image"
      );

      // Create a solid color image data URL
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/png");

      if (existingBackgroundIndex >= 0) {
        // Update existing background
        const updatedPages = [...pages];
        const updatedElements = [...updatedPages[currentPage].elements];
        updatedElements[existingBackgroundIndex] = {
          ...updatedElements[existingBackgroundIndex],
          content: dataUrl,
        };
        updatedPages[currentPage] = {
          ...updatedPages[currentPage],
          elements: updatedElements,
        };
        setPages(updatedPages);
      } else {
        // Create new background element
        try {
          const newElement = await createElement({
            page_id: pages[currentPage].id,
            type: "image",
            content: dataUrl,
            position_x: 0,
            position_y: 0,
            width: width,
            height: height,
            scale: 1,
            z_index: 0, // Set to 0 to ensure it's at the bottom
            filter: "none",
            crop: null,
          });

          setPages(
            pages.map((page, index) =>
              index === currentPage
                ? {
                    ...page,
                    elements: [
                      {
                        ...newElement,
                        type: newElement.type as "text" | "image",
                        filter: "none",
                        crop: null,
                      },
                      ...page.elements.map((el) => ({
                        ...el,
                        z_index: el.z_index + 1, // Increment z-index of all other elements
                      })),
                    ],
                  }
                : page
            )
          );
        } catch (error) {
          console.error("Error adding background element:", error);
        }
      }
    },
    [pages, currentPage, width, height, setPages]
  );

  // Remove the duplicate declaration and just keep this function
  const handleSetBackgroundColor = (color: string) => {
    setCurrentBackgroundColor(color);
    setBackgroundColor(color);
  };

  // Add this new function for background removal
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
        // Optional configuration parameters
        // publicPath: '/path-to-models/', // If you need to specify a custom path to the model files
        debug: false, // Disable debug logging unless needed
      });

      // Create a new URL for the processed image
      const processedImageUrl = URL.createObjectURL(processedImageBlob);

      // Update the element with the new image URL
      await handleUpdateContent(
        selectedImageId,
        processedImageUrl,
        pages,
        currentPage,
        setPages
      );
    } catch (error) {
      console.error("Failed to remove background:", error);
      // Could add an error notification here
    } finally {
      setIsRemovingBackground(false);
    }
  };

  // Function to copy the current page
  const handleCopyPage = useCallback(() => {
    if (!pages[currentPage]) return;
    setCopiedPage(pages[currentPage]);
  }, [pages, currentPage]);

  // Function to paste the copied page
  const handlePastePage = useCallback(async () => {
    if (!copiedPage || !zine?.id) return;

    try {
      // Create a new page in the database
      const newPage = await createPage(zine.id);

      // Create all elements from the copied page in the new page
      const newElements = await Promise.all(
        copiedPage.elements.map(async (element) => {
          // Create a deep copy of the element for the new page
          const createdElement = await createElement({
            page_id: newPage.id,
            type: element.type,
            content: element.content,
            position_x: element.position_x,
            position_y: element.position_y,
            width: element.width,
            height: element.height,
            scale: element.scale,
            z_index: element.z_index,
            filter: element.filter,
            crop: element.crop,
          });

          // Ensure proper typing for the element
          return {
            ...createdElement,
            type: createdElement.type as "text" | "image",
            filter: createdElement.filter as string,
            crop: createdElement.crop as {
              top: number;
              right: number;
              bottom: number;
              left: number;
            } | null,
          };
        })
      );

      // Update state with the new page and elements
      const newPageWithElements = { ...newPage, elements: newElements };

      // Insert the new page after the current page
      const updatedPages = [
        ...pages.slice(0, currentPage + 1),
        newPageWithElements,
        ...pages.slice(currentPage + 1),
      ];

      setPages(updatedPages);

      // Set focus to the new page
      setCurrentPage(currentPage + 1);
    } catch (error) {
      console.error("Error pasting page:", error);
    }
  }, [copiedPage, pages, currentPage, zine?.id]);

  // Add keyboard event listener for page copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if an input field is focused
      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) return;

      // Handle cmd/ctrl+c for copying page
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        // If an element is selected, let the element copy handler work
        if (!selectedImageId) {
          e.preventDefault();
          handleCopyPage();
        }
      }

      // Handle cmd/ctrl+v for pasting page
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        // If a page is copied and no element is being edited, paste the page
        if (
          copiedPage &&
          !selectedImageId &&
          !document.activeElement?.closest('[contenteditable="true"]')
        ) {
          e.preventDefault();
          handlePastePage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCopyPage, handlePastePage, selectedImageId, copiedPage]);

  return (
    <div className="relative rounded-lg h-screen">
      <div className="flex h-[90vh]">
        {/* Left sidebar with page thumbnails */}
        <Thumbnail
          pages={pages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          addNewPage={addNewPage}
          setPages={setPages}
        />
        {/* Main canvas area */}
        <div className="flex flex-1">
          <div
            ref={containerRef}
            className="relative bg-gray-50 flex-1 overflow-auto"
            onClick={handleCanvasClick}
          >
            <div className="min-h-full min-w-full flex flex-col items-center justify-center p-8 gap-8">
              {pages.map((page, pageIndex) => (
                <div
                  key={page.id}
                  ref={(el) => {
                    pageRefs.current[pageIndex] = el;
                  }}
                  className={`bg-white shadow-lg transition-all ${
                    pageIndex !== currentPage ? "hidden" : ""
                  }`}
                  style={{
                    width,
                    height,
                    transform: `scale(${scale})`,
                    transformOrigin: "top",
                    margin: `0px ${Math.max(((scale - 1) * width) / 2, 0)}px`,
                    position: "relative",
                  }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setSelectedImageId(null);
                      setCurrentFilter("none");
                    }
                  }}
                >
                  {/* Only render elements for the current page or during preview generation */}
                  {(pageIndex === currentPage || currentPage === -1) &&
                    page.elements
                      .sort((a, b) => a.z_index - b.z_index)
                      .map((element, index) => (
                        <DraggableElement
                          key={element.id}
                          element={element}
                          scale={scale}
                          onDelete={() =>
                            handleDeleteElement(
                              element.id,
                              pages,
                              currentPage,
                              setPages
                            )
                          }
                          onDragStop={handleElementDragStop}
                          onUpdateContent={(id, content) =>
                            handleUpdateContent(
                              id,
                              content,
                              pages,
                              currentPage,
                              setPages
                            )
                          }
                          onResize={handleElementResize}
                          onMoveLayer={handleElementMoveLayer}
                          isTopLayer={
                            index ===
                            (pages[currentPage]?.elements?.length ?? 0) - 1
                          }
                          isBottomLayer={index === 0}
                          canvasWidth={width}
                          canvasHeight={height}
                          onUpdateFilter={(id, filter) =>
                            handleUpdateFilter(
                              id,
                              filter,
                              pages,
                              currentPage,
                              setPages
                            )
                          }
                          onCopy={() => handleCopy(element)}
                          isSelected={element.id === selectedImageId}
                          onSelect={() => handleImageSelect(element.id)}
                          handlePaste={handlePaste}
                          onUpdateCrop={handleUpdateCrop}
                        />
                      ))}
                </div>
              ))}
            </div>
          </div>

          {/* Modified VerticalToolbar section */}
          <div className="w-60 bg-gray-100 border-l border-gray-200">
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
