import { Page } from "@/types/zine";

interface ThumbnailProps {
  pages: Page[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  addNewPage: () => void;
}

export default function Thumbnail({
  pages,
  currentPage,
  setCurrentPage,
  addNewPage,
}: ThumbnailProps) {
  return (
    <div className="w-24 bg-gray-100 overflow-y-auto border-r border-gray-200 flex flex-col gap-2 p-2">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`relative aspect-[3/4] rounded-lg transition-all ${
                currentPage === index
                  ? "ring-2 ring-black ring-offset-2"
                  : "hover:bg-gray-200"
              }`}
            >
              <div className="absolute inset-0 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                Page {index + 1}
                </div>
            </button>
          ))}
          <button
            onClick={addNewPage}
            className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-400 hover:border-black hover:bg-gray-50 flex items-center justify-center"
          >
            <span className="text-2xl">+</span>
          </button>
        </div>
  );
}
        