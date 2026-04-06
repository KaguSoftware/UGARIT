import { cookies } from "next/headers";
import ProductGrid from "@/src/components/productsGrid/products";
import {
    getStrapiMedia,
    strapiPrivateFetch,
    strapiPublicFetch,
} from "@/src/lib/strapi";

function appendFields(params: URLSearchParams, key: string, fields: string[]) {
    fields.forEach((field, index) => {
        params.append(`${key}[fields][${index}]`, field);
    });
}

function buildProductsQuery({
    locale,
    searchParams,
}: {
    locale: string;
    searchParams: {
        min?: string;
        max?: string;
        size?: string;
        sort?: string;
        featured?: string;
    };
}) {
    const params = new URLSearchParams();
    params.set("locale", locale);

    ["documentId", "title", "price", "slug"].forEach((field, index) => {
        params.append(`fields[${index}]`, field);
    });

    appendFields(params, "populate[image]", ["url"]);
    appendFields(params, "populate[category]", ["name"]);

    if (searchParams.min) {
        params.set("filters[price][$gte]", searchParams.min);
    }

    if (searchParams.max) {
        params.set("filters[price][$lte]", searchParams.max);
    }

    if (searchParams.featured === "true") {
        params.set("filters[isFeatured][$eq]", "true");
    }

    const sizeMap: Record<string, string> = {
        XS: "sizeXS",
        S: "sizeS",
        M: "sizeM",
        L: "sizeL",
        XL: "sizeXL",
        XXL: "sizeXXL",
    };

    if (searchParams.size && sizeMap[searchParams.size]) {
        params.set(`filters[${sizeMap[searchParams.size]}][$eq]`, "true");
    }

    switch (searchParams.sort) {
        case "price-asc":
            params.append("sort[0]", "price:asc");
            break;
        case "price-desc":
            params.append("sort[0]", "price:desc");
            break;
        case "title-asc":
            params.append("sort[0]", "title:asc");
            break;
    }

    return Object.fromEntries(params.entries());
}

async function getProducts(
    locale: string,
    searchParams: {
        min?: string;
        max?: string;
        size?: string;
        sort?: string;
        featured?: string;
    }
) {
    try {
        return await strapiPublicFetch<{ data: any[] }>("/api/products", {
            query: buildProductsQuery({ locale, searchParams }),
            revalidate: 120,
            tags: [`products:list:${locale}`],
        });
    } catch (error) {
        console.error("Failed to fetch products", error);
        return { data: [] };
    }
}

async function getJwtFromCookie() {
    const cookieStore = await cookies();
    return cookieStore.get("jwt")?.value ?? null;
}

async function getLikedProductIds(jwt: string) {
    try {
        const me = await strapiPrivateFetch<{
            email?: string;
            username?: string;
        }>("/api/users/me", {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        });

        const queries = [
            me.email
                ? {
                      filters: {
                          email: {
                              $eq: me.email,
                          },
                      },
                  }
                : null,
            me.username
                ? {
                      filters: {
                          username: {
                              $eq: me.username,
                          },
                      },
                  }
                : null,
        ].filter(Boolean) as Array<Record<string, any>>;

        for (const query of queries) {
            const userDbJson = await strapiPrivateFetch<{ data?: any[] }>(
                "/api/userdbs",
                {
                    query: {
                        ...query,
                        pagination: { pageSize: 1 },
                        fields: ["email", "username", "documentId"],
                        populate: {
                            likedProducts: {
                                fields: ["documentId", "id"],
                            },
                        },
                    },
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const entry = Array.isArray(userDbJson?.data)
                ? userDbJson.data[0]
                : null;

            const likedProducts = entry?.likedProducts ?? [];

            if (Array.isArray(likedProducts)) {
                return likedProducts
                    .map((product: any) => product?.documentId ?? product?.id)
                    .filter(Boolean);
            }
        }

        return [] as Array<string | number>;
    } catch (error) {
        console.error("Failed to fetch liked products", error);
        return [] as Array<string | number>;
    }
}

export default async function ProductList({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        min?: string;
        max?: string;
        size?: string;
        sort?: string;
        featured?: string;
    }>;
}) {
    const { locale } = await params;
    const filters = await searchParams;

    const strapiResponse = await getProducts(locale, filters);
    const jwt = await getJwtFromCookie();
    const likedProductIds = jwt ? await getLikedProductIds(jwt) : [];

    const formattedProducts = strapiResponse.data.map((item: any) => ({
        id: item.documentId,
        title: item.title,
        price: item.price,
        imageUrl: getStrapiMedia(item.image?.[0]?.url || item.image?.url),
        category: item.category?.name || "Uncategorized",
        slug: item.slug,
    }));

    return (
        <main className="bg-white text-black min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">All Products</h1>

                <div className="grid lg:grid-cols-[280px_1fr] gap-8">
                    <ProductGrid
                        products={formattedProducts}
                        likedProductIds={likedProductIds}
                    />
                </div>
            </div>
        </main>
    );
}
