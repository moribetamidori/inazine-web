import { Element } from "@/types/zine";
import { createElement } from "@/lib/element";

/**
 * Creates a layout for a batch of images on a zine page
 * @param imageUrls Array of image URLs to place on the page
 * @param pageId ID of the page to add elements to
 * @param canvasWidth Width of the canvas
 * @param canvasHeight Height of the canvas
 * @param forceLayout Optional parameter to force a specific layout type
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
  const forceLayout = true;

  // For multiple images, use a consistent aspect ratio for all containers
  const containerAspectRatio = 3 / 4; // Standard portrait aspect ratio

  // Determine layout type randomly, with some constraints
  let layoutType:
    | "singleFull"
    | "single"
    | "sideBySide"
    | "grid"
    | "verticalStack";

  // If forceLayout is provided, use it instead of random selection
  if (forceLayout) {
    layoutType = "singleFull";
  } else if (imageUrls.length === 1) {
    // With only one image, randomly choose between single and singleFull
    const randomValue = Math.random();
    if (randomValue < 0.5) {
      // 50% chance for singleFull (full canvas)
      layoutType = "singleFull";
    } else {
      // 50% chance for single (centered with padding)
      layoutType = "single";
    }
  } else {
    // For multiple images, randomly choose a layout
    const randomValue = Math.random();

    if (imageUrls.length === 2) {
      if (randomValue < 0.6) {
        // 60% chance to use side by side for 2 images (increased from 40%)
        layoutType = "sideBySide";
      } else {
        // 40% chance to use vertical stack for 2 images (increased from 30%)
        layoutType = "verticalStack";
      }
    } else if (imageUrls.length <= 4) {
      if (randomValue < 0.6) {
        // 60% chance to use vertical stack for 3-4 images (increased from 20%)
        layoutType = "verticalStack";
      } else {
        // 40% chance to use grid layout
        layoutType = "grid";
      }
    } else {
      // Default to grid layout for more than 4 images
      layoutType = "grid";
    }
  }

  console.log("layoutType", layoutType);
  switch (layoutType) {
    case "singleFull": {
      // Single image that spans the entire canvas
      const containerWidth = canvasWidth;
      const containerHeight = canvasHeight;
      const x = 0;
      const y = 0;

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

    case "single": {
      // Single centered image (can contain multiple stacked images)
      const containerWidth = canvasWidth * 0.7;
      const containerHeight = canvasHeight * 0.7;
      const x = (canvasWidth - containerWidth) / 2;
      const y = (canvasHeight - containerHeight) / 2;

      // If multiple images, stack them with slight offset
      for (let i = 0; i < imageUrls.length; i++) {
        const offsetX = i * 20; // Slight horizontal offset for stacking effect
        const offsetY = i * 20; // Slight vertical offset

        const element = await createElement({
          page_id: pageId,
          type: "image",
          content: imageUrls[i],
          position_x: x + offsetX,
          position_y: y + offsetY,
          width: containerWidth - (imageUrls.length - 1) * 20, // Adjust width for stacking
          height: containerHeight - (imageUrls.length - 1) * 20, // Adjust height for stacking
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

    case "sideBySide": {
      // Two or more images side by side with equal width
      const maxImagesPerRow = Math.min(imageUrls.length, 3); // Max 3 images side by side
      const containerWidth =
        (canvasWidth - (maxImagesPerRow + 1) * padding) / maxImagesPerRow;
      const containerHeight = containerWidth / containerAspectRatio; // Use fixed aspect ratio

      // Center vertically
      const startY = (canvasHeight - containerHeight) / 2;

      for (let i = 0; i < imageUrls.length; i++) {
        const col = i % maxImagesPerRow;
        const x = padding + col * (containerWidth + padding);
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

    case "verticalStack": {
      // Vertical stack layout (like in the example image)
      const containerWidth = canvasWidth * 0.9; // 80% of canvas width
      const containerHeight =
        (canvasHeight - (imageUrls.length + 1) * padding) / imageUrls.length;
      const x = (canvasWidth - containerWidth) / 2; // Center horizontally

      for (let i = 0; i < imageUrls.length; i++) {
        const y = padding + i * (containerHeight + padding);

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

    case "grid": {
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
