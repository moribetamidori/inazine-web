"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/server";
import { useParams } from "next/navigation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

interface Zine {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function ZinePage() {
  const params = useParams();
  const [zine, setZine] = useState<Zine | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchZine = async () => {
      if (!params.zid || typeof params.zid !== "string") return;

      const { data, error } = await supabase
        .from("zines")
        .select("*")
        .eq("id", params.zid)
        .single();

      if (error) {
        console.error("Error fetching zine:", error);
        return;
      }

      setZine(data);
    };

    fetchZine();
  }, [params.zid, supabase]);

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-screen-xl mx-auto p-4">
          <div className="bg-white w-[600px] h-[800px] mx-auto shadow-lg">
            {/* This will be your canvas/editor area */}
            {zine && (
              <div className="p-4">
                <h1 className="text-2xl font-bold">{zine.title}</h1>
                <p className="text-gray-600">{zine.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
