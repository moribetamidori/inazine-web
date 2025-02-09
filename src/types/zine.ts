import { Database } from "../../supabase/database.types";

// Extract the Zine type from the database types
export type Zine = Database["public"]["Tables"]["zines"]["Row"];
