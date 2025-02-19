import { useRef } from "react";
import { useFlipbook } from "../hooks/useFlipbook";
import ZinePage from "@/components/ZinePage";

interface ZineBookProps {
  pages: string[];
}

export default function ZineBook({ pages }: ZineBookProps) {
  const flipbookRef = useRef<HTMLDivElement>(null);
  useFlipbook(flipbookRef);

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
            <ZinePage key={index} pageUrl={pageUrl} index={index} />
          ) : null
        )}
      </div>
    </div>
  );
}
