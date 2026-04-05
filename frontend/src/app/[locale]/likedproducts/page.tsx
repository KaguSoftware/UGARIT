import { cookies } from "next/headers";
import ProductGrid from "@/src/components/productsGrid/products";
import type { Product } from "@/src/components/cards/ProductCard/types";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";

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
    liked_products?: RawProduct[] | { data?: unknown } | null;
    authUser?: { id?: number } | number | { data?: unknown } | null;
    auth_user?: { id?: number } | number | { data?: unknown } | null;
    user?: { id?: number } | number | { data?: unknown } | null;
    users_permissions_user?:
        | { id?: number }
        | number
        | { data?: unknown }
        | null;
    attributes?: {
        documentId?: string;
        username?: string | null;
        email?: string | null;
        likedProducts?: RawProduct[] | { data?: unknown } | null;
        liked_products?: RawProduct[] | { data?: unknown } | null;
        authUser?: { id?: number } | number | { data?: unknown } | null;
        auth_user?: { id?: number } | number | { data?: unknown } | null;
        user?: { id?: number } | number | { data?: unknown } | null;
        users_permissions_user?:
            | { id?: number }
            | number
            | { data?: unknown }
            | null;
    };
};

type AuthUser = {
    id: number;
    username: string;
    email: string;
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
        liked_products:
            normalizedEntry.liked_products ??
            entry.liked_products ??
            normalizedEntry.attributes?.liked_products,
        authUser:
            normalizedEntry.authUser ??
            entry.authUser ??
            normalizedEntry.attributes?.authUser,
        auth_user:
            normalizedEntry.auth_user ??
            entry.auth_user ??
            normalizedEntry.attributes?.auth_user,
        user:
            normalizedEntry.user ??
            entry.user ??
            normalizedEntry.attributes?.user,
        users_permissions_user:
            normalizedEntry.users_permissions_user ??
            entry.users_permissions_user ??
            normalizedEntry.attributes?.users_permissions_user,
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

function unwrapRelationUserId(value: unknown): number | null {
    if (typeof value === "number") {
        return value;
    }

    if (value && typeof value === "object") {
        const record = value as {
            id?: number;
            data?: unknown;
            attributes?: { id?: number };
        };

        if (typeof record.id === "number") {
            return record.id;
        }

        if (record.data && typeof record.data === "object") {
            const relationData = record.data as {
                id?: number;
                attributes?: { id?: number };
            };

            if (typeof relationData.id === "number") {
                return relationData.id;
            }

            if (typeof relationData.attributes?.id === "number") {
                return relationData.attributes.id;
            }
        }

        if (typeof record.attributes?.id === "number") {
            return record.attributes.id;
        }
    }

    return null;
}

function extractLinkedAuthUserId(entry: UserDbEntry): number | null {
    const normalizedEntry = normalizeUserDbEntry(entry);
    const candidates = [
        normalizedEntry.authUser,
        normalizedEntry.auth_user,
        normalizedEntry.user,
        normalizedEntry.users_permissions_user,
    ];

    for (const candidate of candidates) {
        const id = unwrapRelationUserId(candidate);

        if (id !== null) {
            return id;
        }
    }

    return null;
}

async function getJwtFromCookie() {
    const cookieStore = await cookies();
    return cookieStore.get("jwt")?.value ?? null;
}

async function getAuthenticatedUser(jwt: string): Promise<AuthUser | null> {
    const response = await fetch(`${STRAPI_URL}/api/users/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        return null;
    }

    return (await response.json()) as AuthUser;
}

async function getUserDb(
    jwt: string,
    authUserId: number,
    authUserEmail?: string,
    authUsername?: string
): Promise<UserDbEntry | null> {
    try {
        const response = await fetch(`${STRAPI_URL}/api/userdbs?populate=*`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return null;
        }

        const json = await response.json();
        const entries = Array.isArray(json?.data)
            ? (json.data as UserDbEntry[])
            : [];
        const normalizedEntries = entries.map(normalizeUserDbEntry);

        return (
            normalizedEntries.find((entry) => {
                const linkedAuthUserId = extractLinkedAuthUserId(entry);

                if (linkedAuthUserId === authUserId) {
                    return true;
                }

                if (authUserEmail && entry.email === authUserEmail) {
                    return true;
                }

                if (authUsername && entry.username === authUsername) {
                    return true;
                }

                return false;
            }) ?? null
        );
    } catch (error) {
        console.error("Failed to fetch user profile", error);
        return null;
    }
}

function getMediaUrl(url?: string | null) {
    if (!url) return "/image1.jpeg";
    if (url.startsWith("http")) return url;
    return `${STRAPI_URL}${url}`;
}

function extractImageUrl(image: unknown): string {
    if (!image) return "/image1.jpeg";

    if (Array.isArray(image)) {
        return image.length > 0 ? extractImageUrl(image[0]) : "/image1.jpeg";
    }

    if (typeof image === "string") {
        return getMediaUrl(image);
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
            return getMediaUrl(formatUrl);
        }

        if (imageRecord.url) {
            return getMediaUrl(imageRecord.url);
        }

        if (imageRecord.attributes?.url) {
            return getMediaUrl(imageRecord.attributes.url);
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

    const directLikedProductsAlt = Array.isArray(normalizedEntry.liked_products)
        ? normalizedEntry.liked_products
        : [];

    if (directLikedProductsAlt.length > 0) {
        return directLikedProductsAlt;
    }

    const likedProducts = unwrapRelationArray(normalizedEntry.likedProducts);

    if (likedProducts.length > 0) {
        return likedProducts;
    }

    const likedProductsAlt = unwrapRelationArray(
        normalizedEntry.liked_products
    );

    if (likedProductsAlt.length > 0) {
        return likedProductsAlt;
    }

    return [] as RawProduct[];
}

async function fetchFullLikedProduct(
    jwt: string,
    product: RawProduct
): Promise<RawProduct> {
    const productId = product.id;
    const productDocumentId = product.documentId;

    const urls = [
        productDocumentId
            ? `${STRAPI_URL}/api/products/${productDocumentId}?populate=*`
            : null,
        productId ? `${STRAPI_URL}/api/products/${productId}?populate=*` : null,
        productDocumentId
            ? `${STRAPI_URL}/api/products?filters[documentId][$eq]=${productDocumentId}&populate=*`
            : null,
    ].filter((url): url is string => Boolean(url));

    if (urls.length === 0) {
        return product;
    }

    for (const url of urls) {
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            });

            if (!response.ok) {
                continue;
            }

            const json = await response.json();
            const data = Array.isArray(json?.data) ? json.data[0] : json?.data;

            if (!data || typeof data !== "object") {
                continue;
            }

            if ("attributes" in data && data.attributes) {
                const record = data as {
                    id?: number | string;
                    documentId?: string;
                    attributes?: Record<string, unknown>;
                };

                return {
                    ...product,
                    id: record.id ?? product.id,
                    documentId: record.documentId ?? product.documentId,
                    ...(record.attributes ?? {}),
                } as RawProduct;
            }

            return {
                ...product,
                ...(data as RawProduct),
            };
        } catch (error) {
            console.error("Failed to fetch full liked product", error);
        }
    }

    return product;
}

async function getLikedProducts(entry: UserDbEntry | null, jwt: string) {
    const rawProducts = getRawLikedProducts(entry);
    const fullProducts = await Promise.all(
        rawProducts.map((product) => fetchFullLikedProduct(jwt, product))
    );

    return fullProducts.map(normalizeLikedProduct);
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
            product.imageUrl ?? product.image ?? product.images
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

    const authUser = await getAuthenticatedUser(jwt);

    if (!authUser) {
        return (
            <main className="mx-auto max-w-5xl p-6">
                <h1 className="mb-4 text-3xl font-bold">Liked Products</h1>
                <p className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
                    Could not load the signed-in user.
                </p>
            </main>
        );
    }

    const userDb = await getUserDb(
        jwt,
        authUser.id,
        authUser.email,
        authUser.username
    );

    const likedProducts = await getLikedProducts(userDb, jwt);

    return (
        <MaxWidthWrapper>
            <main className="mx-auto  p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Liked Products</h1>
                        <p className="text-gray-600">
                            {authUser.username}&rsquo;s saved products
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
