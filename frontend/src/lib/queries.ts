import { createAdminClient } from "@/src/lib/supabase/admin";
import { localized, firstImage, type Locale } from "@/src/lib/supabase/media";

/**
 * Read-side data access for the storefront, backed by Supabase.
 * These run server-side and use the service-role client purely as a stable,
 * RLS-free reader for the public catalog (no user-specific data is exposed here).
 *
 * The shapes returned mirror what the UI components already expect
 * (e.g. { id, title, price, imageUrl, category, slug }), so components are unchanged.
 */

export type StoreProduct = {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    category: string;
    slug: string;
};

const SIZE_COLUMNS = [
    "size_xs",
    "size_s",
    "size_m",
    "size_l",
    "size_xl",
    "size_xxl",
] as const;

const PRODUCT_LIST_COLUMNS =
    "id, slug, title, price, images, " +
    SIZE_COLUMNS.join(", ") +
    ", category:categories(name)";

export type ProductFilters = {
    min?: string;
    max?: string;
    size?: string | string[];
    sort?: string;
    featured?: string | string[];
};

const SIZE_MAP: Record<string, string> = {
    XS: "size_xs",
    S: "size_s",
    M: "size_m",
    L: "size_l",
    XL: "size_xl",
    XXL: "size_xxl",
};

const LEGACY_SIZE_KEY_MAP: Record<string, string> = {
    one: "XS",
    two: "S",
    three: "M",
    four: "L",
    five: "XL",
    six: "XXL",
};

const FEATURED_MAP: Record<string, string> = {
    "sp.one": "sp_one",
    "sp.two": "sp_two",
    "sp.three": "sp_three",
};

function toList(value?: string | string[]): string[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return values
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean);
}

function resolveSizeColumns(size?: string | string[]): string[] {
    const normalized = toList(size).map(
        (s) => LEGACY_SIZE_KEY_MAP[s] || s.toUpperCase()
    );
    return [...new Set(normalized)].map((s) => SIZE_MAP[s]).filter(Boolean);
}

function resolveFeaturedColumns(featured?: string | string[]): string[] {
    const normalized = toList(featured);
    return [...new Set(normalized)].map((f) => FEATURED_MAP[f]).filter(Boolean);
}

/**
 * Builds and runs a product-list query with the same filtering semantics the
 * old Strapi pages used: price range, size OR-filter, sp.* featured OR-filter,
 * optional category, and sort.
 */
export async function fetchProducts(options: {
    locale: string;
    categorySlug?: string;
    filters: ProductFilters;
}): Promise<StoreProduct[]> {
    const { locale, categorySlug, filters } = options;
    const supabase = createAdminClient();

    let categoryId: string | null = null;
    if (categorySlug) {
        const { data: cat } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", categorySlug)
            .maybeSingle();
        // Unknown category → no products.
        if (!cat) return [];
        categoryId = cat.id;
    }

    let query = supabase.from("products").select(PRODUCT_LIST_COLUMNS);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (filters.min) query = query.gte("price", Number(filters.min));
    if (filters.max) query = query.lte("price", Number(filters.max));

    // Size + featured behave as a combined OR across boolean columns (matches
    // the old Strapi filters[$or] behavior).
    const orColumns = [
        ...resolveSizeColumns(filters.size),
        ...resolveFeaturedColumns(filters.featured),
    ];
    if (orColumns.length > 0) {
        query = query.or(orColumns.map((col) => `${col}.eq.true`).join(","));
    }

    switch (filters.sort) {
        case "price-asc":
            query = query.order("price", { ascending: true });
            break;
        case "price-desc":
            query = query.order("price", { ascending: false });
            break;
        case "title-asc":
            // JSONB ordering by the active locale.
            query = query.order(`title->>${locale}`, { ascending: true });
            break;
        default:
            query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((item: any) => formatProduct(item, locale));
}

export function formatProduct(item: any, locale: string): StoreProduct {
    return {
        id: item.id,
        title: localized(item.title, locale) || "Untitled product",
        price: typeof item.price === "number" ? item.price : Number(item.price ?? 0),
        imageUrl: firstImage(item.images),
        category: item.category?.name
            ? localized(item.category.name, locale) || "Uncategorized"
            : "Uncategorized",
        slug: item.slug,
    };
}

/**
 * Sizes that are available across a set of products (drives the filter UI).
 * Works on the raw rows returned by fetchProductsRaw.
 */
export function getAvailableSizes(rows: any[] = []): string[] {
    const map = [
        { key: "size_xs", label: "XS" },
        { key: "size_s", label: "S" },
        { key: "size_m", label: "M" },
        { key: "size_l", label: "L" },
        { key: "size_xl", label: "XL" },
        { key: "size_xxl", label: "XXL" },
    ] as const;

    return map
        .filter(({ key }) => rows.some((r) => r?.[key] === true))
        .map(({ label }) => label);
}

/**
 * Fetches the size-availability rows for a product set (mirrors the old
 * "sizeOnly" query). Applies price/category filters but not size/sort, so the
 * available-size list reflects the full set under the current price/category.
 */
export async function fetchSizeAvailability(options: {
    categorySlug?: string;
    filters: Pick<ProductFilters, "min" | "max" | "featured">;
}): Promise<any[]> {
    const { categorySlug, filters } = options;
    const supabase = createAdminClient();

    let categoryId: string | null = null;
    if (categorySlug) {
        const { data: cat } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", categorySlug)
            .maybeSingle();
        if (!cat) return [];
        categoryId = cat.id;
    }

    let query = supabase.from("products").select(SIZE_COLUMNS.join(", "));
    if (categoryId) query = query.eq("category_id", categoryId);
    if (filters.min) query = query.gte("price", Number(filters.min));
    if (filters.max) query = query.lte("price", Number(filters.max));

    const featuredColumns = resolveFeaturedColumns(filters.featured);
    if (featuredColumns.length > 0) {
        query = query.or(featuredColumns.map((c) => `${c}.eq.true`).join(","));
    }

    const { data } = await query;
    return data ?? [];
}

/**
 * Featured products for the homepage.
 */
export async function fetchFeaturedProducts(
    locale: string
): Promise<StoreProduct[]> {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("products")
        .select(PRODUCT_LIST_COLUMNS)
        .eq("is_featured", true)
        .order(`title->>${locale}`, { ascending: true });

    return (data ?? []).map((item: any) => formatProduct(item, locale));
}

/**
 * Categories shown on the homepage grid.
 */
export async function fetchHomepageCategories(locale: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("categories")
        .select("id, slug, name, image_url")
        .order("slug", { ascending: true });

    return (data ?? []).map((item: any) => ({
        id: item.id,
        title: localized(item.name, locale) || item.slug,
        moreLink: `/categories/${item.slug}`,
        imageUrl: item.image_url || "/image1.jpeg",
    }));
}

/**
 * Categories shown in the navbar (shape matches the Navbar's StrapiCategory).
 */
export async function fetchNavbarCategories(locale: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("categories")
        .select("id, slug, name, show_in_navbar, is_mega_menu, mega_menu_content")
        .eq("show_in_navbar", true)
        .order("slug", { ascending: true });

    return (data ?? []).map((item: any) => ({
        documentId: item.id,
        name: localized(item.name, locale) || item.slug,
        slug: item.slug,
        showInNavbar: item.show_in_navbar,
        isMegaMenu: item.is_mega_menu,
        megaMenuContent: item.mega_menu_content ?? null,
    }));
}

/**
 * Single category by slug (for the category page header).
 */
export async function fetchCategoryBySlug(slug: string, locale: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("categories")
        .select("id, slug, name")
        .eq("slug", slug)
        .maybeSingle();

    if (!data) return null;
    return { slug: data.slug, name: localized(data.name, locale) || data.slug };
}

/**
 * Full product detail by slug, including color variants.
 */
export async function fetchProductBySlug(slug: string, locale: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
        .from("products")
        .select(
            "*, variants:product_color_variants(id, image_url, position, color:colors(name, hex_code))"
        )
        .eq("slug", slug)
        .maybeSingle();

    if (!data) return null;

    const variants = (data.variants ?? [])
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((v: any) => ({
            id: v.id,
            color: v.color
                ? {
                      name: localized(v.color.name, locale),
                      hexCode: v.color.hex_code,
                  }
                : null,
            imageUrl: v.image_url || "/mock-images/mockshirt.png",
        }))
        .filter((v: any) => v.color);

    return {
        id: data.id,
        slug: data.slug,
        title: localized(data.title, locale),
        description: localized(data.description, locale),
        price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
        images: Array.isArray(data.images) ? data.images : [],
        modelHeight: data.model_height,
        modelWeight: data.model_weight,
        modelSize: data.model_size,
        sizes: {
            XS: data.size_xs,
            S: data.size_s,
            M: data.size_m,
            L: data.size_l,
            XL: data.size_xl,
            XXL: data.size_xxl,
        },
        variants,
    };
}

/**
 * All product slugs (for generateStaticParams).
 */
export async function fetchAllProductSlugs(): Promise<string[]> {
    const supabase = createAdminClient();
    const { data } = await supabase.from("products").select("slug");
    return (data ?? []).map((p: any) => p.slug).filter(Boolean);
}

/**
 * All category slugs (for generateStaticParams).
 */
export async function fetchAllCategorySlugs(): Promise<string[]> {
    const supabase = createAdminClient();
    const { data } = await supabase.from("categories").select("slug");
    return (data ?? []).map((c: any) => c.slug).filter(Boolean);
}

export type { Locale };
