import { useState, useRef, useEffect, RefObject } from "react";
import Draggable from "react-draggable";
import type { DraggableEvent, DraggableData } from "react-draggable";
import type { Zine, Page, Element } from "@/types/zine";
import Image from "next/image";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextEditorBubbleMenu } from "./TextEditorBubbleMenu";
import { FontSize } from "@tiptap/extension-font-size";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import html2canvas from "html2canvas";
import ZinePreview from "./ZinePreview";
import { createPage, getPagesByZineId } from "@/lib/page";
import { createElement, updateElement, deleteElement } from "@/lib/element";

interface ZineCanvasProps {
  width?: number;
  height?: number;
  zine?: Zine;
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
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
      }),
      TextStyle.configure({
        HTMLAttributes: {
          class: "text-style",
        },
      }),
      FontSize.configure({
        types: ["textStyle"],
      }),
      Color.configure({
        types: ["textStyle"],
      }),
    ],
    content: element.content,
    editable: isEditing,
    onCreate: ({ editor }) => {
      console.log("Editor created with content:", editor.getHTML());
      if (element.type === "text") {
        const content = editor.getHTML();
        onUpdateContent(element.id, content);
      }
    },
    onUpdate: ({ editor }) => {
      console.log("Editor content updated:", editor.getHTML());
      if (element.type === "text") {
        const content = editor.getHTML();
        onUpdateContent(element.id, content);
      }
    },
    onBlur: ({ editor }) => {
      console.log("Editor blur event, content:", editor.getHTML());
      console.log("Editor state:", editor.getJSON());
      setIsEditing(false);
      const content = editor.getHTML();
      onUpdateContent(element.id, content);
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
    const startWidth = element.width || imageDimensions.width;
    const startHeight = element.height || imageDimensions.height;
    const startPosition = {
      x: element.position_x,
      y: element.position_y,
    };
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
                <Image
                  src={element.content}
                  alt="User uploaded"
                  width={element.width || imageDimensions.width}
                  height={element.height || imageDimensions.height}
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
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load pages from database on mount
  useEffect(() => {
    if (!zine?.id) return;

    const fetchPages = async () => {
      try {
        const fetchedPages = await getPagesByZineId(zine.id);
        setPages(
          fetchedPages.map((page) => ({
            ...page,
            elements: page.elements.map((el) => ({
              ...el,
              type: el.type as "text" | "image",
            })),
          }))
        );
      } catch (error) {
        console.error("Error fetching pages:", error);
      }
    };

    fetchPages();
  }, [zine?.id]);

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

  const addText = async () => {
    if (!pages[currentPage]?.id) return;

    try {
      const newElement = await createElement({
        page_id: pages[currentPage].id,
        type: "text",
        content: "Double click to edit",
        position_x: width / 2 - 50,
        position_y: height / 2 - 10,
        scale: 1,
        z_index: pages[currentPage].elements.length + 1,
        width: null,
        height: null,
      });

      setPages(
        pages.map((page, index) =>
          index === currentPage
            ? {
                ...page,
                elements: [
                  ...page.elements,
                  { ...newElement, type: newElement.type as "text" | "image" },
                ],
              }
            : page
        )
      );
    } catch (error) {
      console.error("Error adding text element:", error);
    }
  };

  const addImage = async () => {
    if (!pages[currentPage]?.id) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const newElement = await createElement({
              page_id: pages[currentPage].id,
              type: "image",
              content: e.target?.result as string,
              position_x: width / 2 - 100,
              position_y: height / 2 - 100,
              scale: 1,
              z_index: pages[currentPage].elements.length + 1,
              width: null,
              height: null,
            });

            setPages(
              pages.map((page, index) =>
                index === currentPage
                  ? {
                      ...page,
                      elements: [
                        ...page.elements,
                        {
                          ...newElement,
                          type: newElement.type as "text" | "image",
                        },
                      ],
                    }
                  : page
              )
            );
          } catch (error) {
            console.error("Error adding image element:", error);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
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

  const handleDragStop = async (id: string, x: number, y: number) => {
    // Update local state first (optimistic update)
    setPages(
      pages.map((page, index) =>
        index === currentPage
          ? {
              ...page,
              elements: page.elements.map((el) =>
                el.id === id ? { ...el, position_x: x, position_y: y } : el
              ),
            }
          : page
      )
    );

    // Then update database
    try {
      await updateElement(id, { position_x: x, position_y: y });
    } catch (error) {
      console.error("Error updating element position:", error);
      // Optionally revert the optimistic update if the database update fails
      // You might want to add a toast notification here
    }
  };

  const handleResize = async (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => {
    // Update local state first (optimistic update)
    setPages(
      pages.map((page, index) =>
        index === currentPage
          ? {
              ...page,
              elements: page.elements.map((el) =>
                el.id === id
                  ? {
                      ...el,
                      width,
                      height,
                      position_x: x,
                      position_y: y,
                    }
                  : el
              ),
            }
          : page
      )
    );

    // Then update database
    try {
      await updateElement(id, {
        width,
        height,
        position_x: x,
        position_y: y,
      });
    } catch (error) {
      console.error("Error updating element size:", error);
      // Optionally revert the optimistic update if the database update fails
    }
  };

  const handleMoveLayer = async (id: string, direction: "up" | "down") => {
    const currentElements = [...pages[currentPage].elements];
    const elementIndex = currentElements.findIndex((el) => el.id === id);

    if (
      (direction === "up" && elementIndex === currentElements.length - 1) ||
      (direction === "down" && elementIndex === 0)
    ) {
      return;
    }

    const swapIndex = direction === "up" ? elementIndex + 1 : elementIndex - 1;

    // Update local state first
    const newElements = currentElements.map((el, idx) => {
      if (idx === elementIndex) {
        return {
          ...el,
          type: el.type as "text" | "image",
          z_index: direction === "up" ? el.z_index + 1 : el.z_index - 1,
        };
      }
      if (idx === swapIndex) {
        return {
          ...el,
          type: el.type as "text" | "image",
          z_index: direction === "up" ? el.z_index - 1 : el.z_index + 1,
        };
      }
      return { ...el, type: el.type as "text" | "image" };
    });

    newElements.sort((a, b) => a.z_index - b.z_index);

    setPages(
      pages.map((page, index) =>
        index === currentPage ? { ...page, elements: newElements } : page
      )
    );

    // Then update database
    try {
      await Promise.all([
        updateElement(currentElements[elementIndex].id, {
          z_index:
            direction === "up"
              ? currentElements[elementIndex].z_index + 1
              : currentElements[elementIndex].z_index - 1,
        }),
        updateElement(currentElements[swapIndex].id, {
          z_index:
            direction === "up"
              ? currentElements[swapIndex].z_index - 1
              : currentElements[swapIndex].z_index + 1,
        }),
      ]);
    } catch (error) {
      console.error("Error updating element layers:", error);
      // Optionally revert the optimistic update if the database update fails
    }
  };

  // Update the DraggableElement props to include onDelete handler
  const handleDeleteElement = async (id: string) => {
    try {
      await deleteElement(id);
      setPages(
        pages.map((page, idx) =>
          idx === currentPage
            ? {
                ...page,
                elements: page.elements.filter((el) => el.id !== id),
              }
            : page
        )
      );
    } catch (error) {
      console.error("Error deleting element:", error);
    }
  };

  const handleUpdateContent = async (id: string, content: string) => {
    try {
      console.log("Content being sent to database:", content); // Debug log
      await updateElement(id, { content });

      // Log the updated state
      setPages((prevPages) => {
        const newPages = prevPages.map((page, idx) =>
          idx === currentPage
            ? {
                ...page,
                elements: page.elements.map((el) =>
                  el.id === id ? { ...el, content } : el
                ),
              }
            : page
        );
        console.log("Updated pages state:", newPages[currentPage].elements); // Debug log
        return newPages;
      });
    } catch (error) {
      console.error("Error updating element content:", error);
    }
  };

  const generatePreview = async () => {
    const pageImages: string[] = [];
    const tempPages = document.createElement("div");
    tempPages.style.position = "absolute";
    tempPages.style.left = "-9999px";
    document.body.appendChild(tempPages);

    try {
      // Generate canvas for each page
      for (let i = 0; i < pages.length; i++) {
        const pageRef = pageRefs.current[i];
        if (pageRef) {
          const pageClone = pageRef.cloneNode(true) as HTMLElement;
          pageClone.style.transform = "scale(1)";
          pageClone.style.display = "block";
          tempPages.appendChild(pageClone);

          try {
            const canvas = await html2canvas(pageClone, {
              scale: 2,
              useCORS: true,
              backgroundColor: "white",
              width: width,
              height: height,
            });
            const imageUrl = canvas.toDataURL("image/png");
            pageImages.push(imageUrl);

            // // Debug: Show the generated image
            // console.log(`Generated Page ${i + 1}:`, imageUrl);

            // // Debug: Download the image
            // const link = document.createElement("a");
            // link.download = `zine-page-${i + 1}.png`;
            // link.href = imageUrl;
            // link.click();
          } catch (error) {
            console.error(`Error generating preview for page ${i + 1}:`, error);
          }

          tempPages.removeChild(pageClone);
        }
      }
    } finally {
      document.body.removeChild(tempPages);
    }

    setPreviewPages(pageImages);
    setIsPreviewOpen(true);
  };

  return (
    <div className="relative rounded-lg h-screen">
      <div className="flex justify-between bg-white">
        <div className="p-2">
          <h1 className="text-2xl font-bold">{zine?.title}</h1>
        </div>
        <div className="flex gap-4 p-2">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`px-4 py-2 rounded ${
                currentPage === index
                  ? "bg-black text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Page {index + 1}
            </button>
          ))}
          <button
            onClick={addNewPage}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            + Add Page
          </button>
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
          <button
            onClick={generatePreview}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Preview
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
                    onDelete={handleDeleteElement}
                    onDragStop={handleDragStop}
                    onUpdateContent={handleUpdateContent}
                    onResize={handleResize}
                    onMoveLayer={handleMoveLayer}
                    isTopLayer={
                      index === (pages[currentPage]?.elements?.length ?? 0) - 1
                    }
                    isBottomLayer={index === 0}
                    canvasWidth={width}
                    canvasHeight={height}
                  />
                ))}
            </div>
          ))}
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
