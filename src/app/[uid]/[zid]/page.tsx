"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/server";
import { useParams } from "next/navigation";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ZineCanvas from "@/components/ZineCanvas";
import type { Zine } from "@/types/zine";

export default function ZinePage() {
  const params = useParams();
  const [zine, setZine] = useState<Zine | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchZine = async () => {
      if (!params || !params.zid || typeof params.zid !== "string") return;

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
  }, [params, supabase]);

  return (
    <AuthenticatedLayout zineTitle={zine?.title} zineId={params?.zid as string}>
      <div className="min-h-screen">
        <div className="max-w-screen-2xl mx-auto">
          {zine && <ZineCanvas zine={zine} />}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
