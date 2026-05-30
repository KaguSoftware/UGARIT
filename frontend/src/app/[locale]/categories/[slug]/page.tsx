import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import ProductGrid from "@/src/components/productsGrid/products";
import { Filters } from "@/src/components/ui/filters/filters";
import {
    fetchProducts,
    fetchSizeAvailability,
    fetchCategoryBySlug,
    fetchAllCategorySlugs,
    getAvailableSizes,
    type ProductFilters,
} from "@/src/lib/queries";
import { getLikedProductIds } from "@/src/lib/user-db";

const LOCALES = ["tr", "en", "ar"];

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

function getCategory(slug: string, locale: string) {
    return unstable_cache(
        async () => fetchCategoryBySlug(slug, locale),
        ["category-page-category", locale, slug],
        { revalidate: 300, tags: [`category:${locale}:${slug}`] }
    )();
}

function getProducts(locale: string, slug: string, filters: ProductFilters) {
    const n = normalizeFilters(filters);
    return unstable_cache(
        async () => fetchProducts({ locale, categorySlug: slug, filters }),
        [
            "category-page-products",
            locale,
            slug,
            n.min,
            n.max,
            n.sort,
            n.size.join("|"),
            n.featured.join("|"),
        ],
        {
            revalidate: 120,
            tags: [`products:${locale}:${slug}`, `products:${locale}:${slug}:grid`],
        }
    )();
}

function getSizes(locale: string, slug: string, filters: ProductFilters) {
    const n = normalizeFilters(filters);
    return unstable_cache(
        async () =>
            fetchSizeAvailability({
                categorySlug: slug,
                filters: { min: filters.min, max: filters.max, featured: filters.featured },
            }),
        ["category-page-sizes", locale, slug, n.min, n.max, n.featured.join("|")],
        {
            revalidate: 120,
            tags: [`products:${locale}:${slug}`, `products:${locale}:${slug}:sizes`],
        }
    )();
}

export async function generateStaticParams() {
    const results: { locale: string; slug: string }[] = [];
    try {
        const slugs = await fetchAllCategorySlugs();
        for (const slug of slugs) {
            for (const locale of LOCALES) results.push({ locale, slug });
        }
    } catch {
        // skip static generation if the DB is unreachable at build time
    }
    return results;
}

export default async function CategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; slug: string }>;
    searchParams: Promise<ProductFilters>;
}) {
    const { locale, slug } = await params;
    const filters = await searchParams;

    const [category, products, sizeRows, likedProductIds] = await Promise.all([
        getCategory(slug, locale),
        getProducts(locale, slug, filters),
        getSizes(locale, slug, filters),
        getLikedProductIds(),
    ]);

    if (!category) notFound();

    const availableSizes = getAvailableSizes(sizeRows);

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
                            products={products}
                            likedProductIds={likedProductIds}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
