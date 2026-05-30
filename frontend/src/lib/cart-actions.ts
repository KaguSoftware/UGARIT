"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { createClient } from "@/src/lib/supabase/server";

export type CartRecord = {
    id: string;
    session_id: string;
    status: string;
    cart_items: Array<{
        id: string;
        quantity: number;
        size: string | null;
        color: string | null;
        unit_price: number;
        title_snapshot: string;
        slug_snapshot: string;
        image_snapshot: string | null;
        product: { id: string; slug: string } | null;
    }>;
};

const CART_SELECT =
    "id, session_id, status, " +
    "cart_items(id, quantity, size, color, unit_price, title_snapshot, slug_snapshot, image_snapshot, product:products(id, slug))";

export async function getCartSessionId() {
    const cookieStore = await cookies();
    return cookieStore.get("cartSessionId")?.value ?? null;
}

export async function ensureCartSessionId() {
    const cookieStore = await cookies();
    let cartSessionId = cookieStore.get("cartSessionId")?.value;

    if (!cartSessionId) {
        cartSessionId = randomUUID();
        cookieStore.set("cartSessionId", cartSessionId, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });
    }

    return cartSessionId;
}

export async function getOrCreateCart(
    cartSessionId?: string
): Promise<CartRecord | null> {
    const resolvedCartSessionId =
        cartSessionId ?? (await getCartSessionId());

    if (!resolvedCartSessionId) return null;

    const supabase = createAdminClient();

    try {
        const { data: existing } = await supabase
            .from("carts")
            .select(CART_SELECT)
            .eq("session_id", resolvedCartSessionId)
            .maybeSingle();

        if (existing) return existing as unknown as CartRecord;

        // Attach the cart to the signed-in user when available.
        let profileId: string | null = null;
        try {
            const ssr = await createClient();
            const {
                data: { user },
            } = await ssr.auth.getUser();
            profileId = user?.id ?? null;
        } catch {
            profileId = null;
        }

        const { data: created } = await supabase
            .from("carts")
            .insert({
                session_id: resolvedCartSessionId,
                status: "active",
                profile_id: profileId,
            })
            .select(CART_SELECT)
            .single();

        return (created as unknown as CartRecord) ?? null;
    } catch (error) {
        console.error("Failed to get or create cart:", error);
        return null;
    }
}

export async function addToCart(
    productId: string,
    size: string,
    color: string,
    quantity: number,
    unitPrice: number,
    title: string,
    slug: string,
    imageUrl: string,
    _currentLocale: string
) {
    const cartSessionId = await ensureCartSessionId();
    const cart = await getOrCreateCart(cartSessionId);

    if (!cart) return { success: false, error: "Could not get cart session" };

    const supabase = createAdminClient();

    try {
        const { error } = await supabase.from("cart_items").insert({
            cart_id: cart.id,
            product_id: productId || null,
            quantity,
            size: size || null,
            color: color || null,
            unit_price: unitPrice,
            title_snapshot: title,
            slug_snapshot: slug,
            image_snapshot: imageUrl,
        });

        if (error) throw error;

        revalidatePath("/cart");
        revalidatePath("/[locale]/cart", "page");

        return { success: true };
    } catch (error) {
        console.error("Error adding to cart:", error);
        return { success: false, error: "Could not connect to database." };
    }
}

export async function removeFromCart(cartItemId: string) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from("cart_items")
            .delete()
            .eq("id", cartItemId);

        if (error) throw error;

        revalidatePath("/cart");
        revalidatePath("/[locale]/cart", "page");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Could not connect to database" };
    }
}
