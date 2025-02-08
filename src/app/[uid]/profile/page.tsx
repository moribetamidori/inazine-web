"use client";

import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getZinesByUserId } from "@/lib/zine";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Database } from "../../../../supabase/database.types";

type Zine = Database["public"]["Tables"]["zines"]["Row"];

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
        setZines(userZines);
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
      <div className="max-w-4xl mx-auto">
        {zines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No zines created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {zines.map((zine) => (
              <Link
                key={zine.id}
                href={`/${user?.id}/${zine.id}`}
                className="block"
              >
                <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <h2 className="text-xl font-semibold mb-2">{zine.title}</h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {zine.description || "No description"}
                  </p>
                  <div className="text-sm text-gray-500">
                    Created: {new Date(zine.created_at).toLocaleDateString()}
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
