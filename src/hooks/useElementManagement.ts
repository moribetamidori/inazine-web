import { useState } from "react";
import { Page } from "@/types/zine";
import {
  handleDeleteElement as deleteElement,
  handleUpdateContent as updateContent,
  handleDragStop as dragStop,
  handleResize as resize,
  handleMoveLayer as moveLayer,
  addText as addTextElement,
  addImage as addImageElement,
  handleUpdateFilter as updateFilter,
  updateElementCrop as updateCrop,
} from "@/lib/element";

interface UseElementManagementProps {
  pages: Page[];
  setPages: (pages: Page[]) => void;
  currentPage: number;
  width: number;
  height: number;
}

export function useElementManagement({
  pages,
  setPages,
  currentPage,
  width,
  height,
}: UseElementManagementProps) {
  const [currentFilter, setCurrentFilter] = useState<string>("none");

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

  const handleElementDragStop = async (id: string, x: number, y: number) => {
    await dragStop(id, x, y, pages, currentPage, setPages);
  };

  const handleElementResize = async (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => {
    await resize(id, width, height, x, y, pages, currentPage, setPages);
  };

  const handleElementMoveLayer = async (
    id: string,
    direction: "up" | "down"
  ) => {
    await moveLayer(id, direction, pages, currentPage, setPages);
  };

  const handleDeleteElement = async (id: string) => {
    await deleteElement(id, pages, currentPage, setPages);
  };

  const handleUpdateContent = async (id: string, content: string) => {
    await updateContent(id, content, pages, currentPage, setPages);
  };

  const handleUpdateFilter = async (id: string, filter: string) => {
    await updateFilter(id, filter, pages, currentPage, setPages);
  };

  const handleUpdateCrop = async (
    id: string,
    crop: { top: number; right: number; bottom: number; left: number }
  ) => {
    await updateCrop(id, crop, pages, currentPage, setPages);
  };

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
  };

  return {
    addText,
    addImage,
    handleElementDragStop,
    handleElementResize,
    handleElementMoveLayer,
    handleDeleteElement,
    handleUpdateContent,
    handleUpdateFilter,
    handleUpdateCrop,
    currentFilter,
    setCurrentFilter,
    handleFilterChange,
  };
}
