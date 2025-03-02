import { useState, useRef, useEffect, RefObject } from "react";
import Draggable from "react-draggable";
import type { DraggableEvent, DraggableData } from "react-draggable";
import type { Element } from "@/types/zine";
import Image from "next/image";
import { EditorContent } from "@tiptap/react";
import { TextEditorBubbleMenu } from "./TextEditorBubbleMenu";
import { handleImageResize } from "@/lib/element";
import { useZineEditor } from "@/hooks/useZineEditor";

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
  onCopy: () => void;
  isSelected: boolean;
  onSelect: () => void;
  handlePaste: () => void;
  onUpdateCrop?: (
    id: string,
    crop: { top: number; right: number; bottom: number; left: number }
  ) => void;
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
  onCopy,
  isSelected,
  onSelect,
  onUpdateCrop,
}: DraggableElementProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const cropSideRef = useRef<"top" | "right" | "bottom" | "left" | null>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Initialize crop values from element.crop if it exists, otherwise use defaults
  const [cropValues, setCropValues] = useState(
    element.crop || {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }
  );

  const editor = useZineEditor({
    content: element.content,
    isEditing,
    elementId: element.id,
    elementType: element.type,
    onUpdateContent,
    onEditingEnd: () => {
      if (isEditing) {
        setIsEditing(false);
      }
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

  // Update the keyboard event listener to handle both delete and copy
  useEffect(() => {
    console.log("isEditing?", isEditing);
    const handleKeyDown = (e: KeyboardEvent) => {
      // Add check for active element type
      const isInputFocused = document.activeElement?.tagName === "INPUT";

      if (isSelected && !isEditing && !isInputFocused) {
        // Handle delete
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          onDelete(element.id);
        }

        // Handle copy
        if ((e.metaKey || e.ctrlKey) && e.key === "c") {
          e.preventDefault();
          console.log("Copying element:", element); // Debug log
          onCopy();
        }

        // Handle layer movement
        if (e.key === "[" && !isBottomLayer) {
          e.preventDefault();
          onMoveLayer(element.id, "down");
        }
        if (e.key === "]" && !isTopLayer) {
          e.preventDefault();
          onMoveLayer(element.id, "up");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isSelected,
    isEditing,
    element.id,
    onDelete,
    onCopy,
    onMoveLayer,
    isTopLayer,
    isBottomLayer,
    element,
  ]);

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
      onSelect();
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

  const handleCropStart = (
    side: "top" | "right" | "bottom" | "left",
    e: React.MouseEvent
  ) => {
    if (!nodeRef.current || element.type !== "image") return;

    console.log("CROP START:", side);
    e.stopPropagation();
    e.preventDefault();

    // Fully reset crop state before starting new crop
    setIsCropping(true);
    cropSideRef.current = side;

    // Save the initial mouse position and initial crop values
    const initialMousePosition = { x: e.clientX, y: e.clientY };
    const initialCropValues = { ...cropValues };

    // Define the move and end handlers within this closure to ensure they have access to the current state
    const handleMove = (moveEvent: MouseEvent) => {
      if (!cropSideRef.current) return;

      // Calculate deltas relative to the initial position instead of the last position
      const deltaX = (moveEvent.clientX - initialMousePosition.x) / scale;
      const deltaY = (moveEvent.clientY - initialMousePosition.y) / scale;

      console.log("CROP MOVE:", {
        side: cropSideRef.current,
        deltaX,
        deltaY,
        currentCrop: cropValues,
      });

      // Create a new object for the updated crop values, starting from initial values
      const newCropValues = { ...initialCropValues };
      const minVisible = 20;
      const maxWidth = element.width || imageDimensions.width;
      const maxHeight = element.height || imageDimensions.height;

      switch (cropSideRef.current) {
        case "left":
          newCropValues.left = Math.max(
            0,
            Math.min(
              maxWidth - minVisible - newCropValues.right,
              initialCropValues.left + deltaX
            )
          );
          break;
        case "right":
          newCropValues.right = Math.max(
            0,
            Math.min(
              maxWidth - minVisible - newCropValues.left,
              initialCropValues.right - deltaX
            )
          );
          break;
        case "top":
          newCropValues.top = Math.max(
            0,
            Math.min(
              maxHeight - minVisible - newCropValues.bottom,
              initialCropValues.top + deltaY
            )
          );
          break;
        case "bottom":
          newCropValues.bottom = Math.max(
            0,
            Math.min(
              maxHeight - minVisible - newCropValues.top,
              initialCropValues.bottom - deltaY
            )
          );
          break;
      }

      console.log("NEW CROP VALUES:", newCropValues);

      // Update state
      setCropValues(newCropValues);

      // Notify parent component
      if (onUpdateCrop) {
        onUpdateCrop(element.id, newCropValues);
      }
    };

    const handleEnd = () => {
      console.log("CROP END:", cropValues);

      if (element.type === "image") {
        finalizeCrop();
      }

      // Reset crop-related state
      setIsCropping(false);
      cropSideRef.current = null;

      // Clean up listeners
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
    };

    // Add event listeners
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
  };

  // A simplified function to finalize the crop
  const finalizeCrop = () => {
    if (element.type !== "image") return;

    // Only call onUpdateCrop if it exists
    if (onUpdateCrop) {
      onUpdateCrop(element.id, cropValues);
    }

    // For now, we'll just keep using the local state cropValues
    // until you implement the database changes
    console.log("Crop finalized:", cropValues);
  };

  return (
    <Draggable
      nodeRef={nodeRef as RefObject<HTMLElement>}
      position={{ x: element.position_x, y: element.position_y }}
      scale={scale}
      onStop={handleDragStop}
      bounds="parent"
      disabled={isEditing || isCropping}
    >
      <div
        ref={nodeRef}
        className={`absolute ${
          isEditing ? "cursor-text" : "cursor-grab group"
        } ${isSelected ? "ring-2 ring-black ring-offset-2" : ""}`}
        style={{ zIndex: element.z_index }}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => {
          e.stopPropagation(); // Prevent click from bubbling up to canvas
          onSelect(); // Call onSelect for both image and text elements
        }}
      >
        {element.type === "text" ? (
          <div className="relative">
            <div className="absolute -top-8 left-0 hidden gap-1 bg-white shadow-md rounded px-2 py-1 z-10"></div>

            <div className="min-w-[100px] p-2 relative text-[28px]">
              <EditorContent editor={editor} />
              {editor && <TextEditorBubbleMenu editor={editor} />}
              {isSelected && !isEditing && (
                <>
                  <div
                    className="absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-nw-resize -top-2.5 -left-2.5"
                    onMouseDown={(e) => handleResize("topLeft", e.nativeEvent)}
                  />
                  <div
                    className="absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-ne-resize -top-2.5 -right-2.5"
                    onMouseDown={(e) => handleResize("topRight", e.nativeEvent)}
                  />
                  <div
                    className="absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-sw-resize -bottom-2.5 -left-2.5"
                    onMouseDown={(e) =>
                      handleResize("bottomLeft", e.nativeEvent)
                    }
                  />
                  <div
                    className="absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-se-resize -bottom-2.5 -right-2.5"
                    onMouseDown={(e) =>
                      handleResize("bottomRight", e.nativeEvent)
                    }
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div className="absolute -top-8 left-0 hidden gap-1 bg-white shadow-md rounded px-2 py-1 z-10"></div>
            {imageDimensions.width > 0 && (
              <>
                <div
                  className={`relative ${
                    element.filter ? `filter-${element.filter}` : ""
                  }`}
                  onClick={handleDoubleClick}
                  style={{
                    width:
                      (element.width || imageDimensions.width) -
                      cropValues.left -
                      cropValues.right,
                    height:
                      (element.height || imageDimensions.height) -
                      cropValues.top -
                      cropValues.bottom,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <Image
                    src={element.content}
                    alt="User uploaded"
                    width={element.width || imageDimensions.width}
                    height={element.height || imageDimensions.height}
                    className="object-cover"
                    style={{
                      pointerEvents: "none",
                      position: "absolute",
                      top: -cropValues.top,
                      left: -cropValues.left,
                      bottom: -cropValues.bottom,
                      right: -cropValues.right,
                      maxWidth: "none", // Allow image to exceed container
                    }}
                  />

                  {/* Display current displayed dimensions */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      {Math.round(
                        (element.width || imageDimensions.width) -
                          cropValues.left -
                          cropValues.right
                      )}{" "}
                      ×{" "}
                      {Math.round(
                        (element.height || imageDimensions.height) -
                          cropValues.top -
                          cropValues.bottom
                      )}{" "}
                      px
                    </div>
                  )}
                </div>
                {element.type === "image" && isSelected && (
                  <>
                    {/* Corner resize handles */}
                    <div
                      className="absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-nw-resize -top-2.5 -left-2.5"
                      onMouseDown={(e) =>
                        handleResize("topLeft", e.nativeEvent)
                      }
                    />
                    <div
                      className="absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-ne-resize -top-2.5 -right-2.5"
                      onMouseDown={(e) =>
                        handleResize("topRight", e.nativeEvent)
                      }
                    />
                    <div
                      className="absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-sw-resize -bottom-2.5 -left-2.5"
                      onMouseDown={(e) =>
                        handleResize("bottomLeft", e.nativeEvent)
                      }
                    />
                    <div
                      className="absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-se-resize -bottom-2.5 -right-2.5"
                      onMouseDown={(e) =>
                        handleResize("bottomRight", e.nativeEvent)
                      }
                    />

                    {/* Crop handles on the middle of each side */}
                    <div
                      className="absolute h-5 w-12 bg-white border-2 border-black rounded-full cursor-ns-resize top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                      onMouseDown={(e) => handleCropStart("top", e)}
                    />
                    <div
                      className="absolute h-5 w-12 bg-white border-2 border-black rounded-full cursor-ns-resize bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10"
                      onMouseDown={(e) => handleCropStart("bottom", e)}
                    />
                    <div
                      className="absolute w-5 h-12 bg-white border-2 border-black rounded-full cursor-ew-resize left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                      onMouseDown={(e) => handleCropStart("left", e)}
                    />
                    <div
                      className="absolute w-5 h-12 bg-white border-2 border-black rounded-full cursor-ew-resize right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10"
                      onMouseDown={(e) => handleCropStart("right", e)}
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
