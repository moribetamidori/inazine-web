// src/components/ImageDropZone.tsx
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface ImageDropZoneProps {
  onImagesSelected: (files: File[]) => void;
  isProcessing: boolean;
  progress?: { current: number; total: number } | null;
}

export function ImageDropZone({
  onImagesSelected,
  isProcessing,
  progress = null,
}: ImageDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const imageFiles = acceptedFiles.filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length > 0) {
        onImagesSelected(imageFiles);
      }
    },
    [onImagesSelected]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    disabled: isProcessing,
  });

  return (
    <div className="px-4 mt-2">
      <h3 className="text-sm font-bold text-gray-900 mb-2">
        Auto Layout Images
      </h3>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragActive
            ? "border-black bg-gray-50"
            : isProcessing
            ? "border-gray-300 bg-gray-100 cursor-not-allowed"
            : "border-gray-300 hover:border-black hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent mb-2" />
            {progress ? (
              <p className="text-sm text-gray-600">
                Processing {progress.current} of {progress.total} images...
              </p>
            ) : (
              <p className="text-sm text-gray-600">Processing images...</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            <ArrowUpTrayIcon className="h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Drop images here or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Images will be auto-arranged across pages
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
