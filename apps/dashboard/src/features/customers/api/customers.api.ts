import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Feature-local API hook. Calls Supabase directly for simple reads;
// anything shared across apps (like bookings) instead goes through
// @travio/api's service layer. This distinction keeps single-app-only
// queries out of the shared package.
export function useCustomers(tenantId: string) {
  return useQuery({
    queryKey: ["customers", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(tenantId),
  });
}
