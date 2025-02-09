import { useState, useRef, useEffect, RefObject } from "react";
import Draggable from "react-draggable";
import type { DraggableEvent, DraggableData } from "react-draggable";
import type { Zine } from "@/types/zine";
import Image from "next/image";
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
  scale?: number;
}

function DraggableElement({
  element,
  scale,
  onDelete,
  onDragStop,
}: {
  element: Element;
  scale: number;
  onDelete: (id: string) => void;
  onDragStop: (id: string, x: number, y: number) => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

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
    onDragStop(element.id, data.x, data.y);
  };

  return (
    <Draggable
      nodeRef={nodeRef as RefObject<HTMLElement>}
      position={{ x: element.position.x, y: element.position.y }}
      scale={scale}
      onStop={handleDragStop}
    >
      <div ref={nodeRef} className="cursor-grab group absolute">
        {element.type === "text" ? (
          <div
            contentEditable
            suppressContentEditableWarning
            className="min-w-[100px] min-h-[20px] outline-none hover:border hover:border-dashed hover:border-gray-300"
            onDoubleClick={(e) => {
              e.currentTarget.setAttribute("contentEditable", "true");
              e.currentTarget.focus();
              e.currentTarget.classList.add(
                "border",
                "border-solid",
                "border-blue-500"
              );
            }}
            onBlur={(e) => {
              const content = e.currentTarget.textContent || "";
              if (content.trim() === "") {
                onDelete(element.id);
              } else {
                e.currentTarget.setAttribute("contentEditable", "false");
                e.currentTarget.classList.remove(
                  "border",
                  "border-solid",
                  "border-blue-500"
                );
              }
            }}
          >
            {element.content}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute -top-8 left-0 hidden group-hover:flex gap-1 bg-white shadow-md rounded px-2 py-1 z-10">
              <button
                onClick={() => onDelete(element.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
            {imageDimensions.width > 0 && (
              <Image
                src={element.content}
                alt="User uploaded"
                width={imageDimensions.width}
                height={imageDimensions.height}
                className="object-contain"
                style={{ pointerEvents: "none" }}
              />
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

  return (
    <div className="relative rounded-lg h-screen">
      <div className="flex justify-between bg-white">
        <div className="p-2">
          <h1 className="text-2xl font-bold">{zine?.title}</h1>
        </div>
        <div className=" z-10 bg-white border-b p-2 flex gap-2">
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
        className="relative bg-black h-[90vh] overflow-auto"
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
            }}
          >
            {elements.map((element) => (
              <DraggableElement
                key={element.id}
                element={element}
                scale={scale}
                onDelete={(id) =>
                  setElements(elements.filter((el) => el.id !== id))
                }
                onDragStop={handleDragStop}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
