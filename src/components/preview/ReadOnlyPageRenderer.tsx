import { Page } from "@/types/zine";
import { ReadOnlyElement } from "./ReadOnlyElement";

interface ReadOnlyPageRendererProps {
  pageData: Page;
  pageRef?: (el: HTMLDivElement | null) => void;
}

export function ReadOnlyPageRenderer({
  pageData,
  pageRef,
}: ReadOnlyPageRendererProps) {
  if (!pageData) {
    return <div>No page data available</div>;
  }

  return (
    <div
      ref={pageRef}
      className="bg-white shadow-lg transition-all border border-gray-300 overflow-hidden"
      style={{
        width: 900,
        height: 1200,
        position: "relative",
      }}
    >
      {pageData.elements
        .sort((a, b) => a.z_index - b.z_index)
        .map((element, elemIndex) => (
          <ReadOnlyElement key={elemIndex} element={element} />
        ))}
    </div>
  );
}
