import { cookies } from "next/headers";
import { strapiPrivateFetch } from "./strapi";

/**
 * Fetches the liked product IDs for the current user using cached cookie data.
 * Uses userEmail/username cookies set at login to avoid an extra /api/users/me call.
 */
export async function getLikedProductIds(
    jwt: string
): Promise<Array<string | number>> {
    try {
        const cookieStore = await cookies();
        const email = cookieStore.get("userEmail")?.value;
        const username = cookieStore.get("username")?.value;

        const filter = email
            ? { filters: { email: { $eq: email } } }
            : username
            ? { filters: { username: { $eq: username } } }
            : null;

        if (!filter) return [];

        const json = await strapiPrivateFetch<{ data?: any[] }>("/api/userdbs", {
            query: {
                ...filter,
                pagination: { pageSize: 1 },
                fields: ["documentId"],
                populate: { likedProducts: { fields: ["documentId", "id"] } },
            },
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json",
            },
        });

        const entry = Array.isArray(json?.data) ? json.data[0] : null;
        const likedProducts = Array.isArray(entry?.likedProducts)
            ? entry.likedProducts
            : [];

        return likedProducts
            .map((p: any) => p?.documentId ?? p?.id)
            .filter(Boolean);
    } catch {
        return [];
    }
}
