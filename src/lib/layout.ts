import { Element } from "@/types/zine";
import { createElement } from "@/lib/element";

/**
 * Creates a layout for a batch of images on a zine page
 * @param imageUrls Array of image URLs to place on the page
 * @param pageId ID of the page to add elements to
 * @param canvasWidth Width of the canvas
 * @param canvasHeight Height of the canvas
 * @returns Promise resolving to an array of created elements
 */
export const createLayoutForImages = async (
  imageUrls: string[],
  pageId: string,
  canvasWidth: number,
  canvasHeight: number
): Promise<Element[]> => {
  const elements: Element[] = [];
  const padding = 40;
  const zIndexStart = 1;

  // For multiple images, use a consistent aspect ratio for all containers
  const containerAspectRatio = 3 / 4; // Standard portrait aspect ratio

  switch (imageUrls.length) {
    case 1: {
      // Single centered image
      const containerWidth = canvasWidth * 0.7;
      const containerHeight = canvasHeight * 0.7;
      const x = (canvasWidth - containerWidth) / 2;
      const y = (canvasHeight - containerHeight) / 2;

      const element = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: x,
        position_y: y,
        width: containerWidth,
        height: containerHeight,
        scale: 1,
        z_index: zIndexStart,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...element,
        type: element.type as "text" | "image",
        filter: element.filter as string,
        crop: element.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });
      break;
    }

    case 2: {
      // Two images side by side with equal width
      const containerWidth = (canvasWidth - 3 * padding) / 2;
      const containerHeight = containerWidth / containerAspectRatio; // Use fixed aspect ratio

      // Center vertically
      const startY = (canvasHeight - containerHeight) / 2;

      for (let i = 0; i < imageUrls.length; i++) {
        const x = padding + i * (containerWidth + padding);
        const y = startY;

        const element = await createElement({
          page_id: pageId,
          type: "image",
          content: imageUrls[i],
          position_x: x,
          position_y: y,
          width: containerWidth,
          height: containerHeight,
          scale: 1,
          z_index: zIndexStart + i,
          filter: "none",
          crop: null,
        });

        elements.push({
          ...element,
          type: element.type as "text" | "image",
          filter: element.filter as string,
          crop: element.crop as {
            top: number;
            right: number;
            bottom: number;
            left: number;
          } | null,
        });
      }
      break;
    }

    default: {
      // Grid layout for multiple images
      const cols = imageUrls.length <= 4 ? 2 : 3;
      const rows = Math.ceil(imageUrls.length / cols);

      // Fixed container width based on available space
      const containerWidth = (canvasWidth - (cols + 1) * padding) / cols;
      // Height based on fixed aspect ratio
      const containerHeight = containerWidth / containerAspectRatio;

      // Calculate total grid height
      const totalGridHeight = rows * containerHeight + (rows + 1) * padding;
      // Center grid vertically if needed
      const startY = Math.max(padding, (canvasHeight - totalGridHeight) / 2);

      for (let i = 0; i < imageUrls.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = padding + col * (containerWidth + padding);
        const y = startY + row * (containerHeight + padding);

        const element = await createElement({
          page_id: pageId,
          type: "image",
          content: imageUrls[i],
          position_x: x,
          position_y: y,
          width: containerWidth,
          height: containerHeight,
          scale: 1,
          z_index: zIndexStart + i,
          filter: "none",
          crop: null,
        });

        elements.push({
          ...element,
          type: element.type as "text" | "image",
          filter: element.filter as string,
          crop: element.crop as {
            top: number;
            right: number;
            bottom: number;
            left: number;
          } | null,
        });
      }
      break;
    }
  }

  return elements;
};
