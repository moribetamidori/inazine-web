import { useState, useRef, useEffect, RefObject } from "react";
import Draggable from "react-draggable";
import type { DraggableEvent, DraggableData } from "react-draggable";
import type { Zine } from "@/types/zine";
import Image from "next/image";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextEditorBubbleMenu } from "./TextEditorBubbleMenu";
import { FontSize } from "@tiptap/extension-font-size";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";

interface ZineCanvasProps {
  width?: number;
  height?: number;
  zine?: Zine;
}

interface Element {
  id: string;
  type: "text" | "image";
  content: string;
  position: {
    x: number;
    y: number;
  };
  dimensions?: {
    width: number;
    height: number;
  };
  scale: number;
  zIndex: number;
}

function DraggableElement({
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
}: {
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
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, FontSize.configure(), TextStyle, Color],
    content: element.content,
    editable: isEditing,
    onBlur: ({ editor }) => {
      setIsEditing(false);
      onUpdateContent(element.id, editor.getHTML());
    },
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

    const startX = e.clientX;
    const startWidth = element.dimensions?.width || imageDimensions.width;
    const startHeight = element.dimensions?.height || imageDimensions.height;
    const startPosition = { ...element.position };
    const aspectRatio = startWidth / startHeight;

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startX) / scale;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosition.x;
      let newY = startPosition.y;

      switch (corner) {
        case "bottomRight":
          newWidth = startWidth + deltaX;
          newHeight = newWidth / aspectRatio;

          break;
        case "bottomLeft":
          newWidth = startWidth - deltaX;
          newHeight = newWidth / aspectRatio;
          newX = startPosition.x + startWidth - newWidth;
          newY = startPosition.y;
          break;
        case "topRight":
          newWidth = startWidth + deltaX;
          newHeight = newWidth / aspectRatio;
          newX = startPosition.x;
          newY = startPosition.y + (startHeight - newHeight);
          break;
        case "topLeft":
          newWidth = startWidth - deltaX;
          newHeight = newWidth / aspectRatio;
          newX = startPosition.x + (startWidth - newWidth);
          newY = startPosition.y + (startHeight - newHeight);
          break;
      }

      // Ensure minimum size
      if (newWidth >= 50 && newHeight >= 50) {
        onResize(element.id, newWidth, newHeight, newX, newY);
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <Draggable
      nodeRef={nodeRef as RefObject<HTMLElement>}
      position={{ x: element.position.x, y: element.position.y }}
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
        style={{ zIndex: element.zIndex }}
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
                <Image
                  src={element.content}
                  alt="User uploaded"
                  width={element.dimensions?.width || imageDimensions.width}
                  height={element.dimensions?.height || imageDimensions.height}
                  className="object-contain"
                  style={{ pointerEvents: "none" }}
                />
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
              </>
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
}

export default function ZineCanvas({
  width = 900,
  height = 1200,
  zine,
}: ZineCanvasProps) {
  const [elements, setElements] = useState<Element[]>([]);
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const newElement: Element = {
      id: `text-${Date.now()}`,
      type: "text",
      content: "Double click to edit",
      position: { x: width / 2 - 50, y: height / 2 - 10 },
      scale: 1,
      zIndex: elements.length + 1,
    };
    setElements([...elements, newElement]);
  };

  const addImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newElement: Element = {
            id: `image-${Date.now()}`,
            type: "image",
            content: e.target?.result as string,
            position: { x: width / 2 - 100, y: height / 2 - 100 },
            scale: 1,
            zIndex: elements.length + 1,
          };
          setElements([...elements, newElement]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleDragStop = (id: string, x: number, y: number) => {
    setElements((elements) =>
      elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            position: { x, y },
          };
        }
        return el;
      })
    );
  };

  const handleResize = (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => {
    setElements((elements) =>
      elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            dimensions: { width, height },
            position: { x, y },
          };
        }
        return el;
      })
    );
  };

  const handleMoveLayer = (id: string, direction: "up" | "down") => {
    setElements((prevElements) => {
      const elementIndex = prevElements.findIndex((el) => el.id === id);
      if (
        (direction === "up" && elementIndex === prevElements.length - 1) ||
        (direction === "down" && elementIndex === 0)
      ) {
        return prevElements;
      }

      const newElements = [...prevElements];
      const element = newElements[elementIndex];
      const swapIndex =
        direction === "up" ? elementIndex + 1 : elementIndex - 1;
      const swapElement = newElements[swapIndex];

      // Swap zIndex values
      const tempZIndex = element.zIndex;
      element.zIndex = swapElement.zIndex;
      swapElement.zIndex = tempZIndex;

      // Swap positions in array
      newElements[elementIndex] = swapElement;
      newElements[swapIndex] = element;

      return newElements;
    });
  };

  return (
    <div className="relative rounded-lg h-screen">
      <div className="flex justify-between bg-white">
        <div className="p-2">
          <h1 className="text-2xl font-bold">{zine?.title}</h1>
        </div>
        <div className="z-10 bg-white border-b p-2 flex gap-2">
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
          <span className="ml-4 text-gray-500 mt-1">
            Scale: {Math.round(scale * 100)}%
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative bg-gray-50 h-[90vh] overflow-auto"
      >
        <div className="min-h-full min-w-full flex items-center justify-center p-8">
          <div
            className="bg-white shadow-lg"
            style={{
              width,
              height,
              transform: `scale(${scale})`,
              transformOrigin: "top",
              margin: `0px ${Math.max(((scale - 1) * width) / 2, 0)}px`,
              position: "relative",
            }}
          >
            {elements
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((element, index) => (
                <DraggableElement
                  key={element.id}
                  element={element}
                  scale={scale}
                  onDelete={(id) => {
                    setElements(elements.filter((el) => el.id !== id));
                  }}
                  onDragStop={handleDragStop}
                  onUpdateContent={(id, content) =>
                    setElements(
                      elements.map((el) =>
                        el.id === id ? { ...el, content } : el
                      )
                    )
                  }
                  onResize={handleResize}
                  onMoveLayer={handleMoveLayer}
                  isTopLayer={index === elements.length - 1}
                  isBottomLayer={index === 0}
                  canvasWidth={width}
                  canvasHeight={height}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
