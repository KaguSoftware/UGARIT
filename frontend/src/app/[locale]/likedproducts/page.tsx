import { cookies } from "next/headers";
import { Link } from "@/src/i18n/routing";

const STRAPI_URL = "http://localhost:1337";

type Product = {
    id: number;
    documentId?: string;
    title?: string;
    name?: string;
    slug?: string;
    price?: number | string;
};

type UserDbEntry = {
    id: number;
    documentId?: string;
    username?: string | null;
    email?: string | null;
    likedProducts?: Product[];
    liked_products?: Product[];
    authUser?: { id?: number } | number | null;
    auth_user?: { id?: number } | number | null;
    user?: { id?: number } | number | null;
    users_permissions_user?: { id?: number } | number | null;
};

type AuthUser = {
    id: number;
    username: string;
    email: string;
};

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

function extractLinkedAuthUserId(entry: UserDbEntry): number | null {
    const candidates = [
        entry.authUser,
        entry.auth_user,
        entry.user,
        entry.users_permissions_user,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "number") {
            return candidate;
        }

        if (
            candidate &&
            typeof candidate === "object" &&
            typeof candidate.id === "number"
        ) {
            return candidate.id;
        }
    }

    return null;
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

        return (
            entries.find((entry) => {
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

function getLikedProducts(entry: UserDbEntry | null) {
    if (!entry) return [] as Product[];

    if (Array.isArray(entry.likedProducts)) {
        return entry.likedProducts;
    }

    if (Array.isArray(entry.liked_products)) {
        return entry.liked_products;
    }

    return [] as Product[];
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
    const likedProducts = getLikedProducts(userDb);

    return (
        <main className="mx-auto max-w-6xl p-6">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {likedProducts.map((product) => {
                        const href = product.slug
                            ? `/products/${product.slug}`
                            : "/";

                        return (
                            <Link
                                key={product.id}
                                href={href}
                                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
                            >
                                <h2 className="text-xl font-semibold">
                                    {product.title ??
                                        product.name ??
                                        "Untitled product"}
                                </h2>
                                <p className="mt-2 text-sm text-gray-500">
                                    Product ID: {product.id}
                                </p>
                                <p className="mt-3 text-lg font-medium">
                                    {product.price ?? "-"}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
