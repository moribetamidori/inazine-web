import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";

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
}: VerticalToolbarProps) {
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
    </div>
  );
}
