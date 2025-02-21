import { useState, useRef, useEffect } from "react";
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
    const filteredRefs = pageRefs.current.filter(
      (ref): ref is HTMLDivElement => ref !== null
    );
    const images = await generateZinePreview(
      filteredRefs,
      width,
      height,
      zine?.id ?? ""
    );
    setPreviewPages(images);
    setIsPreviewOpen(true);
  };

  return (
    <div className="relative rounded-lg h-screen">
      <div className="flex justify-between bg-white">
        <div className="p-2">
          <h1 className="text-2xl font-bold">{zine?.title}</h1>
        </div>
        <div className="z-10 bg-white border-b p-2 flex gap-2 items-center">
          <button
            onClick={addText}
            className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800"
          >
            Add Text
          </button>
          <button
            onClick={addImage}
            className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800"
          >
            Add Image
          </button>
          <button
            onClick={generatePreview}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Preview
          </button>
          <div className="flex items-center gap-2 ml-4">
            <input
              type="range"
              min="50"
              max="100"
              value={scale * 100}
              onChange={(e) => setScale(Number(e.target.value) / 100)}
              className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-gray-500 min-w-[80px]">
              Scale: {Math.round(scale * 100)}%
            </span>
          </div>
        </div>
      </div>
      <div className="flex h-[90vh]">
        {/* Left sidebar with page thumbnails */}
        <div className="w-48 bg-gray-100 overflow-y-auto border-r border-gray-200 flex flex-col gap-2 p-2">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`relative aspect-[3/4] rounded-lg transition-all ${
                currentPage === index
                  ? "ring-2 ring-black ring-offset-2"
                  : "hover:bg-gray-200"
              }`}
            >
              <div className="absolute inset-0 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                Page {index + 1}
              </div>
            </button>
          ))}
          <button
            onClick={addNewPage}
            className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-400 hover:border-black hover:bg-gray-50 flex items-center justify-center"
          >
            <span className="text-2xl">+</span>
          </button>
        </div>

        {/* Main canvas area */}
        <div
          ref={containerRef}
          className="relative bg-gray-50 flex-1 overflow-auto"
        >
          <div className="min-h-full min-w-full flex flex-col items-center justify-center p-8 gap-8">
            {pages.map((page, pageIndex) => (
              <div
                key={page.id}
                ref={(el) => {
                  pageRefs.current[pageIndex] = el;
                }}
                className={`bg-white shadow-lg ${
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
              >
                {page.elements
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
                        handleUpdateFilter(id, filter, pages, currentPage, setPages)
                      }
                    />
                  ))}
              </div>
            ))}
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
