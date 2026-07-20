import { createBrowserSupabaseClient } from "@travio/database/browser";

// App-level singleton so components don't each construct their own client.
export const supabase = createBrowserSupabaseClient();
