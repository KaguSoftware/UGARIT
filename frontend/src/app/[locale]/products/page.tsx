import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import ProductGrid from "@/src/components/productsGrid/products";
import { Filters } from "@/src/components/ui/filters/filters";
import { getStrapiMedia, strapiPublicFetch } from "@/src/lib/strapi";
import { getLikedProductIds } from "@/src/lib/user-db";

function appendFields(params: URLSearchParams, key: string, fields: string[]) {
    fields.forEach((field, index) => {
        params.append(`${key}[fields][${index}]`, field);
    });
}

function normalizeFilters(searchParams: {
    min?: string;
    max?: string;
    size?: string | string[];
    sort?: string;
    featured?: string | string[];
}) {
    const normalizeList = (value?: string | string[]) => {
        const values = Array.isArray(value) ? value : value ? [value] : [];

        return values
            .flatMap((item) => String(item).split(","))
            .map((item) => item.trim())
            .filter(Boolean)
            .sort();
    };

    return {
        min: searchParams.min ?? "",
        max: searchParams.max ?? "",
        sort: searchParams.sort ?? "",
        size: normalizeList(searchParams.size),
        featured: normalizeList(searchParams.featured),
    };
}

function buildProductsQuery({
    locale,
    searchParams,
    sizeOnly = false,
}: {
    locale: string;
    searchParams: {
        min?: string;
        max?: string;
        size?: string | string[];
        sort?: string;
        featured?: string | string[];
    };
    sizeOnly?: boolean;
}) {
    const params = new URLSearchParams();
    params.set("locale", locale);

    const baseFields = sizeOnly
        ? ["sizeXS", "sizeS", "sizeM", "sizeL", "sizeXL", "sizeXXL"]
        : [
              "documentId",
              "title",
              "price",
              "slug",
              "sizeXS",
              "sizeS",
              "sizeM",
              "sizeL",
              "sizeXL",
              "sizeXXL",
          ];

    baseFields.forEach((field, index) => {
        params.append(`fields[${index}]`, field);
    });

    if (!sizeOnly) {
        appendFields(params, "populate[image]", ["url"]);
        appendFields(params, "populate[category]", ["name", "slug"]);
    }

    if (searchParams.min) {
        params.set("filters[price][$gte]", searchParams.min);
    }

    if (searchParams.max) {
        params.set("filters[price][$lte]", searchParams.max);
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

    if (!sizeOnly) {
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
    }

    return params.toString();
}

async function getProducts(
    locale: string,
    searchParams: {
        min?: string;
        max?: string;
        size?: string | string[];
        sort?: string;
        featured?: string | string[];
    },
    options?: {
        sizeOnly?: boolean;
    }
) {
    const normalizedFilters = normalizeFilters(searchParams);
    const sizeOnly = Boolean(options?.sizeOnly);

    const getCachedProducts = unstable_cache(
        async () => {
            const json = await strapiPublicFetch<{ data: any[] }>(
                "/api/products",
                {
                    query: Object.fromEntries(
                        new URLSearchParams(
                            buildProductsQuery({
                                locale,
                                searchParams,
                                sizeOnly,
                            })
                        )
                    ),
                    revalidate: 120,
                    tags: [
                        `products:all:${locale}`,
                        `products:all:${locale}:${sizeOnly ? "sizes" : "grid"}`,
                    ],
                }
            );

            return json;
        },
        [
            "all-products-page",
            locale,
            sizeOnly ? "sizes" : "grid",
            normalizedFilters.min,
            normalizedFilters.max,
            normalizedFilters.sort,
            normalizedFilters.size.join("|"),
            normalizedFilters.featured.join("|"),
        ],
        {
            revalidate: 120,
            tags: [
                `products:all:${locale}`,
                `products:all:${locale}:${sizeOnly ? "sizes" : "grid"}`,
            ],
        }
    );

    return getCachedProducts();
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

export default async function ProductList({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        min?: string;
        max?: string;
        size?: string | string[];
        sort?: string;
        featured?: string | string[];
    }>;
}) {
    const { locale } = await params;
    const filters = await searchParams;

    // Fetch grid products and available sizes simultaneously
    const [productsResponse, sizeOptionsResponse] = await Promise.all([
        getProducts(locale, filters),
        getProducts(
            locale,
            {
                ...filters,
                size: undefined,
                sort: undefined,
            },
            { sizeOnly: true }
        ),
    ]);

    const availableSizes = getAvailableSizes(sizeOptionsResponse.data);
    const jwt = await getJwtFromCookie();
    const likedProductIds = jwt ? await getLikedProductIds(jwt) : [];

    const formattedProducts = productsResponse.data.map((item: any) => ({
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
                    {/* Filters Sidebar */}
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

                    {/* Product Grid */}
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
