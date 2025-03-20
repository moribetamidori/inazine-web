import { useState, useEffect } from "react";
import { getPageWithElements } from "@/lib/page";
import type { Page } from "@/types/zine";

export function useSinglePage(zineId: string | undefined, pageIndex: number) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!zineId) return;
    
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fetchedPage = await getPageWithElements(zineId, pageIndex);
        if (fetchedPage) {
          setPage({
            ...fetchedPage,
            page_order: fetchedPage.page_order || 0,
            elements: fetchedPage.elements.map((el) => ({
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
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch page"));
        console.error("Error fetching page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [zineId, pageIndex]);

  return { page, setPage, loading, error };
} 