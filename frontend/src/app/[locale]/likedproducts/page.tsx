import { cookies } from "next/headers";
import ProductGrid from "@/src/components/productsGrid/products";
import type { Product } from "@/src/components/cards/ProductCard/types";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import { getStrapiMedia, strapiPrivateFetch } from "@/src/lib/strapi";
import { cookies as nextCookies } from "next/headers";

type RawProduct = {
    id?: number | string;
    documentId?: string;
    title?: string;
    name?: string;
    slug?: string;
    price?: number | string;
    category?: { name?: string | null } | string | null;
    image?: unknown;
    images?: unknown;
    imageUrl?: string;
};

type UserDbEntry = {
    id: number;
    documentId?: string;
    username?: string | null;
    email?: string | null;
    likedProducts?: RawProduct[] | { data?: unknown } | null;
    attributes?: {
        documentId?: string;
        username?: string | null;
        email?: string | null;
        likedProducts?: RawProduct[] | { data?: unknown } | null;
    };
};


function unwrapAttributes<T extends { id?: number; documentId?: string }>(
    value: T & { attributes?: Partial<T> }
) {
    if (!value?.attributes) {
        return value;
    }

    return {
        ...value,
        ...value.attributes,
    };
}

function normalizeUserDbEntry(entry: UserDbEntry) {
    const normalizedEntry = unwrapAttributes(entry);

    return {
        ...normalizedEntry,
        id: entry.id ?? normalizedEntry.id,
        documentId: entry.documentId ?? normalizedEntry.documentId,
        username: normalizedEntry.username ?? entry.username,
        email: normalizedEntry.email ?? entry.email,
        likedProducts:
            normalizedEntry.likedProducts ??
            entry.likedProducts ??
            normalizedEntry.attributes?.likedProducts,
    };
}

function unwrapRelationArray(value: unknown): RawProduct[] {
    if (Array.isArray(value)) {
        return value as RawProduct[];
    }

    if (value && typeof value === "object" && "data" in value) {
        const relation = value as { data?: unknown };

        if (Array.isArray(relation.data)) {
            return relation.data.map((item) => {
                if (item && typeof item === "object" && "attributes" in item) {
                    const relationItem = item as {
                        id?: number | string;
                        documentId?: string;
                        attributes?: Record<string, unknown>;
                    };

                    return {
                        id: relationItem.id,
                        documentId: relationItem.documentId,
                        ...(relationItem.attributes ?? {}),
                    } as RawProduct;
                }

                return item as RawProduct;
            });
        }
    }

    return [];
}

async function getJwtFromCookie() {
    const cookieStore = await cookies();
    return cookieStore.get("jwt")?.value ?? null;
}

async function getUserDb(
    jwt: string,
    authUserEmail?: string,
    authUsername?: string
): Promise<UserDbEntry | null> {
    try {
        const filter = authUserEmail
            ? { filters: { email: { $eq: authUserEmail } } }
            : authUsername
            ? { filters: { username: { $eq: authUsername } } }
            : null;

        if (!filter) return null;

        const json = await strapiPrivateFetch<{ data?: UserDbEntry[] }>(
            "/api/userdbs",
            {
                query: {
                    ...filter,
                    pagination: { pageSize: 1 },
                    fields: ["documentId", "username", "email"],
                    populate: {
                        likedProducts: {
                            fields: ["id", "documentId", "title", "slug", "price"],
                            populate: {
                                image: { fields: ["url"] },
                                category: { fields: ["name"] },
                            },
                        },
                    },
                },
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const entry = Array.isArray(json?.data) ? json.data[0] : null;
        return entry ? normalizeUserDbEntry(entry) : null;
    } catch (error) {
        console.error("Failed to fetch user profile", error);
        return null;
    }
}

function extractImageUrl(image: unknown): string {
    if (!image) return "/image1.jpeg";

    if (Array.isArray(image)) {
        return image.length > 0 ? extractImageUrl(image[0]) : "/image1.jpeg";
    }

    if (typeof image === "string") {
        return getStrapiMedia(image);
    }

    if (typeof image === "object") {
        const imageRecord = image as {
            url?: string | null;
            data?: unknown;
            attributes?: {
                url?: string | null;
                formats?: {
                    thumbnail?: { url?: string | null };
                    small?: { url?: string | null };
                    medium?: { url?: string | null };
                    large?: { url?: string | null };
                };
            };
            formats?: {
                thumbnail?: { url?: string | null };
                small?: { url?: string | null };
                medium?: { url?: string | null };
                large?: { url?: string | null };
            };
        };

        const formatUrl =
            imageRecord.formats?.large?.url ??
            imageRecord.formats?.medium?.url ??
            imageRecord.formats?.small?.url ??
            imageRecord.formats?.thumbnail?.url ??
            imageRecord.attributes?.formats?.large?.url ??
            imageRecord.attributes?.formats?.medium?.url ??
            imageRecord.attributes?.formats?.small?.url ??
            imageRecord.attributes?.formats?.thumbnail?.url;

        if (formatUrl) {
            return getStrapiMedia(formatUrl);
        }

        if (imageRecord.url) {
            return getStrapiMedia(imageRecord.url);
        }

        if (imageRecord.attributes?.url) {
            return getStrapiMedia(imageRecord.attributes.url);
        }

        if (imageRecord.data) {
            return extractImageUrl(imageRecord.data);
        }
    }

    return "/image1.jpeg";
}

function getRawLikedProducts(entry: UserDbEntry | null) {
    if (!entry) return [] as RawProduct[];

    const normalizedEntry = normalizeUserDbEntry(entry);

    const directLikedProducts = Array.isArray(normalizedEntry.likedProducts)
        ? normalizedEntry.likedProducts
        : [];

    if (directLikedProducts.length > 0) {
        return directLikedProducts;
    }

    const likedProducts = unwrapRelationArray(normalizedEntry.likedProducts);

    if (likedProducts.length > 0) {
        return likedProducts;
    }

    return [] as RawProduct[];
}

async function getLikedProducts(entry: UserDbEntry | null) {
    const rawProducts = getRawLikedProducts(entry);
    return rawProducts.map(normalizeLikedProduct);
}

function normalizeLikedProduct(product: RawProduct): Product {
    return {
        id: product.documentId ?? product.id ?? "",
        title: product.title ?? product.name ?? "Untitled product",
        price:
            typeof product.price === "number"
                ? product.price
                : Number(product.price ?? 0),
        imageUrl: extractImageUrl(
            product.image ?? product.images ?? product.imageUrl
        ),
        category:
            typeof product.category === "string"
                ? product.category
                : product.category?.name ?? "Uncategorized",
        slug: product.slug ?? String(product.documentId ?? product.id ?? ""),
    };
}

export default async function Page() {
    const jwt = await getJwtFromCookie();

    if (!jwt) {
        return (
            <main className="mx-auto max-w-5xl p-6">
                <h1 className="mb-4 text-3xl font-bold">Liked Products</h1>
                <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
                    You need to sign in first.
                </p>
            </main>
        );
    }

    const cookieStore = await nextCookies();
    const username = cookieStore.get("username")?.value ?? "";
    const email = cookieStore.get("userEmail")?.value;

    const userDb = await getUserDb(jwt, email, username);

    const likedProducts = await getLikedProducts(userDb);

    return (
        <MaxWidthWrapper>
            <main className="mx-auto  p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Liked Products</h1>
                        <p className="text-gray-600">
                            {username}&rsquo;s saved products
                        </p>
                    </div>
                </div>

                {likedProducts.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-700">
                        You have not liked any products yet.
                    </div>
                ) : (
                    <ProductGrid
                        products={likedProducts}
                        likedProductIds={likedProducts.map(
                            (product) => product.id
                        )}
                    />
                )}
            </main>
        </MaxWidthWrapper>
    );
}
