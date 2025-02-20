import { useRef } from "react";
import { useFlipbook } from "../hooks/useFlipbook";
import ZinePage from "./ZinePage";

interface PreviewProps {
  pages: string[];
  onClose: () => void;
}

export default function ZinePreview({ pages, onClose }: PreviewProps) {
  const flipbookRef = useRef<HTMLDivElement>(null);
  useFlipbook(flipbookRef);
  if (pages.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">Preview</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>

        <div className="flex justify-center w-full">
          <div
            ref={flipbookRef}
            className="flipbook"
            style={{
              width: "840px",
              height: "1120px",
              visibility: "hidden",
              opacity: 0,
            }}
          >
            {pages.map((pageUrl, index) =>
              pageUrl ? (
                <ZinePage key={index} pageUrl={pageUrl} index={index} />
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
