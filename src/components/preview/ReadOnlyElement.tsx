import { Element } from "@/types/zine";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ReadOnlyElementProps {
  element: Element;
}

export function ReadOnlyElement({ element }: ReadOnlyElementProps) {
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (element.type === "image") {
      const img = new window.Image();
      img.src = element.content;
      img.onload = () => {
        // Scale down large images while maintaining aspect ratio
        const maxSize = 300;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        setImageDimensions({ width, height });
      };
    }
  }, [element]);

  if (element.type === "text") {
    return (
      <div
        className="absolute"
        style={{
          position: "absolute",
          left: element.position_x,
          top: element.position_y,
          zIndex: element.z_index,
        }}
        dangerouslySetInnerHTML={{ __html: element.content }}
      />
    );
  } else if (element.type === "image") {
    return (
      <>
        {imageDimensions.width > 0 && (
          <div
            className={`relative ${
              element.filter ? `filter-${element.filter}` : ""
            } `}
            style={{
              position: "absolute",
              left: element.position_x,
              top: element.position_y,
              zIndex: element.z_index,
              width:
                (element.width || imageDimensions.width) -
                (element.crop?.left || 0) -
                (element.crop?.right || 0),
              height:
                (element.height || imageDimensions.height) -
                (element.crop?.top || 0) -
                (element.crop?.bottom || 0),
              overflow: "hidden",
            }}
          >
            <Image
              src={element.content}
              alt="User uploaded"
              width={element.width || imageDimensions.width}
              height={element.height || imageDimensions.height}
              className="object-cover w-full h-full"
              style={{
                pointerEvents: "none",
                position: "absolute",
                top: element.crop?.top,
                left: element.crop?.left,
                width: element.width || imageDimensions.width,
                height: element.height || imageDimensions.height,
                maxWidth: "none",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          </div>
        )}
      </>
    );
  }

  return null;
}
