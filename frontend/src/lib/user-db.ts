import { createClient } from "@/src/lib/supabase/server";

/**
 * Liked product IDs for the currently signed-in user (Supabase session).
 * Returns an empty list for guests.
 */
export async function getLikedProductIds(): Promise<Array<string>> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return [];

        const { data } = await supabase
            .from("liked_products")
            .select("product_id")
            .eq("profile_id", user.id);

        return (data ?? []).map((row: any) => row.product_id).filter(Boolean);
    } catch {
        return [];
    }
}
