"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function getCartSessionId() {
	const cookieStore = await cookies();
	let cartSessionId = cookieStore.get("cartSessionId")?.value;

	// missing cookie handler
	if (!cartSessionId) {
		cartSessionId = randomUUID();

		cookieStore.set("cartSessionId", cartSessionId, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			path: "/",
			maxAge: 60 * 60 * 24 * 30, //30 days if you're slow (sorry)
		});
	}

	return cartSessionId;
}

export async function getOrCreateCart() {
	const cartSessionId = await getCartSessionId();

	//look for an existing cart
	const searchUrl = `http://localhost:1337/api/carts?filters[sessionId][$eq]=${cartSessionId}&populate[cart_items][populate]=*`;

	try {
		const searchResponse = await fetch(searchUrl, {
			cache: "no-store",
		});
		const searchData = await searchResponse.json();

		// return cart if it exists
		if (searchData?.data && searchData.data.length > 0) {
			return searchData.data[0];
		}

		// if there is no cart
		const createUrl = "http://localhost:1337/api/carts";
		const createResponse = await fetch(createUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				data: {
					sessionId: cartSessionId,
					cartStatus: "active",
					publishedAt: new Date().toISOString(),
				},
			}),
			cache: "no-store",
		});

		const newData = await createResponse.json();
		return newData.data;
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
) {
	// get the current cart
	const cart = await getOrCreateCart();

	if (!cart) {
		console.error("No cart found or created.");
		return { success: false, error: "Could not get cart session" };
	}

	// send the new item to Strapi
	const createItemUrl = "http://localhost:1337/api/cart-items";

	try {
		const response = await fetch(createItemUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
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
				JSON.stringify(errorData, null, 2),
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
