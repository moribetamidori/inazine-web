import { useState, useRef, useEffect, RefObject } from "react";
import Draggable from "react-draggable";
import type { DraggableEvent, DraggableData } from "react-draggable";
import type { Element } from "@/types/zine";
import Image from "next/image";
import { EditorContent } from "@tiptap/react";
import { TextEditorBubbleMenu } from "./TextEditorBubbleMenu";
import { handleImageResize } from "@/lib/element";
import { useZineEditor } from "@/hooks/useZineEditor";
import { ImageFilterMenu } from "./ImageFilterMenu";

interface DraggableElementProps {
  element: Element;
  scale: number;
  onDelete: (id: string) => void;
  onDragStop: (id: string, x: number, y: number) => void;
  onUpdateContent: (id: string, content: string) => void;
  onResize: (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
  canvasWidth: number;
  canvasHeight: number;
  isTopLayer: boolean;
  isBottomLayer: boolean;
  onUpdateFilter: (id: string, filter: string) => void;
}

export function DraggableElement({
  element,
  scale,
  onDelete,
  onDragStop,
  onUpdateContent,
  onResize,
  onMoveLayer,
  canvasWidth,
  canvasHeight,
  isTopLayer,
  isBottomLayer,
  onUpdateFilter,
}: DraggableElementProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const editor = useZineEditor({
    content: element.content,
    isEditing,
    elementId: element.id,
    elementType: element.type,
    onUpdateContent,
    onEditingEnd: () => setIsEditing(false),
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  useEffect(() => {
    if (element.type === "image") {
      const img = new window.Image();
      img.src = element.content;
      img.onload = () => {
        // Scale down large images while maintaining aspect ratio
        const maxSize = 300;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        setImageDimensions({ width, height });
      };
    }
  }, [element]);

  const handleDragStop = (e: DraggableEvent, data: DraggableData) => {
    const elementWidth = nodeRef.current?.offsetWidth || 0;
    const elementHeight = nodeRef.current?.offsetHeight || 0;

    // Constrain position within canvas boundaries
    const x = Math.min(Math.max(0, data.x), canvasWidth - elementWidth);
    const y = Math.min(Math.max(0, data.y), canvasHeight - elementHeight);

    onDragStop(element.id, x, y);
  };

  const handleDoubleClick = () => {
    if (element.type === "text") {
      setIsEditing(true);
    } else if (element.type === "image") {
      setIsResizing(!isResizing);
    }
  };

  const handleResize = (corner: string, e: MouseEvent) => {
    if (!nodeRef.current || element.type !== "image") return;

    handleImageResize({
      corner,
      e,
      scale,
      startWidth: element.width || imageDimensions.width,
      startHeight: element.height || imageDimensions.height,
      startPosition: {
        x: element.position_x,
        y: element.position_y,
      },
      onResize,
      elementId: element.id,
    });
  };

  return (
    <Draggable
      nodeRef={nodeRef as RefObject<HTMLElement>}
      position={{ x: element.position_x, y: element.position_y }}
      scale={scale}
      onStop={handleDragStop}
      bounds="parent"
      disabled={isEditing}
    >
      <div
        ref={nodeRef}
        className={`absolute ${
          isEditing ? "cursor-text" : "cursor-grab group"
        }`}
        style={{ zIndex: element.z_index }}
        onDoubleClick={handleDoubleClick}
      >
        {element.type === "text" ? (
          <div className="relative">
            <div className="absolute -top-8 left-0 hidden group-hover:flex gap-1 bg-white shadow-md rounded px-2 py-1 z-10">
              <button
                onClick={() => onMoveLayer(element.id, "up")}
                disabled={isTopLayer}
                className={`text-gray-700 hover:text-gray-900 ${
                  isTopLayer ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                ↑
              </button>
              <button
                onClick={() => onMoveLayer(element.id, "down")}
                disabled={isBottomLayer}
                className={`text-gray-700 hover:text-gray-900 ${
                  isBottomLayer ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                ↓
              </button>
              <button
                onClick={() => onDelete(element.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>

            <div className="min-w-[100px] p-2 relative">
              <EditorContent editor={editor} />
              {editor && <TextEditorBubbleMenu editor={editor} />}
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div className="absolute -top-8 left-0 hidden group-hover:flex gap-1 bg-white shadow-md rounded px-2 py-1 z-10">
              <button
                onClick={() => onMoveLayer(element.id, "up")}
                disabled={isTopLayer}
                className={`text-gray-700 hover:text-gray-900 ${
                  isTopLayer ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                ↑
              </button>
              <button
                onClick={() => onMoveLayer(element.id, "down")}
                disabled={isBottomLayer}
                className={`text-gray-700 hover:text-gray-900 ${
                  isBottomLayer ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                ↓
              </button>
              <button
                onClick={() => onDelete(element.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
            {imageDimensions.width > 0 && (
              <>
                <div
                  className={`relative ${
                    element.filter ? `filter-${element.filter}` : ""
                  }`}
                  onClick={handleDoubleClick}
                >
                  <Image
                    src={element.content}
                    alt="User uploaded"
                    width={element.width || imageDimensions.width}
                    height={element.height || imageDimensions.height}
                    className="object-contain"
                    style={{ pointerEvents: "none" }}
                  />
                </div>
                {isResizing && (
                  <>
                    <div
                      className="absolute w-3 h-3 bg-white border-2 border-black rounded-full cursor-nw-resize -top-1.5 -left-1.5"
                      onMouseDown={(e) =>
                        handleResize("topLeft", e.nativeEvent)
                      }
                    />
                    <div
                      className="absolute w-3 h-3 bg-white border-2 border-black rounded-full cursor-ne-resize -top-1.5 -right-1.5"
                      onMouseDown={(e) =>
                        handleResize("topRight", e.nativeEvent)
                      }
                    />
                    <div
                      className="absolute w-3 h-3 bg-white border-2 border-black rounded-full cursor-sw-resize -bottom-1.5 -left-1.5"
                      onMouseDown={(e) =>
                        handleResize("bottomLeft", e.nativeEvent)
                      }
                    />
                    <div
                      className="absolute w-3 h-3 bg-white border-2 border-black rounded-full cursor-se-resize -bottom-1.5 -right-1.5"
                      onMouseDown={(e) =>
                        handleResize("bottomRight", e.nativeEvent)
                      }
                    />
                  </>
                )}
                {!isResizing && element.type === "image" && (
                  <ImageFilterMenu
                    currentFilter={element.filter || "none"}
                    onFilterChange={(filter) =>
                      onUpdateFilter(element.id, filter)
                    }
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
}
