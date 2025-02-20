"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { getZineById } from "@/lib/zine";
import { getPagesByZineId } from "@/lib/page";
import type { Zine } from "@/types/zine";
import ZineBook from "@/components/ZineBook";

export default function ExploreZinePage() {
  const params = useParams();
  const [zine, setZine] = useState<Zine | null>(null);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchZineAndPreviews() {
      try {
        const zine = await getZineById(params.zid as string);
        if (zine) {
          setZine(zine);
          const pages = await getPagesByZineId(zine.id);
          const previews = pages.map((page) => page.preview || "");
          setPreviewPages(previews);
        }
      } catch (error) {
        console.error("Error fetching zine:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchZineAndPreviews();
  }, [params.zid]);

  return (
    <AuthenticatedLayout zineTitle={zine?.title}>
      <div className="w-full h-screen flex justify-center items-center border border-red-500">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="text-xl">Loading zine preview...</div>
          </div>
        ) : (
          <div className="flex justify-center items-center w-full">
            <ZineBook pages={previewPages} />
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
