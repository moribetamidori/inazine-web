// src/components/ImageFilterMenu.tsx
interface ImageFilterMenuProps {
    currentFilter: string;
    onFilterChange: (filter: string) => void;
  }
  
  const FILTERS = [
    { name: "none", label: "Normal" },
    { name: "polaroid", label: "Polaroid" },
    { name: "vintage", label: "Vintage" },
    { name: "noir", label: "Noir" },
    { name: "chrome", label: "Chrome" },
    { name: "fade", label: "Fade" },
    { name: "warm", label: "Warm" },
    { name: "cool", label: "Cool" },
  ];
  
  export function ImageFilterMenu({ currentFilter, onFilterChange }: ImageFilterMenuProps) {
    return (
      <div className="absolute -right-40 top-0 w-36 bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="py-2">
          <h3 className="px-3 text-sm font-medium text-gray-900 mb-2">Filters</h3>
          {FILTERS.map((filter) => (
            <button
              key={filter.name}
              onClick={() => onFilterChange(filter.name)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                currentFilter === filter.name ? "bg-gray-100" : ""
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    );
  }