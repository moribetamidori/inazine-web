import { useState, useRef, useEffect, useCallback } from "react";
import type { Zine } from "@/types/zine";
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
} from "@/lib/element";
import { useZinePages } from "@/hooks/useZinePages";
import { DraggableElement } from "./DraggableElement";
import { generatePreview as generateZinePreview } from "@/lib/zine";
import { Element } from "@/types/zine";
import { createElement } from "@/lib/element";
import { VerticalToolbar } from "./VerticalToolbar";
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
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [copiedElement, setCopiedElement] = useState<Element | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string>("none");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [allPagesLoaded, setAllPagesLoaded] = useState(false);

  // Add logging for page changes
  useEffect(() => {
    console.log("Current page changed:", {
      currentPage,
      totalPages: pages.length,
      visiblePageId: pages[currentPage]?.id,
    });
  }, [currentPage, pages]);

  // Track loading state of pages
  useEffect(() => {
    if (!pages.length) return;

    const loadAllPageElements = async () => {
      try {
        // Create an array of promises that resolve when each page's elements are loaded
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
        setAllPagesLoaded(true);
      } catch (error) {
        console.error("Error loading all pages:", error);
      }
    };

    loadAllPageElements();
  }, [pages]);

  // Handle zoom with trackpad/mouse wheel
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
      setPages([...pages, { ...newPage, elements: [] }]);
      setCurrentPage(pages.length);
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
    if (!allPagesLoaded) {
      console.warn("Cannot generate preview: all pages are not yet loaded");
      return;
    }

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
    setCurrentPage(-1); // Special value to trigger all pages render

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
  };

  const handleCopy = (element: Element) => {
    setCopiedElement(element);
  };

  const handlePaste = useCallback(async () => {
    if (!copiedElement || !pages[currentPage]?.id) return;

    const newElement = {
      ...copiedElement,
      id: `copy-${Date.now()}`,
      position_x: copiedElement.position_x + 10,
      position_y: copiedElement.position_y + 10,
    };

    try {
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
      });

      const typedElement: Element = {
        ...createdElement,
        type: createdElement.type as "text" | "image",
        filter: createdElement.filter as string,
      };

      setPages(
        pages.map((page, index) =>
          index === currentPage
            ? { ...page, elements: [...page.elements, typedElement] }
            : page
        )
      );
    } catch (error) {
      console.error("Error pasting element:", error);
    }
  }, [copiedElement, pages, currentPage]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle copy/paste keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === "c" && copiedElement) {
        e.preventDefault();
        handleCopy(copiedElement);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        e.preventDefault();
        handlePaste();
      }

      // Handle delete key
      if ((e.key === "Delete" || e.key === "Backspace") && selectedImageId) {
        e.preventDefault();
        handleDeleteElement(selectedImageId, pages, currentPage, setPages);
        setSelectedImageId(null); // Clear selection after delete
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [copiedElement, pages, currentPage, selectedImageId, handlePaste]);

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
              previewDisabled={!allPagesLoaded}
              scale={scale}
              setScale={setScale}
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
