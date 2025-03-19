import { useState, useEffect } from "react";
import { getElementsByZineId } from "@/lib/page";
import type { Page } from "@/types/zine";

export function useZinePages(zineId: string | undefined) {
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    if (!zineId) return;

    const fetchPages = async () => {
      try {
        const fetchedPages = await getElementsByZineId(zineId);
        setPages(
          fetchedPages.map((page) => ({
            ...page,
            page_order: page.page_order || 0,
            elements: page.elements.map((el) => ({
              ...el,
              type: el.type as "text" | "image",
              filter: el.filter || "",
              crop: el.crop as {
                top: number;
                right: number;
                bottom: number;
                left: number;
              } | null,
            })),
          }))
        );
      } catch (error) {
        console.error("Error fetching pages:", error);
      }
    };

    fetchPages();
  }, [zineId]);

  return { pages, setPages };
}
