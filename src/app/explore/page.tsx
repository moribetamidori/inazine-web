"use client";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { createClient } from "@/lib/supabase/server";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Database } from "../../../supabase/database.types";

type Zine = Database["public"]["Tables"]["zines"]["Row"];

export default function ExplorePage() {
  const [zines, setZines] = useState<Zine[]>([]);
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
      <div className="max-w-7xl mx-auto">
        {zines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No public zines available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {zines.map((zine) => (
              <Link
                key={zine.id}
                href={`/${zine.user_id}/${zine.id}`}
                className="block"
              >
                <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border">
                  <h3 className="text-xl font-semibold mb-2">{zine.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {zine.description || "No description"}
                  </p>
                  <div className="flex justify-between items-end">
                    {/* <div className="text-sm text-gray-500">
                      by {zine.user_id}
                    </div> */}
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
