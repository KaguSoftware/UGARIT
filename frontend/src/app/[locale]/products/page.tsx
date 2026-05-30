import { unstable_cache } from "next/cache";
import ProductGrid from "@/src/components/productsGrid/products";
import { Filters } from "@/src/components/ui/filters/filters";
import {
    fetchProducts,
    fetchSizeAvailability,
    getAvailableSizes,
    type ProductFilters,
} from "@/src/lib/queries";
import { getLikedProductIds } from "@/src/lib/user-db";

function normalizeFilters(searchParams: ProductFilters) {
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

function getProducts(locale: string, filters: ProductFilters) {
    const n = normalizeFilters(filters);
    return unstable_cache(
        async () => fetchProducts({ locale, filters }),
        [
            "all-products-page",
            locale,
            n.min,
            n.max,
            n.sort,
            n.size.join("|"),
            n.featured.join("|"),
        ],
        { revalidate: 120, tags: [`products:all:${locale}`, `products:all:${locale}:grid`] }
    )();
}

function getSizes(locale: string, filters: ProductFilters) {
    const n = normalizeFilters(filters);
    return unstable_cache(
        async () =>
            fetchSizeAvailability({
                filters: { min: filters.min, max: filters.max, featured: filters.featured },
            }),
        ["all-products-sizes", locale, n.min, n.max, n.featured.join("|")],
        { revalidate: 120, tags: [`products:all:${locale}`, `products:all:${locale}:sizes`] }
    )();
}

export default async function ProductList({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<ProductFilters>;
}) {
    const { locale } = await params;
    const filters = await searchParams;

    const [products, sizeRows, likedProductIds] = await Promise.all([
        getProducts(locale, filters),
        getSizes(locale, filters),
        getLikedProductIds(),
    ]);

    const availableSizes = getAvailableSizes(sizeRows);

    return (
        <main className="bg-white text-black min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">All Products</h1>

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
                            products={products}
                            likedProductIds={likedProductIds}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
