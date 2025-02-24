"use client";

import { useState } from "react";
import {
  convertAllImagesToWebP,
  convertPreviewsToWebP,
} from "@/lib/imageConversion";

export default function ConvertImages() {
  const [isConverting, setIsConverting] = useState<{
    elements: boolean;
    previews: boolean;
  }>({ elements: false, previews: false });
  const [stats, setStats] = useState<{
    elements?: { total: number; converted: number; errors: number };
    previews?: { total: number; converted: number; errors: number };
  } | null>(null);

  const handleConvertElements = async () => {
    setIsConverting((prev) => ({ ...prev, elements: true }));
    try {
      const elementResults = await convertAllImagesToWebP();
      setStats((prev) => ({ ...prev, elements: elementResults }));
    } catch (error) {
      console.error("Error during element conversion:", error);
    } finally {
      setIsConverting((prev) => ({ ...prev, elements: false }));
    }
  };

  const handleConvertPreviews = async () => {
    setIsConverting((prev) => ({ ...prev, previews: true }));
    try {
      const previewResults = await convertPreviewsToWebP();
      setStats((prev) => ({ ...prev, previews: previewResults }));
    } catch (error) {
      console.error("Error during preview conversion:", error);
    } finally {
      setIsConverting((prev) => ({ ...prev, previews: false }));
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Image Conversion Utility</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-x-4">
          <button
            onClick={handleConvertElements}
            disabled={isConverting.elements}
            className={`px-4 py-2 rounded ${
              isConverting.elements
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white font-semibold`}
          >
            {isConverting.elements ? "Converting..." : "Convert Element Images"}
          </button>

          <button
            onClick={handleConvertPreviews}
            disabled={isConverting.previews}
            className={`px-4 py-2 rounded ${
              isConverting.previews
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            } text-white font-semibold`}
          >
            {isConverting.previews ? "Converting..." : "Convert Page Previews"}
          </button>
        </div>

        {stats && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Conversion Results:</h2>

            <div className="space-y-6">
              {stats.elements && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Element Images:</h3>
                  <p>Total images: {stats.elements.total}</p>
                  <p>Successfully converted: {stats.elements.converted}</p>
                  <p>Errors: {stats.elements.errors}</p>
                </div>
              )}

              {stats.previews && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Page Previews:</h3>
                  <p>Total previews: {stats.previews.total}</p>
                  <p>Successfully converted: {stats.previews.converted}</p>
                  <p>Errors: {stats.previews.errors}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
