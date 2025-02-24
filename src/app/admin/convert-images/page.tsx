"use client";

import { useState } from "react";
import { convertAllImagesToWebP } from "@/lib/imageConversion";

export default function ConvertImages() {
  const [isConverting, setIsConverting] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    converted: number;
    errors: number;
  } | null>(null);

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const result = await convertAllImagesToWebP();
      setStats(result);
    } catch (error) {
      console.error("Error during conversion:", error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Image Conversion Utility</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={handleConvert}
          disabled={isConverting}
          className={`px-4 py-2 rounded ${
            isConverting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white font-semibold`}
        >
          {isConverting ? "Converting..." : "Convert All Images to WebP"}
        </button>

        {stats && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Conversion Results:</h2>
            <div className="space-y-2">
              <p>Total images: {stats.total}</p>
              <p>Successfully converted: {stats.converted}</p>
              <p>Errors: {stats.errors}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
