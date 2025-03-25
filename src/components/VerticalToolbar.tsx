import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import PuzzlePieceIcon from "@heroicons/react/24/outline/PuzzlePieceIcon";
import LockClosedIcon from "@heroicons/react/24/outline/LockClosedIcon";
import LockOpenIcon from "@heroicons/react/24/outline/LockOpenIcon";
import ScissorsIcon from "@heroicons/react/24/outline/ScissorsIcon";
import { useState } from "react";
import { ImageDropZone } from "./ImageDropZone";

interface VerticalToolbarProps {
  elementId: string;
  currentFilter: string;
  onFilterChange: (id: string, filter: string) => void;
  disabled: boolean;
  addText: () => void;
  addImage: () => void;
  isLoadingPreview: boolean;
  scale: number;
  setScale: (scale: number) => void;
  addSticker: (stickerUrl: string) => void;
  privacy: string;
  togglePrivacy: () => void;
  isLoadingPrivacy?: boolean;
  onAutoLayoutImages: (files: File[]) => void;
  isProcessingAutoLayout: boolean;
  processingProgress?: { current: number; total: number } | null;
  setBackgroundColor: (color: string) => void;
  currentBackgroundColor?: string;
  removeImageBackground?: () => Promise<void>;
  isRemovingBackground?: boolean;
  hasSelectedImage?: boolean;
  zineId: string;
  generatePreview: () => void;
}

interface StickerCollection {
  title: string;
  items: Array<{
    url: string;
    alt: string;
  }>;
}

const FILTERS = [
  { name: "none", label: "Normal" },
  { name: "nostalgia", label: "Nostalgia" },
  { name: "polaroid", label: "Polaroid" },
  { name: "vintage", label: "Vintage" },
  { name: "noir", label: "Noir" },
  { name: "chrome", label: "Chrome" },
  { name: "sepia", label: "Sepia" },
  { name: "teal-white", label: "Teal White" },
  { name: "cherry-icecream", label: "Cherry Icecream" },
  { name: "x-rays", label: "X-Rays" },
];

const STICKER_COLLECTIONS: StickerCollection[] = [
  {
    title: "Polaroid Frames",
    items: [
      { url: "/stickers/polaroid/intax.png", alt: "Intax" },
      { url: "/stickers/polaroid/polaroid.png", alt: "Polaroid" },
      // Add more magic stickers
    ],
  },
  {
    title: "Travel Stickers",
    items: [
      { url: "/stickers/travel/airplane.png", alt: "Airplane" },
      // { url: "/stickers/travel/bus.png", alt: "Bus" },
      // { url: "/stickers/travel/train.png", alt: "Train" },
      // { url: "/stickers/travel/boat.png", alt: "Boat" },
      // { url: "/stickers/travel/car.png", alt: "Car" },
      // { url: "/stickers/travel/plane.png", alt: "Plane" },
      // { url: "/stickers/travel/ship.png", alt: "Ship" },
      // Add more vintage stickers
    ],
  },

  // {
  //   title: "Arrow stickers",
  //   items: [
  //     { url: "/stickers/arrows/pink-arrow.png", alt: "Pink Arrow" },
  //     { url: "/stickers/arrows/wavy-arrow.png", alt: "Wavy Arrow" },
  //     // Add more arrow stickers
  //   ],
  // },
  // {
  //   title: "Word stickers",
  //   items: [
  //     { url: "/stickers/words/accomplishments.png", alt: "Accomplishments" },
  //     { url: "/stickers/words/uplift.png", alt: "Uplift Each Other" },
  //     // Add more word stickers
  //   ],
  // },
  // {
  //   title: "Food stickers",
  //   items: [
  //     { url: "/stickers/food/tomatoes.png", alt: "Tomatoes" },
  //     { url: "/stickers/food/strawberry.png", alt: "Strawberry" },
  //     // Add more food stickers
  //   ],
  // },
];

export function VerticalToolbar({
  elementId,
  currentFilter,
  onFilterChange,
  disabled,
  addText,
  addImage,
  isLoadingPreview,
  scale,
  setScale,
  addSticker,
  privacy,
  togglePrivacy,
  isLoadingPrivacy = false,
  onAutoLayoutImages,
  isProcessingAutoLayout,
  processingProgress,
  setBackgroundColor,
  currentBackgroundColor,
  removeImageBackground,
  isRemovingBackground = false,
  hasSelectedImage = false,
  generatePreview,
}: VerticalToolbarProps) {
  const [isAddingSticker, setIsAddingSticker] = useState(false);
  const [expandedCollection, setExpandedCollection] = useState<string | null>(
    null
  );

  const isPublic = privacy === "public";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full gap-2 m-1">
        <button
          onClick={addText}
          className="p-1 w-10 h-10 bg-black text-white rounded hover:bg-gray-800 items-center flex justify-center"
        >
          <DocumentTextIcon className="size-6" />
        </button>
        <button
          onClick={addImage}
          className="p-1 w-10 h-10 bg-black text-white rounded hover:bg-gray-800 items-center flex justify-center"
        >
          <PhotoIcon className="size-6" />
        </button>
        <button
          onClick={() => setIsAddingSticker(!isAddingSticker)}
          className="p-1 w-10 h-10 bg-black text-white rounded hover:bg-gray-800 items-center flex justify-center"
        >
          <PuzzlePieceIcon className="size-6" />
        </button>
        <button
          onClick={generatePreview}
          disabled={isLoadingPreview}
          className={`p-1 w-10 h-10 rounded items-center flex justify-center ${
            isLoadingPreview
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {isLoadingPreview ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <EyeIcon className="size-6" />
          )}
        </button>
        <button
          onClick={togglePrivacy}
          disabled={isLoadingPrivacy}
          title={isPublic ? "Make private" : "Make public"}
          className={`p-1 w-10 h-10 rounded items-center flex justify-center ${
            isLoadingPrivacy
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          {isLoadingPrivacy ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : isPublic ? (
            <LockOpenIcon className="size-6" />
          ) : (
            <LockClosedIcon className="size-6" />
          )}
        </button>
        {removeImageBackground && (
          <button
            onClick={removeImageBackground}
            disabled={isRemovingBackground || !hasSelectedImage}
            title="Remove image background"
            className={`p-1 w-10 h-10 rounded items-center flex justify-center ${
              isRemovingBackground || !hasSelectedImage
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {isRemovingBackground ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <ScissorsIcon className="size-6" />
            )}
          </button>
        )}
      </div>
      <span className="text-gray-500 flex items-center gap-2 ml-2">
        {/* Scale: {Math.round(scale * 100)}% */}
        <input
          type="range"
          min="50"
          max="100"
          value={scale * 100}
          onChange={(e) => setScale(Number(e.target.value) / 100)}
          className="cursor-pointer"
        />{" "}
        <span className="text-gray-500 font-mono">
          {Math.round(scale * 100)}%
        </span>
      </span>

      <div className="mt-2 px-2 flex flex-col gap-2">
        <span className="text-gray-500 flex items-center gap-2">
          <label
            htmlFor="page-bg-color"
            className="text-sm font-medium text-gray-700"
          >
            Page Background:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="page-bg-color"
              value={currentBackgroundColor || "#ffffff"}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              title="Choose page background color"
            />
            <span className="text-xs font-mono">
              {currentBackgroundColor || "#ffffff"}
            </span>
          </div>
        </span>
      </div>

      <ImageDropZone
        onImagesSelected={onAutoLayoutImages}
        isProcessing={isProcessingAutoLayout}
        progress={processingProgress}
      />

      <div className="px-4 flex flex-col gap-2">
        {!disabled && (
          <>
            <h3 className="text-sm font-bold text-gray-900 mb-2 ">
              Image Filters
            </h3>
            <div className="flex flex-col gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter.name}
                  onClick={() => onFilterChange(elementId, filter.name)}
                  disabled={disabled}
                  className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                    currentFilter === filter.name
                      ? "bg-black text-white"
                      : "hover:bg-gray-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {isAddingSticker && (
        <div className="px-4 flex flex-col gap-2 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-900 mb-2">
            Stamps & Stickers
          </h3>
          {STICKER_COLLECTIONS.map((collection) => (
            <div key={collection.title} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm text-gray-700">{collection.title}</h4>
                <button
                  onClick={() =>
                    setExpandedCollection(
                      expandedCollection === collection.title
                        ? null
                        : collection.title
                    )
                  }
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {expandedCollection === collection.title
                    ? "Show less"
                    : "See all"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {collection.items
                  .slice(
                    0,
                    expandedCollection === collection.title ? undefined : 3
                  )
                  .map((sticker, index) => (
                    <button
                      key={index}
                      onClick={() => addSticker(sticker.url)}
                      className="p-2 bg-white rounded-lg hover:bg-gray-50 border border-gray-200"
                    >
                      <img
                        src={sticker.url}
                        alt={sticker.alt}
                        className="w-full h-auto object-contain"
                      />
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
