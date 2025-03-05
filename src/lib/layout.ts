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
  const forceLayout = false;

  // For multiple images, use a consistent aspect ratio for all containers
  const containerAspectRatio = 3 / 4; // Standard portrait aspect ratio

  // Determine layout type randomly, with some constraints
  let layoutType:
    | "singleFull"
    | "single"
    | "singleSquare"
    | "sideBySide"
    | "grid"
    | "verticalStack"
    | "mixedGrid"
    | "leftTwoGrid"
    | "rightTwoGrid"
    | "leftChessboard"
    | "rightChessboard"
    | "horizontalBand"
    | "horizontalSplit"
    | "overlayCenter"
    | "topHalf" // New layout
    | "bottomHalf"; // New layout

  // If forceLayout is provided, use it instead of random selection
  if (forceLayout) {
    layoutType = "topHalf"; // Changed to test the new layout
  } else if (imageUrls.length === 1) {
    // With only one image, randomly choose between layouts
    const randomValue = Math.random();
    if (randomValue < 0.3) {
      // 30% chance for singleFull (full canvas)
      layoutType = "singleFull";
    } else if (randomValue < 0.5) {
      // 20% chance for single (centered with padding)
      layoutType = "single";
    } else if (randomValue < 0.7) {
      // 20% chance for singleSquare (square in center)
      layoutType = "singleSquare";
    } else if (randomValue < 0.8) {
      // 10% chance for horizontalBand
      layoutType = "horizontalBand";
    } else if (randomValue < 0.9) {
      // 10% chance for topHalf
      layoutType = "topHalf";
    } else {
      // 10% chance for bottomHalf
      layoutType = "bottomHalf";
    }
  } else {
    // For multiple images, randomly choose a layout
    const randomValue = Math.random();

    if (imageUrls.length === 7) {
      // Use mixedGrid layout for exactly 7 images
      layoutType = "mixedGrid";
    } else if (imageUrls.length === 2) {
      if (randomValue < 0.4) {
        // 40% chance to use overlay layout for 2 images
        layoutType = "overlayCenter";
      } else if (randomValue < 0.45) {
        // 5% chance to use magazine layout for 2 images
        layoutType = "leftTwoGrid";
      } else if (randomValue < 0.5) {
        // 5% chance to use right-aligned layout for 2 images
        layoutType = "rightTwoGrid";
      } else if (randomValue < 0.55) {
        // 5% chance to use side by side for 2 images
        layoutType = "sideBySide";
      } else if (randomValue < 0.65) {
        // 10% chance to use vertical stack for 2 images
        layoutType = "verticalStack";
      } else {
        // 35% chance to use horizontalSplit for 2 images
        layoutType = "horizontalSplit";
      }
    } else if (imageUrls.length === 3) {
      // Add a condition for 3 images to use the chessboard layouts
      if (randomValue < 0.4) {
        layoutType = "leftChessboard";
      } else if (randomValue < 0.8) {
        layoutType = "rightChessboard";
      } else {
        // 20% chance for vertical stack for 3 images
        layoutType = "verticalStack";
      }
    } else if (imageUrls.length === 4) {
      // For 4 images, always use grid layout
      layoutType = "grid";
    } else {
      // For more than 4 images, use grid for specific counts that work well in grids
      if (imageUrls.length === 6 || imageUrls.length === 9) {
        // 2x3 grid for 6 images, 3x3 grid for 9 images
        layoutType = "grid";
      } else {
        // Always use grid for more than 4 images
        layoutType = "grid";
      }
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

    case "singleSquare": {
      // Single square image centered on the page
      const squareSize = Math.min(canvasWidth, canvasHeight) * 0.6; // 60% of the smaller dimension
      const x = (canvasWidth - squareSize) / 2;
      const y = (canvasHeight - squareSize) / 2;

      const element = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: x,
        position_y: y,
        width: squareSize,
        height: squareSize,
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
      let cols: number;
      let rows: number;

      // Determine grid dimensions based on image count
      if (imageUrls.length === 2) {
        cols = 2;
        rows = 1;
      } else if (imageUrls.length === 4) {
        cols = 2;
        rows = 2;
      } else if (imageUrls.length === 6) {
        cols = 3;
        rows = 2;
      } else if (imageUrls.length === 9) {
        cols = 3;
        rows = 3;
      } else {
        // Default grid dimensions for other counts
        cols = imageUrls.length <= 4 ? 2 : 3;
        rows = Math.ceil(imageUrls.length / cols);
      }

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

    case "leftTwoGrid": {
      // Magazine-style layout with two images on the left (top and bottom)
      // and space on the right for text

      // Images take up 70% of the canvas width (increased from 60%), leaving 30% for text
      const imageWidth = canvasWidth * 0.7 - padding * 2;

      // Calculate heights to ensure consistent padding
      const availableHeight = canvasHeight - padding * 3; // Top, middle, and bottom padding
      const imageHeight = availableHeight / 2;

      // Position for the top image
      const topImageX = padding;
      const topImageY = padding;

      // Position for the bottom image - use the same padding as the edges
      const bottomImageX = padding;
      const bottomImageY = topImageY + imageHeight + padding; // Just add one padding between images

      // Create top image
      const topElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: topImageX,
        position_y: topImageY,
        width: imageWidth,
        height: imageHeight,
        scale: 1,
        z_index: zIndexStart,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...topElement,
        type: topElement.type as "text" | "image",
        filter: topElement.filter as string,
        crop: topElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      // Create bottom image
      const bottomElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[1],
        position_x: bottomImageX,
        position_y: bottomImageY,
        width: imageWidth,
        height: imageHeight,
        scale: 1,
        z_index: zIndexStart + 1,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...bottomElement,
        type: bottomElement.type as "text" | "image",
        filter: bottomElement.filter as string,
        crop: bottomElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      break;
    }

    case "rightTwoGrid": {
      // Magazine-style layout with two images on the right (top and bottom)
      // and space on the left for text

      // Images take up 70% of the canvas width, leaving 30% for text
      const imageWidth = canvasWidth * 0.7 - padding * 2;

      // Calculate heights to ensure consistent padding
      const availableHeight = canvasHeight - padding * 3; // Top, middle, and bottom padding
      const imageHeight = availableHeight / 2;

      // Position for the top image - aligned to the right
      const topImageX = canvasWidth - imageWidth - padding;
      const topImageY = padding;

      // Position for the bottom image - aligned to the right
      const bottomImageX = canvasWidth - imageWidth - padding;
      const bottomImageY = topImageY + imageHeight + padding; // Just add one padding between images

      // Create top image
      const topElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: topImageX,
        position_y: topImageY,
        width: imageWidth,
        height: imageHeight,
        scale: 1,
        z_index: zIndexStart,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...topElement,
        type: topElement.type as "text" | "image",
        filter: topElement.filter as string,
        crop: topElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      // Create bottom image
      const bottomElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[1],
        position_x: bottomImageX,
        position_y: bottomImageY,
        width: imageWidth,
        height: imageHeight,
        scale: 1,
        z_index: zIndexStart + 1,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...bottomElement,
        type: bottomElement.type as "text" | "image",
        filter: bottomElement.filter as string,
        crop: bottomElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      break;
    }

    case "mixedGrid": {
      // Mixed grid layout with 3 images on top, 1 large image in middle, and 3 images on bottom
      // This layout requires exactly 7 images
      if (imageUrls.length !== 7) {
        // Fallback to grid layout if we don't have exactly 7 images
        layoutType = "grid";
        // Re-run the switch with grid layout
        return createLayoutForImages(
          imageUrls,
          pageId,
          canvasWidth,
          canvasHeight
        );
      }

      const smallImageWidth = (canvasWidth - 4 * padding) / 3; // Width for the small images (3 per row)
      const smallImageHeight = smallImageWidth; // Square small images

      const largeImageWidth = canvasWidth - 2 * padding; // Width for the large center image
      const largeImageHeight =
        canvasHeight - 2 * smallImageHeight - 4 * padding; // Height for large center image

      // Top row - 3 small images
      for (let i = 0; i < 3; i++) {
        const x = padding + i * (smallImageWidth + padding);
        const y = padding;

        const element = await createElement({
          page_id: pageId,
          type: "image",
          content: imageUrls[i],
          position_x: x,
          position_y: y,
          width: smallImageWidth,
          height: smallImageHeight,
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

      // Middle - 1 large image
      const largeImageX = padding;
      const largeImageY = padding + smallImageHeight + padding;

      const largeElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[3],
        position_x: largeImageX,
        position_y: largeImageY,
        width: largeImageWidth,
        height: largeImageHeight,
        scale: 1,
        z_index: zIndexStart + 3,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...largeElement,
        type: largeElement.type as "text" | "image",
        filter: largeElement.filter as string,
        crop: largeElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      // Bottom row - 3 small images
      for (let i = 0; i < 3; i++) {
        const x = padding + i * (smallImageWidth + padding);
        const y =
          padding + smallImageHeight + padding + largeImageHeight + padding;

        const element = await createElement({
          page_id: pageId,
          type: "image",
          content: imageUrls[i + 4], // Images 4, 5, 6
          position_x: x,
          position_y: y,
          width: smallImageWidth,
          height: smallImageHeight,
          scale: 1,
          z_index: zIndexStart + i + 4,
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

    case "leftChessboard": {
      // Chessboard layout with 3 images in a diagonal pattern from top-left
      // This layout works best with exactly 3 images
      if (imageUrls.length !== 3) {
        // Fallback to grid layout if we don't have exactly 3 images
        return createLayoutForImages(
          imageUrls,
          pageId,
          canvasWidth,
          canvasHeight
        );
      }

      // Calculate dimensions for the images with safety margins
      const baseWidth = Math.min(canvasWidth, canvasHeight) * 0.38; // Base width
      const baseHeight = baseWidth * 1.2; // Make height 20% taller than width

      // Make images wider while keeping the increased height
      const imageHeight = baseHeight;
      const imageWidth = baseWidth * 1.2; // 20% wider than base width

      // Extension amount
      const extension = 25;

      // Calculate total width and height needed with extensions
      const totalWidth = imageWidth * 2 + extension; // First image + second image + extension
      const totalHeight = imageHeight * 3; // Three images stacked vertically

      // Check if we need to scale down to fit canvas
      const widthScale = (canvasWidth - padding * 2) / totalWidth;
      const heightScale = (canvasHeight - padding * 2) / totalHeight;
      const scale = Math.min(widthScale, heightScale, 1); // Don't scale up, only down if needed

      // Apply scaling if necessary
      const finalWidth = imageWidth * scale;
      const finalHeight = imageHeight * scale;
      const scaledExtension = extension * scale;

      // Center the pattern horizontally - adjust to make it more centered
      // Calculate the total width including all extensions
      const patternTotalWidth = finalWidth * 2 + scaledExtension;
      const startX =
        (canvasWidth - patternTotalWidth) / 2 + scaledExtension / 2; // Adjust to center properly
      const startY = (canvasHeight - finalHeight * 3) / 2;

      // Create the three images with specific extensions
      // First image - extended to the left
      const firstElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: startX - scaledExtension, // Extended left by scaledExtension
        position_y: startY,
        width: finalWidth + scaledExtension, // Wider to account for extension
        height: finalHeight,
        scale: 1,
        z_index: zIndexStart,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...firstElement,
        type: firstElement.type as "text" | "image",
        filter: firstElement.filter as string,
        crop: firstElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      // Second image - extended to the right
      const secondElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[1],
        position_x: startX + finalWidth, // Normal position
        position_y: startY + finalHeight,
        width: finalWidth + scaledExtension, // Wider to account for extension
        height: finalHeight,
        scale: 1,
        z_index: zIndexStart + 1,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...secondElement,
        type: secondElement.type as "text" | "image",
        filter: secondElement.filter as string,
        crop: secondElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      // Third image - extended to the left
      const thirdElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[2],
        position_x: startX - scaledExtension, // Extended left by scaledExtension
        position_y: startY + finalHeight * 2,
        width: finalWidth + scaledExtension, // Wider to account for extension
        height: finalHeight,
        scale: 1,
        z_index: zIndexStart + 2,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...thirdElement,
        type: thirdElement.type as "text" | "image",
        filter: thirdElement.filter as string,
        crop: thirdElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      break;
    }

    case "rightChessboard": {
      // Chessboard layout with 3 images in a diagonal pattern from top-right
      // This layout works best with exactly 3 images
      if (imageUrls.length !== 3) {
        // Fallback to grid layout if we don't have exactly 3 images
        return createLayoutForImages(
          imageUrls,
          pageId,
          canvasWidth,
          canvasHeight
        );
      }

      // Calculate dimensions for the images with safety margins
      const baseWidth = Math.min(canvasWidth, canvasHeight) * 0.38; // Base width
      const baseHeight = baseWidth * 1.2; // Make height 20% taller than width

      // Make images wider while keeping the increased height
      const imageHeight = baseHeight;
      const imageWidth = baseWidth * 1.2; // 20% wider than base width

      // Extension amount
      const extension = 25;

      // Calculate total width and height needed with extensions
      const totalWidth = imageWidth * 2 + extension; // First image + second image + extension
      const totalHeight = imageHeight * 3; // Three images stacked vertically

      // Check if we need to scale down to fit canvas
      const widthScale = (canvasWidth - padding * 2) / totalWidth;
      const heightScale = (canvasHeight - padding * 2) / totalHeight;
      const scale = Math.min(widthScale, heightScale, 1); // Don't scale up, only down if needed

      // Apply scaling if necessary
      const finalWidth = imageWidth * scale;
      const finalHeight = imageHeight * scale;
      const scaledExtension = extension * scale;

      // Center the pattern horizontally - mirror of leftChessboard
      const patternTotalWidth = finalWidth * 2 + scaledExtension;
      const startX = (canvasWidth - patternTotalWidth) / 2;
      const startY = (canvasHeight - finalHeight * 3) / 2;

      // First image - top right
      const firstElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: startX + finalWidth, // Right side position
        position_y: startY,
        width: finalWidth + scaledExtension,
        height: finalHeight,
        scale: 1,
        z_index: zIndexStart,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...firstElement,
        type: firstElement.type as "text" | "image",
        filter: firstElement.filter as string,
        crop: firstElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      // Second image - middle left
      const secondElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[1],
        position_x: startX - scaledExtension, // Extended left
        position_y: startY + finalHeight,
        width: finalWidth + scaledExtension,
        height: finalHeight,
        scale: 1,
        z_index: zIndexStart + 1,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...secondElement,
        type: secondElement.type as "text" | "image",
        filter: secondElement.filter as string,
        crop: secondElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      // Third image - bottom right
      const thirdElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[2],
        position_x: startX + finalWidth, // Right side position
        position_y: startY + finalHeight * 2,
        width: finalWidth + scaledExtension,
        height: finalHeight,
        scale: 1,
        z_index: zIndexStart + 2,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...thirdElement,
        type: thirdElement.type as "text" | "image",
        filter: thirdElement.filter as string,
        crop: thirdElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      break;
    }

    case "horizontalBand": {
      // Horizontal band layout - image spans full width with white space above and below
      const imageHeight = canvasHeight * 0.45; // Image takes 60% of canvas height (increased from 40%)
      const imageWidth = canvasWidth; // Image takes 100% of canvas width

      // Center vertically but align to left edge horizontally
      const x = 0; // No margin on left
      const y = (canvasHeight - imageHeight) / 2;

      const element = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: x,
        position_y: y,
        width: imageWidth,
        height: imageHeight,
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

    case "horizontalSplit": {
      const imageWidth = canvasWidth; // Full width
      const imageHeight = canvasHeight / 2; // Half height for each image

      // Top image
      const topElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: 0,
        position_y: 0,
        width: imageWidth,
        height: imageHeight,
        scale: 1,
        z_index: zIndexStart,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...topElement,
        type: topElement.type as "text" | "image",
        filter: topElement.filter as string,
        crop: topElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      // Bottom image
      const bottomElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[1],
        position_x: 0,
        position_y: imageHeight,
        width: imageWidth,
        height: imageHeight,
        scale: 1,
        z_index: zIndexStart + 1,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...bottomElement,
        type: bottomElement.type as "text" | "image",
        filter: bottomElement.filter as string,
        crop: bottomElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      break;
    }

    case "overlayCenter": {
      // Overlay layout with one full-canvas image and a smaller centered image on top
      if (imageUrls.length !== 2) {
        // Fallback to singleFull layout if we don't have exactly 2 images
        return createLayoutForImages(
          imageUrls,
          pageId,
          canvasWidth,
          canvasHeight
        );
      }

      // First image covers the entire canvas
      const backgroundElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: 0,
        position_y: 0,
        width: canvasWidth,
        height: canvasHeight,
        scale: 1,
        z_index: zIndexStart,
        filter: "none",
        crop: null,
      });

      elements.push({
        ...backgroundElement,
        type: backgroundElement.type as "text" | "image",
        filter: backgroundElement.filter as string,
        crop: backgroundElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      // Second image is smaller and centered on top
      const overlayWidth = canvasWidth * 0.8; // 80% of canvas width
      const overlayHeight = canvasHeight * 0.8; // 80% of canvas height
      const overlayX = (canvasWidth - overlayWidth) / 2; // Center horizontally
      const overlayY = (canvasHeight - overlayHeight) / 2; // Center vertically

      const overlayElement = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[1],
        position_x: overlayX,
        position_y: overlayY,
        width: overlayWidth,
        height: overlayHeight,
        scale: 1,
        z_index: zIndexStart + 1, // Higher z-index to appear on top
        filter: "none",
        crop: null,
      });

      elements.push({
        ...overlayElement,
        type: overlayElement.type as "text" | "image",
        filter: overlayElement.filter as string,
        crop: overlayElement.crop as {
          top: number;
          right: number;
          bottom: number;
          left: number;
        } | null,
      });

      break;
    }

    case "topHalf": {
      // Image takes up the top half of the canvas, bottom half is blank
      const imageWidth = canvasWidth;
      const imageHeight = canvasHeight / 2;
      const x = 0;
      const y = 0;

      const element = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: x,
        position_y: y,
        width: imageWidth,
        height: imageHeight,
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

    case "bottomHalf": {
      // Image takes up the bottom half of the canvas, top half is blank
      const imageWidth = canvasWidth;
      const imageHeight = canvasHeight / 2;
      const x = 0;
      const y = canvasHeight / 2; // Position at the middle of the canvas

      const element = await createElement({
        page_id: pageId,
        type: "image",
        content: imageUrls[0],
        position_x: x,
        position_y: y,
        width: imageWidth,
        height: imageHeight,
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
  }

  return elements;
};
