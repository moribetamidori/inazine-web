import Image from "next/image";
import { useRef, useEffect } from "react";

interface PreviewProps {
  pages: string[];
  onClose: () => void;
}

export default function ZinePreview({ pages, onClose }: PreviewProps) {
  const flipbookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = flipbookRef.current;
    const timer = setTimeout(() => {
      if (element && window.$) {
        const $flipbook = window.$(element);

        // Initialize turn.js with specific options
        $flipbook.turn({
          width: 840,
          height: 600,
          autoCenter: true,
          display: "double",
          acceleration: true,
          elevation: 50,
          gradients: true,
        });

        // Show the flipbook after initialization
        $flipbook.css({
          visibility: "visible",
          opacity: 1,
        });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (element && window.$) {
        try {
          const $flipbook = window.$(element);
          if ($flipbook.data()?.turn) {
            $flipbook.turn("destroy").remove();
          }
        } catch (error) {
          console.log("Cleanup error:", error);
        }
      }
    };
  }, []);

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
              height: "600px",
              visibility: "hidden",
              opacity: 0,
            }}
          >
            {/* <div className="hard">
              <div className="p-4">
                <h1 className="text-2xl font-bold">Preview</h1>
              </div>
            </div> */}
            {pages.map((pageUrl, index) =>
              pageUrl ? (
                <div key={index} className="page relative overflow-hidden">
                  <Image
                    src={pageUrl}
                    alt={`Page ${index + 1}`}
                    width={840}
                    height={600}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                    priority={index === 0}
                    onError={(e) => {
                      console.error(
                        `Failed to load image at index ${index}:`,
                        pageUrl
                      );
                      (e.target as HTMLImageElement).src =
                        "/placeholder-image.jpg";
                    }}
                  />
                </div>
              ) : null
            )}
            {/* <div className="hard">
              <div className="p-4 text-center">
                <p>End of preview</p>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
