"use client";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { createClient } from "@/lib/supabase/server";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Database } from "../../../supabase/database.types";
import { getPagesByZineId } from "@/lib/page";
import html2canvas from "html2canvas";

type Zine = Database["public"]["Tables"]["zines"]["Row"];

export default function ExplorePage() {
  const [zines, setZines] = useState<(Zine & { preview?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublicZines() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("zines")
          .select(`*`)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setZines(data);

        // Generate previews for each zine
        for (const zine of data) {
          const pages = await getPagesByZineId(zine.id);
          if (pages && pages.length > 0) {
            const firstPage = pages[0];

            // Create a temporary div to render the page
            const tempDiv = document.createElement("div");
            tempDiv.style.position = "absolute";
            tempDiv.style.left = "-9999px";
            tempDiv.style.width = "900px"; // Match ZineCanvas width
            tempDiv.style.height = "1200px"; // Match ZineCanvas height
            tempDiv.style.backgroundColor = "white";
            document.body.appendChild(tempDiv);

            // Render the page elements
            firstPage.elements.forEach((element) => {
              const elementDiv = document.createElement("div");
              elementDiv.style.position = "absolute";
              elementDiv.style.left = `${element.position_x}px`;
              elementDiv.style.top = `${element.position_y}px`;
              elementDiv.style.zIndex = element.z_index.toString();

              if (element.type === "text") {
                elementDiv.innerHTML = element.content;
              } else if (element.type === "image") {
                const img = document.createElement("img");
                img.src = element.content;
                img.style.width = element.width ? `${element.width}px` : "auto";
                img.style.height = element.height
                  ? `${element.height}px`
                  : "auto";
                elementDiv.appendChild(img);
              }

              tempDiv.appendChild(elementDiv);
            });

            try {
              const canvas = await html2canvas(tempDiv, {
                width: 900,
                height: 1200,
                scale: 1,
                useCORS: true,
                backgroundColor: "white",
              });

              const preview = canvas.toDataURL("image/png", 0.8);
              setZines((prevZines) =>
                prevZines.map((z) => (z.id === zine.id ? { ...z, preview } : z))
              );
            } catch (error) {
              console.error("Error generating preview:", error);
            }

            document.body.removeChild(tempDiv);
          }
        }
      } catch (error) {
        console.error("Error fetching public zines:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPublicZines();
  }, []);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="p-8">Loading...</div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto p-6">
        {zines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No public zines available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {zines.map((zine) => (
              <Link
                key={zine.id}
                href={`/explore/${zine.id}`}
                className="block"
              >
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border overflow-hidden">
                  <div className="aspect-[3/4] relative bg-gray-100">
                    {zine.preview ? (
                      <img
                        src={zine.preview}
                        alt={zine.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No preview
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{zine.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {zine.description || "No description"}
                    </p>
                    <div className="text-sm text-gray-400">
                      {new Date(zine.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
