import { forwardRef, ReactNode } from "react";

interface CanvasContainerProps {
  children: ReactNode;
  handleCanvasClick: (e: React.MouseEvent) => void;
  handleWheel: (e: WheelEvent) => void;
}

export const CanvasContainer = forwardRef<HTMLDivElement, CanvasContainerProps>(
  ({ children, handleCanvasClick }, ref) => {
    return (
      <div
        ref={ref}
        className="relative bg-gray-50 flex-1 overflow-auto"
        onClick={handleCanvasClick}
      >
        {children}
      </div>
    );
  }
);

CanvasContainer.displayName = "CanvasContainer";
