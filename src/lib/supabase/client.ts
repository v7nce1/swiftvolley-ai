import { createBrowserClient } from "@supabase/ssr";

// Return a safe stub when env vars are missing (e.g., during static build)
export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Minimal stub to satisfy callers during build/prerender
    return {
      auth: {
        signInWithOAuth: async () => ({ error: { message: "Supabase env missing" } }),
        getUser: async () => ({ data: { user: null } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({ insert: async () => ({ data: null, error: null }) }),
    } as unknown as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}