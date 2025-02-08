import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Draggable from "react-draggable";

interface ZineCanvasProps {
  width?: number;
  height?: number;
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
  const nodeRef = useRef(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: element.position.x, y: element.position.y }}
      scale={scale}
      onStop={(e, data) => {
        onDragStop(element.id, data.x, data.y);
      }}
    >
      <div ref={nodeRef} className="cursor-grab group absolute">
        {element.type === "text" ? (
          <div
            contentEditable
            suppressContentEditableWarning
            className="min-w-[100px] min-h-[20px] outline-none hover:border hover:border-dashed hover:border-gray-300"
            onDoubleClick={(e) => {
              e.currentTarget.classList.add(
                "border",
                "border-solid",
                "border-blue-500"
              );
            }}
            onBlur={(e) => {
              e.currentTarget.classList.remove(
                "border",
                "border-solid",
                "border-blue-500"
              );
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
            <img
              src={element.content}
              alt="User uploaded"
              className="max-w-[300px] max-h-[300px] object-contain"
              style={{ pointerEvents: "none" }}
            />
          </div>
        )}
      </div>
    </Draggable>
  );
}

export default function ZineCanvas({
  width = 900,
  height = 1200,
}: ZineCanvasProps) {
  const [elements, setElements] = useState<Element[]>([]);
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

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
    <div className="relative overflow-hidden bg-gray-50 rounded-lg">
      <div className="sticky top-0 z-10 bg-white border-b p-2 flex gap-2">
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
        <span className="ml-4 text-sm text-gray-500">
          Scale: {Math.round(scale * 100)}%
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-auto flex items-center justify-center"
        style={{ height: "calc(100vh - 100px)", paddingTop: "100px" }}
      >
        <motion.div
          ref={canvasRef}
          className="relative bg-white shadow-lg"
          style={{
            width,
            height,
            scale,
            transformOrigin: "center",
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
        </motion.div>
      </div>
    </div>
  );
}
