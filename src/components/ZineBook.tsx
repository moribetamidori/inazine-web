import Image from "next/image";
import { useRef, useEffect } from "react";

interface ZineBookProps {
  pages: string[];
}

export default function ZineBook({ pages }: ZineBookProps) {
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
    <div className="flex justify-center">
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
        {pages.map((pageUrl, index) =>
          pageUrl ? (
            <div key={index} className="page">
              <Image
                src={pageUrl}
                alt={`Page ${index + 1}`}
                width={840}
                height={600}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                priority={index === 0}
                onError={(e) => {
                  console.error(
                    `Failed to load image at index ${index}:`,
                    pageUrl
                  );
                  (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                }}
              />
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
