import { MutableRefObject } from "react";
import { Page, Element } from "@/types/zine";
import { DraggableElement } from "../DraggableElement";

interface PageRendererProps {
  pages: Page[];
  currentPage: number;
  scale: number;
  width: number;
  height: number;
  pageRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  handleElementDragStop: (id: string, x: number, y: number) => Promise<void>;
  handleUpdateContent: (id: string, content: string) => Promise<void>;
  handleElementResize: (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => Promise<void>;
  handleElementMoveLayer: (
    id: string,
    direction: "up" | "down"
  ) => Promise<void>;
  handleUpdateFilter: (id: string, filter: string) => Promise<void>;
  handleUpdateCrop: (
    id: string,
    crop: { top: number; right: number; bottom: number; left: number }
  ) => Promise<void>;
  handleDeleteElement: (id: string) => Promise<void>;
  handleCopy: (element: Element) => void;
  handlePaste: () => Promise<void>;
  selectedImageId: string | null;
  handleImageSelect: (id: string) => void;
}

export function PageRenderer({
  pages,
  currentPage,
  scale,
  width,
  height,
  pageRefs,
  handleElementDragStop,
  handleUpdateContent,
  handleElementResize,
  handleElementMoveLayer,
  handleUpdateFilter,
  handleUpdateCrop,
  handleDeleteElement,
  handleCopy,
  handlePaste,
  selectedImageId,
  handleImageSelect,
}: PageRendererProps) {
  return (
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
                  onDelete={() => handleDeleteElement(element.id)}
                  onDragStop={handleElementDragStop}
                  onUpdateContent={handleUpdateContent}
                  onResize={handleElementResize}
                  onMoveLayer={handleElementMoveLayer}
                  isTopLayer={
                    index === (pages[currentPage]?.elements?.length ?? 0) - 1
                  }
                  isBottomLayer={index === 0}
                  canvasWidth={width}
                  canvasHeight={height}
                  onUpdateFilter={handleUpdateFilter}
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
  );
}
