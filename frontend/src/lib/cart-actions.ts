"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const STRAPI_URL =
    process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ||
    "http://localhost:1337";

if (
    !process.env.NEXT_PUBLIC_STRAPI_URL &&
    process.env.NODE_ENV === "production"
) {
    console.warn(
        "NEXT_PUBLIC_STRAPI_URL is not set in production. Falling back to localhost, which will fail on the deployed site."
    );
}

async function getStrapiHeaders(includeJson = false) {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;

    return {
        ...(includeJson ? { "Content-Type": "application/json" } : {}),
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    };
}

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

export async function getOrCreateCart(cartSessionId?: string) {
    const resolvedCartSessionId = cartSessionId ?? (await getCartSessionId());

    if (!resolvedCartSessionId) {
        return null;
    }

    //look for an existing cart
    const searchUrl = `${STRAPI_URL}/api/carts?filters[sessionId][$eq]=${encodeURIComponent(
        resolvedCartSessionId
    )}&populate[cart_items][populate]=*`;

    try {
        const searchResponse = await fetch(searchUrl, {
            headers: await getStrapiHeaders(),
            cache: "no-store",
        });
        const searchData = await searchResponse.json();

        if (!searchResponse.ok) {
            console.error(
                "Strapi rejected cart lookup:",
                JSON.stringify(searchData, null, 2)
            );
            return null;
        }

        // return cart if it exists
        if (searchData?.data && searchData.data.length > 0) {
            return searchData.data[0];
        }

        // if there is no cart
        const createUrl = `${STRAPI_URL}/api/carts`;
        const createResponse = await fetch(createUrl, {
            method: "POST",
            headers: await getStrapiHeaders(true),
            body: JSON.stringify({
                data: {
                    sessionId: resolvedCartSessionId,
                    cartStatus: "active",
                    publishedAt: new Date().toISOString(),
                },
            }),
            cache: "no-store",
        });

        const newData = await createResponse.json();

        if (!createResponse.ok) {
            console.error(
                "Strapi rejected cart creation:",
                JSON.stringify(newData, null, 2)
            );
            return null;
        }

        return newData.data ?? null;
    } catch (error) {
        console.error("Failed to get or create cart:", error);
        return null;
    }
}

export async function addToCart(
    productDocumentId: string,
    size: string,
    quantity: number,
    unitPrice: number,
    title: string,
    slug: string,
    imageUrl: string
) {
    // make sure the cookie exists before creating or fetching a cart
    const cartSessionId = await ensureCartSessionId();
    const cart = await getOrCreateCart(cartSessionId);

    if (!cart) {
        console.error("No cart found or created for session:", cartSessionId);
        return { success: false, error: "Could not get cart session" };
    }

    // send the new item to Strapi
    const createItemUrl = `${STRAPI_URL}/api/cart-items`;

    try {
        const response = await fetch(createItemUrl, {
            method: "POST",
            headers: await getStrapiHeaders(true),
            body: JSON.stringify({
                data: {
                    quantity: quantity,
                    size: size,
                    unitPrice: unitPrice,
                    titleSnapshot: title,
                    slugSnapshot: slug,
                    imageSnapshot: imageUrl,
                    cart_item: cart.documentId,
                    product: productDocumentId,
                    publishedAt: new Date().toISOString(),
                },
            }),
            cache: "no-store",
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(
                "Strapi rejected the cart item:",
                JSON.stringify(errorData, null, 2)
            );
            return { success: false, error: "Failed to save item." };
        }

        // tell Next.js to refresh the cart
        revalidatePath("/cart");
        revalidatePath("/[locale]/cart", "page");

        return { success: true };
    } catch (error) {
        console.error("Network error adding to cart:", error);
        return { success: false, error: "Could not connect to database." };
    }
}

export async function removeFromCart(documentId: string) {
    const deleteUrl = `${STRAPI_URL}/api/cart-items/${documentId}`;

    try {
        const response = await fetch(deleteUrl, {
            method: "DELETE",
            headers: await getStrapiHeaders(),
            cache: "no-store",
        });

        if (!response.ok) {
            console.error("Failed to delete item from Strapi");
            return { success: false, error: "Failed to delete item" };
        }

        // Refresh the cart pages so the item disappears instantly
        revalidatePath("/cart");
        revalidatePath("/[locale]/cart", "page");

        return { success: true };
    } catch (error) {
        console.error("Network error deleting item:", error);
        return { success: false, error: "Could not connect to database" };
    }
}
