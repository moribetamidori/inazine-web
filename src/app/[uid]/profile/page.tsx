"use client";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getZinesByUserId, getPagesByZineId } from "@/lib/zine";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Database } from "../../../../supabase/database.types";
import Image from "next/image";

type Zine = Database["public"]["Tables"]["zines"]["Row"] & {
  firstPagePreview?: string | null;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [zines, setZines] = useState<Zine[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    async function fetchZines() {
      if (!params.uid) return;

      try {
        const userZines = await getZinesByUserId(params.uid as string);
        // Fetch first page preview for each zine
        const zinesWithPreviews = await Promise.all(
          userZines.map(async (zine) => {
            const pages = await getPagesByZineId(zine.id);
            const firstPagePreview = pages?.[0]?.preview || null;
            return { ...zine, firstPagePreview };
          })
        );
        setZines(zinesWithPreviews);
      } catch (error) {
        console.error("Error fetching zines:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchZines();
  }, [params.uid]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto p-6">
        {zines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No zines created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {zines.map((zine) => (
              <Link
                key={zine.id}
                href={`/${user?.id}/${zine.id}`}
                className="block"
              >
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border overflow-hidden">
                  <div className="aspect-[3/4] relative bg-gray-100">
                    {zine.firstPagePreview ? (
                      <Image
                        src={zine.firstPagePreview}
                        alt={zine.title}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
