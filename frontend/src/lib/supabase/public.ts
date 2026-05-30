import { createClient } from "@supabase/supabase-js";

/**
 * Stateless anon Supabase client for reading the PUBLIC catalog
 * (products/categories/colors) from Server Components.
 *
 * Unlike the SSR server client, it does not touch cookies — these reads are the
 * same for everyone, so skipping per-request session work keeps catalog pages
 * fast and cacheable. RLS allows public read on these tables, so the anon key
 * is sufficient (and safer than the service role for read-only catalog data).
 */
export function createPublicClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: { autoRefreshToken: false, persistSession: false },
        }
    );
}
