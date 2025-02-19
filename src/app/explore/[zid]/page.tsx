"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { getZineById } from "@/lib/zine";
import { getPagesByZineId } from "@/lib/page";
import html2canvas from "html2canvas";
import type { Zine } from "@/types/zine";
import ZineBook from "@/components/ZineBook";

export default function ExploreZinePage() {
  const params = useParams();
  const [zine, setZine] = useState<Zine | null>(null);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchZineAndGeneratePreview() {
      if (!params.zid || typeof params.zid !== "string") return;

      try {
        // Fetch zine data
        const zineData = await getZineById(params.zid);
        setZine(zineData);

        // Fetch pages and generate previews
        const pages = await getPagesByZineId(params.zid);
        const pageImages: string[] = [];

        // Create temporary div for rendering
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        tempDiv.style.width = "900px";
        tempDiv.style.height = "1200px";
        tempDiv.style.backgroundColor = "white";
        document.body.appendChild(tempDiv);

        try {
          for (const page of pages) {
            // Reset temp div for each page
            tempDiv.innerHTML = "";

            // Render page elements
            page.elements.forEach((element) => {
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

            // Generate canvas for the page
            const canvas = await html2canvas(tempDiv, {
              width: 900,
              height: 1200,
              scale: 2,
              useCORS: true,
              backgroundColor: "white",
            });

            const imageUrl = canvas.toDataURL("image/png");
            pageImages.push(imageUrl);
          }
        } finally {
          document.body.removeChild(tempDiv);
        }

        setPreviewPages(pageImages);
      } catch (error) {
        console.error("Error fetching zine:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchZineAndGeneratePreview();
  }, [params.zid]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl">Loading zine preview...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout zineTitle={zine?.title}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-xl mx-auto p-6">
          <div className="flex justify-center">

              <ZineBook pages={previewPages} />

          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
