import { useState, useEffect } from "react";
import { getPagesByZineId } from "@/lib/page";
import type { Page } from "@/types/zine";

export function useZinePages(zineId: string | undefined) {
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    if (!zineId) return;

    const fetchPages = async () => {
      try {
        const fetchedPages = await getPagesByZineId(zineId);
        setPages(
          fetchedPages.map((page) => ({
            ...page,
            elements: page.elements.map((el) => ({
              ...el,
              type: el.type as "text" | "image",
              filter: el.filter || "",
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
