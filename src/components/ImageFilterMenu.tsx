// src/components/ImageFilterMenu.tsx
interface ImageFilterMenuProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  disabled?: boolean;
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

export function ImageFilterMenu({
  currentFilter,
  onFilterChange,
  disabled = false,
}: ImageFilterMenuProps) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">
        Image Filters
        {disabled && (
          <span className="block text-xs text-gray-500 mt-1">
            Select an image to apply filters
          </span>
        )}
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
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
