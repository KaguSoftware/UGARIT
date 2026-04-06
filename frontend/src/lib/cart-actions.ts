"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { strapiPrivateFetch } from "@/src/lib/strapi";

type StrapiEntity<T> = {
    id?: number;
    documentId?: string;
    attributes?: T;
} & T;

type StrapiCollectionResponse<T> = {
    data?: Array<StrapiEntity<T>>;
};

type StrapiSingleResponse<T> = {
    data?: StrapiEntity<T> | null;
};

type CartItemSnapshot = {
    quantity?: number;
    size?: string;
    unitPrice?: number;
    titleSnapshot?: string;
    slugSnapshot?: string;
    imageSnapshot?: string;
    product?: unknown;
};

type CartEntity = {
    sessionId?: string;
    cartStatus?: string;
    cart_items?:
        | Array<StrapiEntity<CartItemSnapshot>>
        | { data?: Array<StrapiEntity<CartItemSnapshot>> }
        | null;
};

async function getStrapiHeaders(includeJson = false) {
    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value;

    return {
        ...(includeJson ? { "Content-Type": "application/json" } : {}),
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    };
}

async function getEntityIdByDocumentId(
    collection: string,
    documentId: string,
    label: string,
    locale = "all"
) {
    try {
        const data = await strapiPrivateFetch<
            StrapiCollectionResponse<Record<string, never>>
        >(`/api/${collection}`, {
            query: {
                locale,
                filters: {
                    documentId: {
                        $eq: documentId,
                    },
                },
                fields: ["id"],
                pagination: { pageSize: 1 },
            },
            headers: await getStrapiHeaders(),
        });

        const entry = Array.isArray(data?.data) ? data.data[0] : null;
        return typeof entry?.id === "number" ? entry.id : null;
    } catch (error) {
        console.error(`Failed to resolve ${label} id from documentId:`, error);
        return null;
    }
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

    try {
        const searchData = await strapiPrivateFetch<
            StrapiCollectionResponse<CartEntity>
        >("/api/carts", {
            query: {
                filters: {
                    sessionId: {
                        $eq: resolvedCartSessionId,
                    },
                },
                fields: ["sessionId", "cartStatus", "documentId"],
                populate: {
                    cart_items: {
                        fields: [
                            "quantity",
                            "size",
                            "unitPrice",
                            "titleSnapshot",
                            "slugSnapshot",
                            "imageSnapshot",
                        ],
                        populate: {
                            product: {
                                fields: ["documentId", "slug", "title"],
                            },
                        },
                    },
                },
                pagination: { pageSize: 1 },
            },
            headers: await getStrapiHeaders(),
        });

        if (searchData?.data && searchData.data.length > 0) {
            return searchData.data[0];
        }

        const newData = await strapiPrivateFetch<
            StrapiSingleResponse<CartEntity>
        >("/api/carts", {
            method: "POST",
            headers: await getStrapiHeaders(true),
            body: JSON.stringify({
                data: {
                    sessionId: resolvedCartSessionId,
                    cartStatus: "active",
                    publishedAt: new Date().toISOString(),
                },
            }),
        });

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
    imageUrl: string,
    currentLocale: string
) {
    // make sure the cookie exists before creating or fetching a cart
    const cartSessionId = await ensureCartSessionId();
    const cart = await getOrCreateCart(cartSessionId);

    if (!cart) {
        console.error("No cart found or created for session:", cartSessionId);
        return { success: false, error: "Could not get cart session" };
    }

    const cartId =
        typeof cart?.id === "number"
            ? cart.id
            : cart?.documentId
            ? await getEntityIdByDocumentId("carts", cart.documentId, "cart")
            : null;

    const productRelationValue = await getEntityIdByDocumentId(
        "products",
        productDocumentId,
        "product",
        currentLocale
    );

    if (!cartId || !productRelationValue) {
        console.error("Could not resolve relation ids for cart item", {
            cartId,
            cartDocumentId: cart?.documentId,
            productDocumentId,
            productId: productRelationValue,
        });
        return { success: false, error: "Failed to save item." };
    }

    try {
        await strapiPrivateFetch<StrapiSingleResponse<CartItemSnapshot>>(
            "/api/cart-items",
            {
                method: "POST",
                headers: await getStrapiHeaders(true),
                body: JSON.stringify({
                    data: {
                        quantity,
                        size,
                        unitPrice,
                        titleSnapshot: title,
                        slugSnapshot: slug,
                        imageSnapshot: imageUrl,
                        cart_item: cartId,
                        product: productRelationValue,
                        locale: currentLocale,
                        publishedAt: new Date().toISOString(),
                    },
                }),
            }
        );

        revalidatePath("/cart");
        revalidatePath("/[locale]/cart", "page");

        return { success: true };
    } catch (error) {
        console.error("Network error adding to cart:", error);
        return { success: false, error: "Could not connect to database." };
    }
}

export async function removeFromCart(documentId: string) {
    try {
        await strapiPrivateFetch(`/api/cart-items/${documentId}`, {
            method: "DELETE",
            headers: await getStrapiHeaders(),
        });

        revalidatePath("/cart");
        revalidatePath("/[locale]/cart", "page");

        return { success: true };
    } catch (error) {
        console.error("Network error deleting item:", error);
        return { success: false, error: "Could not connect to database" };
    }
}
