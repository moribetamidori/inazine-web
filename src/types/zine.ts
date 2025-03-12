import { Database } from "../../supabase/database.types";

// Extract the Zine type from the database types
export type Zine = Database["public"]["Tables"]["zines"]["Row"];
export interface Page {
  id: string;
  zine_id: string;
  preview: string | null;
  created_at?: string;
  updated_at?: string;
  elements: Element[];
  page_order: number;
}

export interface Element {
  id: string;
  page_id: string;
  type: "text" | "image";
  content: string;
  position_x: number;
  position_y: number;
  width: number | null;
  height: number | null;
  scale: number;
  z_index: number;
  created_at?: string;
  updated_at?: string;
  filter: string;
  crop: { top: number; right: number; bottom: number; left: number } | null;
}
