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
        // Enforce stock when the product tracks it (null = untracked).
        let stockLimit: number | null = null;
        if (productId) {
            const { data: product } = await supabase
                .from("products")
                .select("stock")
                .eq("id", productId)
                .maybeSingle();
            stockLimit = product?.stock ?? null;
            if (stockLimit === 0) {
                return { success: false, error: "out_of_stock" };
            }
        }

        // Increment an existing matching line instead of creating a duplicate.
        let existingQuery = supabase
            .from("cart_items")
            .select("id, quantity")
            .eq("cart_id", cart.id);
        existingQuery = productId
            ? existingQuery.eq("product_id", productId)
            : existingQuery.is("product_id", null);
        existingQuery = size
            ? existingQuery.eq("size", size)
            : existingQuery.is("size", null);
        existingQuery = color
            ? existingQuery.eq("color", color)
            : existingQuery.is("color", null);

        const { data: existing } = await existingQuery.maybeSingle();

        let nextQuantity = (existing?.quantity ?? 0) + quantity;
        if (stockLimit !== null) {
            nextQuantity = Math.min(nextQuantity, stockLimit);
        }

        if (existing) {
            const { error } = await supabase
                .from("cart_items")
                .update({ quantity: nextQuantity })
                .eq("id", existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from("cart_items").insert({
                cart_id: cart.id,
                product_id: productId || null,
                quantity: nextQuantity,
                size: size || null,
                color: color || null,
                unit_price: unitPrice,
                title_snapshot: title,
                slug_snapshot: slug,
                image_snapshot: imageUrl,
            });
            if (error) throw error;
        }

        revalidatePath("/cart");
        revalidatePath("/[locale]/cart", "page");

        return { success: true };
    } catch (error) {
        console.error("Error adding to cart:", error);
        return { success: false, error: "Could not connect to database." };
    }
}

/**
 * Sets the quantity of a cart line. A quantity below 1 removes the line.
 * Caps at the product's stock when it is tracked.
 */
export async function updateCartItemQuantity(
    cartItemId: string,
    quantity: number
) {
    const supabase = createAdminClient();
    try {
        if (quantity < 1) {
            const { error } = await supabase
                .from("cart_items")
                .delete()
                .eq("id", cartItemId);
            if (error) throw error;
            revalidatePath("/cart");
            revalidatePath("/[locale]/cart", "page");
            return { success: true };
        }

        // Respect stock when the underlying product tracks it.
        const { data: item } = await supabase
            .from("cart_items")
            .select("product_id")
            .eq("id", cartItemId)
            .maybeSingle();

        let next = quantity;
        if (item?.product_id) {
            const { data: product } = await supabase
                .from("products")
                .select("stock")
                .eq("id", item.product_id)
                .maybeSingle();
            const stock = product?.stock ?? null;
            if (stock !== null) next = Math.max(1, Math.min(quantity, stock));
        }

        const { error } = await supabase
            .from("cart_items")
            .update({ quantity: next })
            .eq("id", cartItemId);
        if (error) throw error;

        revalidatePath("/cart");
        revalidatePath("/[locale]/cart", "page");
        return { success: true };
    } catch (error) {
        console.error("Error updating cart item:", error);
        return { success: false, error: "Could not connect to database" };
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
