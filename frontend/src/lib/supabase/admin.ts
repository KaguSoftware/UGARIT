import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security.
 *
 * SERVER-ONLY. Never import this into a Client Component — the "server-only"
 * import above will throw at build time if you do. Used for:
 *   - admin writes (products/categories/colors/variants)
 *   - cart / cart_item operations (guest carts keyed by cookie session_id)
 *   - media uploads to Storage
 */
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
