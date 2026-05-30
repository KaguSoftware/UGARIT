import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components & Server Actions.
 * Reads/writes the auth session via cookies (anon key + user session).
 *
 * NOTE: In a plain Server Component (not a Server Action / Route Handler) the
 * cookie store is read-only, so the setAll below is wrapped in try/catch —
 * session refresh there is handled by the proxy/middleware instead.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Called from a Server Component — safe to ignore.
                    }
                },
            },
        }
    );
}
