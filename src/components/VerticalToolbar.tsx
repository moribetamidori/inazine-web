import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import PuzzlePieceIcon from "@heroicons/react/24/outline/PuzzlePieceIcon";
import { useState } from "react";

interface VerticalToolbarProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  disabled: boolean;
  addText: () => void;
  addImage: () => void;
  generatePreview: () => void;
  isLoadingPreview: boolean;
  scale: number;
  setScale: (scale: number) => void;
  addSticker: (stickerUrl: string) => void;
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
  { name: "fade", label: "Fade" },
  { name: "warm", label: "Warm" },
  { name: "cool", label: "Cool" },
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
  currentFilter,
  onFilterChange,
  disabled,
  addText,
  addImage,
  generatePreview,
  isLoadingPreview,
  scale,
  setScale,
  addSticker,
}: VerticalToolbarProps) {
  const [isAddingSticker, setIsAddingSticker] = useState(false);
  const [expandedCollection, setExpandedCollection] = useState<string | null>(
    null
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full gap-2 m-2">
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
                  onClick={() => onFilterChange(filter.name)}
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
