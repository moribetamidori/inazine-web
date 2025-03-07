import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/client";
import { Page } from "@/types/zine";
import React, { useEffect } from "react";
import { deletePage } from "@/lib/page";

interface ThumbnailProps {
  pages: Page[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  addNewPage: () => void;
  setPages: (pages: Page[]) => void;
}

interface SortablePageProps {
  id: string;
  index: number;
  isCurrentPage: boolean;
  onClick: () => void;
}

function SortablePage({
  id,
  index,
  isCurrentPage,
  onClick,
}: SortablePageProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      disabled: false, // Explicitly set disabled state
    });

  // Create a safe transform string
  const transformString = React.useMemo(() => {
    if (!transform) return "";
    const { x = 0, y = 0, scaleX = 1, scaleY = 1 } = transform;
    return `translate3d(${x}px, ${y}px, 0) scaleX(${scaleX}) scaleY(${scaleY})`;
  }, [transform]);

  const style = {
    transform: transformString,
    transition: transition || undefined,
  };

  // Separate click handler from drag functionality
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="w-full">
      <button
        onClick={handleClick}
        className={`w-full aspect-[3/4] rounded-lg transition-all ${
          isCurrentPage
            ? "ring-2 ring-black ring-offset-2"
            : "hover:bg-gray-200"
        }`}
      >
        <div
          {...listeners}
          className="w-full h-full bg-white border border-gray-300 rounded-lg flex items-center justify-center"
        >
          Page {index + 1}
        </div>
      </button>
    </div>
  );
}

export default function Thumbnail({
  pages,
  currentPage,
  setCurrentPage,
  addNewPage,
  setPages,
}: ThumbnailProps) {
  // Add these states to track thumbnail selection and mouse position
  const [isThumbnailSelected, setIsThumbnailSelected] = React.useState(false);
  const thumbnailContainerRef = React.useRef<HTMLDivElement>(null);
  // Use refs for mouse position instead of window properties
  const mousePositionRef = React.useRef({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100, // Increased to provide more time for clicking
        tolerance: 20, // Reduced for better precision
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over || active.id === over.id) {
      return;
    }

    const oldIndex = pages.findIndex((page) => page.id === active.id);
    const newIndex = pages.findIndex((page) => page.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newPages = arrayMove(pages, oldIndex, newIndex);

    // Update local state
    setPages(newPages);

    // Update page orders in database
    const supabase = createClient();
    await Promise.all(
      newPages.map((page, index) =>
        supabase.from("pages").update({ page_order: index }).eq("id", page.id)
      )
    );
  };

  // Handle page deletion
  const handleDeletePage = async () => {
    if (pages.length <= 1) {
      // Don't allow deleting the last page
      return;
    }

    try {
      const pageToDelete = pages[currentPage];

      // Delete the page from the database
      await deletePage(pageToDelete.id);

      // Update local state
      const newPages = [...pages];
      newPages.splice(currentPage, 1);

      // Update page orders in database
      const supabase = createClient();
      await Promise.all(
        newPages.map((page, index) =>
          supabase.from("pages").update({ page_order: index }).eq("id", page.id)
        )
      );

      // Update local state with new pages
      setPages(newPages);

      // Update current page index
      if (currentPage >= newPages.length) {
        setCurrentPage(newPages.length - 1);
      }
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  // Track when thumbnail is clicked
  const handleThumbnailClick = (index: number) => {
    setCurrentPage(index);
    setIsThumbnailSelected(true);
  };

  // Check if mouse is within thumbnail container
  const isMouseInThumbnailArea = (): boolean => {
    if (!thumbnailContainerRef.current) return false;

    const rect = thumbnailContainerRef.current.getBoundingClientRect();
    const { x: mouseX, y: mouseY } = mousePositionRef.current;

    return (
      mouseX >= rect.left &&
      mouseX <= rect.right &&
      mouseY >= rect.top &&
      mouseY <= rect.bottom
    );
  };

  // Track mouse position with ref
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Reset selection when clicking outside thumbnail area
    const handleGlobalClick = (e: MouseEvent) => {
      if (
        thumbnailContainerRef.current &&
        !thumbnailContainerRef.current.contains(e.target as Node)
      ) {
        setIsThumbnailSelected(false);
      }
    };

    window.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  // Add keyboard event listener for delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if an input field is focused
      const isInputFocused =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      // Only handle delete if:
      // 1. No input is focused
      // 2. We have a current page
      // 3. The thumbnail is selected
      // 4. Mouse is within the thumbnail area
      if (
        !isInputFocused &&
        (e.key === "Delete" || e.key === "Backspace") &&
        pages.length > 0 &&
        isThumbnailSelected &&
        isMouseInThumbnailArea()
      ) {
        e.preventDefault();
        handleDeletePage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, pages, isThumbnailSelected]);

  return (
    <div
      ref={thumbnailContainerRef}
      className="w-24 bg-gray-100 overflow-y-auto border-r border-gray-200 flex flex-col gap-2 p-2"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pages.map((page) => page.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2 w-full">
            {pages.map((page, index) => (
              <SortablePage
                key={page.id}
                id={page.id}
                index={index}
                isCurrentPage={currentPage === index}
                onClick={() => {
                  handleThumbnailClick(index);
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={addNewPage}
        className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-gray-400 hover:border-black hover:bg-gray-50 flex items-center justify-center"
      >
        <span className="text-2xl">+</span>
      </button>
    </div>
  );
}
