import { cookies } from "next/headers";
import ProductGrid from "@/src/components/productsGrid/products";
import { notFound } from "next/navigation";
import { Filters } from "@/src/components/ui/filters/filters";

export const dynamic = "force-dynamic";

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

function getMediaUrl(url?: string | null) {
    if (!url) return "/mock-images/mockshirt.png";
    if (url.startsWith("http")) return url;
    return `${STRAPI_URL}${url}`;
}

function extractLinkedAuthUserId(entry: any): number | null {
    const candidates = [
        entry?.authUser,
        entry?.auth_user,
        entry?.user,
        entry?.users_permissions_user,
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

function buildProductsQuery({
    locale,
    categorySlug,
    searchParams,
}: {
    locale: string;
    categorySlug?: string;
    searchParams: {
        min?: string;
        max?: string;
        size?: string | string[];
        sort?: string;
        featured?: string | string[];
    };
}) {
    const params = new URLSearchParams();
    params.set("populate", "*");
    params.set("locale", locale);

    if (categorySlug) {
        params.set("filters[category][slug][$eq]", categorySlug);
    }

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

    const legacySizeKeyMap: Record<string, string> = {
        one: "XS",
        two: "S",
        three: "M",
        four: "L",
        five: "XL",
        six: "XXL",
    };

    const rawSelectedSizes = Array.isArray(searchParams.size)
        ? searchParams.size
        : searchParams.size
        ? [searchParams.size]
        : [];

    const normalizedSelectedSizes = rawSelectedSizes
        .flatMap((size) => String(size).split(","))
        .map((size) => String(size).trim())
        .filter(Boolean)
        .map((size) => legacySizeKeyMap[size] || size.toUpperCase());

    const validSizeFields = [...new Set(normalizedSelectedSizes)]
        .map((size) => sizeMap[size])
        .filter(Boolean);

    validSizeFields.forEach((field, index) => {
        params.set(`filters[$or][${index}][${field}][$eq]`, "true");
    });

    const featuredMap: Record<string, string> = {
        "sp.one": "spOne",
        "sp.two": "spTwo",
        "sp.three": "spThree",
    };

    const rawFeaturedOptions = Array.isArray(searchParams.featured)
        ? searchParams.featured
        : searchParams.featured
        ? [searchParams.featured]
        : [];

    const normalizedFeaturedOptions = rawFeaturedOptions
        .flatMap((option) => String(option).split(","))
        .map((option) => String(option).trim())
        .filter(Boolean);

    const validFeaturedFields = [...new Set(normalizedFeaturedOptions)]
        .map((option) => featuredMap[option])
        .filter(Boolean);

    const featuredBaseIndex = validSizeFields.length;
    validFeaturedFields.forEach((field, index) => {
        params.set(
            `filters[$or][${featuredBaseIndex + index}][${field}][$eq]`,
            "true"
        );
    });

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

    return params.toString();
}

async function getCategory(slug: string, locale: string) {
    const res = await fetch(
        `${STRAPI_URL}/api/categories?filters[slug][$eq]=${encodeURIComponent(
            slug
        )}&locale=${locale}&populate=*`,
        { cache: "no-store" }
    );

    if (!res.ok) return null;

    const json = await res.json();
    return json.data?.[0] || null;
}

async function getProducts(
    locale: string,
    slug: string,
    searchParams: {
        min?: string;
        max?: string;
        size?: string | string[];
        sort?: string;
        featured?: string | string[];
    }
) {
    const query = buildProductsQuery({
        locale,
        categorySlug: slug,
        searchParams,
    });

    const res = await fetch(`${STRAPI_URL}/api/products?${query}`, {
        cache: "no-store",
    });

    if (!res.ok) return { data: [] };
    return res.json();
}

function getAvailableSizes(products: any[] = []) {
    const sizeMap = [
        { key: "sizeXS", label: "XS" },
        { key: "sizeS", label: "S" },
        { key: "sizeM", label: "M" },
        { key: "sizeL", label: "L" },
        { key: "sizeXL", label: "XL" },
        { key: "sizeXXL", label: "XXL" },
    ] as const;

    return sizeMap
        .filter(({ key }) =>
            products.some((product: any) => product?.[key] === true)
        )
        .map(({ label }) => label);
}

async function getJwtFromCookie() {
    const cookieStore = await cookies();
    return cookieStore.get("jwt")?.value ?? null;
}

async function getLikedProductIds(jwt: string) {
    try {
        const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            cache: "no-store",
        });

        if (!meRes.ok) return [] as Array<string | number>;

        const me = await meRes.json();

        const userDbRes = await fetch(`${STRAPI_URL}/api/userdbs?populate=*`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!userDbRes.ok) return [] as Array<string | number>;

        const userDbJson = await userDbRes.json();
        const entries = Array.isArray(userDbJson?.data) ? userDbJson.data : [];

        const entry = entries.find(
            (item: any) => extractLinkedAuthUserId(item) === me.id
        );

        const likedProducts =
            entry?.likedProducts ?? entry?.liked_products ?? [];

        if (Array.isArray(likedProducts)) {
            return likedProducts
                .map((product: any) => product?.documentId ?? product?.id)
                .filter(Boolean);
        }

        return [] as Array<string | number>;
    } catch (error) {
        console.error("Failed to fetch liked products", error);
        return [] as Array<string | number>;
    }
}

export default async function CategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; slug: string }>;
    searchParams: Promise<{
        min?: string;
        max?: string;
        size?: string | string[];
        sort?: string;
        featured?: string | string[];
    }>;
}) {
    const { locale, slug } = await params;
    const filters = await searchParams;

    const category = await getCategory(slug, locale);
    if (!category) notFound();

    const productsResponse = await getProducts(locale, slug, filters);
    const sizeOptionsResponse = await getProducts(locale, slug, {
        ...filters,
        size: undefined,
    });
    const availableSizes = getAvailableSizes(sizeOptionsResponse.data);
    const jwt = await getJwtFromCookie();
    const likedProductIds = jwt ? await getLikedProductIds(jwt) : [];

    const formattedProducts = productsResponse.data.map((item: any) => ({
        id: item.documentId,
        title: item.title,
        price: item.price,
        imageUrl: getMediaUrl(item.image?.[0]?.url || item.image?.url),
        category: item.category?.name || "Uncategorized",
        slug: item.slug,
    }));

    return (
        <main className="bg-white text-black min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">{category.name}</h1>

                <div className="grid lg:grid-cols-[280px_1fr] gap-8">
                    <div>
                        <Filters
                            initialValues={{
                                min: filters.min,
                                max: filters.max,
                                size: filters.size,
                                sort: filters.sort,
                                featured: filters.featured,
                            }}
                            availableSizes={availableSizes}
                        />
                    </div>

                    <div>
                        <ProductGrid
                            products={formattedProducts}
                            likedProductIds={likedProductIds}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
