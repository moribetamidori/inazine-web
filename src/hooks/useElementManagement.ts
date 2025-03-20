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
  currentPageData: Page | null;
  setCurrentPageData: (page: Page) => void;
  width: number;
  height: number;
}

export function useElementManagement({
  currentPageData,
  setCurrentPageData,
  width,
  height,
}: UseElementManagementProps) {
  const [currentFilter, setCurrentFilter] = useState<string>("none");

  const addText = () => {
    if (!currentPageData?.id) return;
    addTextElement(
      currentPageData.id,
      width,
      height,
      currentPageData,
      setCurrentPageData
    );
  };

  const addImage = () => {
    if (!currentPageData?.id) return;
    addImageElement(
      currentPageData.id,
      width,
      height,
      currentPageData,
      setCurrentPageData
    );
  };

  const handleElementDragStop = async (id: string, x: number, y: number) => {
    await dragStop(id, x, y, currentPageData, setCurrentPageData);
  };

  const handleElementResize = async (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => {
    await resize(id, width, height, x, y, currentPageData, setCurrentPageData);
  };

  const handleElementMoveLayer = async (
    id: string,
    direction: "up" | "down"
  ) => {
    await moveLayer(id, direction, currentPageData, setCurrentPageData);
  };

  const handleDeleteElement = async (id: string) => {
    await deleteElement(id, currentPageData, setCurrentPageData);
  };

  const handleUpdateContent = async (id: string, content: string) => {
    await updateContent(id, content, currentPageData, setCurrentPageData);
  };

  const handleUpdateFilter = async (id: string, filter: string) => {
    await updateFilter(id, filter, currentPageData, setCurrentPageData);
  };

  const handleUpdateCrop = async (
    id: string,
    crop: { top: number; right: number; bottom: number; left: number }
  ) => {
    await updateCrop(id, crop, currentPageData, setCurrentPageData);
  };

  const handleFilterChange = (id: string, filter: string) => {
    handleUpdateFilter(id, filter);
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
