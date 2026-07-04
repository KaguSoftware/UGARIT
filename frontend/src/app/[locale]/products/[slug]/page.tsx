import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { PRODUCTPAGE } from "./constants";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductInteractive from "./ProductInteractive";
import {
    fetchProductBySlug,
    fetchAllProductSlugs,
} from "@/src/lib/queries";
import { getMediaUrl, firstImage } from "@/src/lib/supabase/media";
import { getLikedProductIds } from "@/src/lib/user-db";
import { getWhatsappNumber } from "@/src/lib/settings";

const LOCALES = ["tr", "en", "ar"];

function getProduct(slug: string, locale: string) {
    return unstable_cache(
        async () => fetchProductBySlug(slug, locale),
        ["product-detail", locale, slug],
        { revalidate: 300, tags: [`product:${locale}:${slug}`] }
    )();
}

export async function generateStaticParams() {
    const results: { locale: string; slug: string }[] = [];
    try {
        const slugs = await fetchAllProductSlugs();
        for (const slug of slugs) {
            for (const locale of LOCALES) results.push({ locale, slug });
        }
    } catch {
        // skip static generation if the DB is unreachable at build time
    }
    return results;
}

export default async function ProductDetail({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale, slug } = await params;
    const t = await getTranslations();

    const product = await getProduct(slug, locale);
    if (!product) notFound();

    const [likedIds, whatsappNumber] = await Promise.all([
        getLikedProductIds(),
        getWhatsappNumber(),
    ]);
    const isLiked = likedIds.includes(product.id);

    const mainImageUrl = firstImage(product.images);
    const fallbackImages = product.images.map((img: string) => getMediaUrl(img));

    const sizeOptions = [
        { label: "XS", isAvailable: product.sizes.XS },
        { label: "S", isAvailable: product.sizes.S },
        { label: "M", isAvailable: product.sizes.M },
        { label: "L", isAvailable: product.sizes.L },
        { label: "XL", isAvailable: product.sizes.XL },
        { label: "XXL", isAvailable: product.sizes.XXL },
    ];

    return (
        <MaxWidthWrapper>
            <main className="py-10 px-6">
                <ProductInteractive
                    documentId={product.id}
                    price={product.price}
                    title={product.title}
                    slug={product.slug}
                    isLiked={isLiked}
                    description={product.description}
                    initialImage={mainImageUrl}
                    fallbackImages={fallbackImages}
                    colorVariants={product.variants}
                    sizeOptions={sizeOptions}
                    stock={product.stock}
                    whatsappNumber={whatsappNumber}
                    modelInfo={{
                        modelHeight: product.modelHeight,
                        modelWeight: product.modelWeight,
                        modelSize: product.modelSize,
                    }}
                    translations={{
                        colors: t(PRODUCTPAGE.colors),
                        desc: t(PRODUCTPAGE.desc),
                        sizetext: t(PRODUCTPAGE.sizetext),
                        addtocart: t(PRODUCTPAGE.addtocart),
                        linktext: t(PRODUCTPAGE.linktext),
                        whatsapp: t(PRODUCTPAGE.whatsapp),
                        maniken: t(PRODUCTPAGE.maniken),
                        height: t(PRODUCTPAGE.height),
                        weight: t(PRODUCTPAGE.weight),
                        mansize: t(PRODUCTPAGE.mansize),
                        outOfStock: t(PRODUCTPAGE.outofstock),
                    }}
                />
            </main>
        </MaxWidthWrapper>
    );
}
