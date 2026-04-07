import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PRODUCTPAGE } from "./constants";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductInteractive from "./ProductInteractive";
import { getStrapiMedia, strapiPublicFetch } from "@/src/lib/strapi";

function extractImageUrl(image: any) {
    if (!image) return "/mock-images/mockshirt.png";
    if (Array.isArray(image)) return extractImageUrl(image[0]);
    if (typeof image === "string") return getStrapiMedia(image);
    if (image.url) return getStrapiMedia(image.url);
    if (image.data) return extractImageUrl(image.data);
    if (image.attributes?.url) return getStrapiMedia(image.attributes.url);
    return "/mock-images/mockshirt.png";
}

function normalizeProduct(product: any) {
    return product?.attributes ?? product;
}

function buildProductPopulate() {
    return {
        image: { fields: ["url"] },
        localizations: { fields: ["slug", "locale"] },
        colorVariants: {
            populate: { color: true, image: { fields: ["url"] } },
        },
    };
}

async function getProduct(slug: string, locale: string) {
    try {
        const json = await strapiPublicFetch<{ data?: any[] }>(
            "/api/products",
            {
                query: {
                    locale,
                    filters: { slug: { $eq: slug } },
                    fields: [
                        "documentId",
                        "title",
                        "slug",
                        "price",
                        "description",
                        "sizeXS",
                        "sizeS",
                        "sizeM",
                        "sizeL",
                        "sizeXL",
                        "sizeXXL",
                        "modelHeight",
                        "modelWeight",
                        "modelSize",
                        "locale",
                    ],
                    populate: buildProductPopulate(),
                },
                revalidate: 300,
                tags: [`product:${locale}:${slug}`],
            }
        );
        return json.data?.[0] || null;
    } catch (error) {
        return null;
    }
}

export default async function ProductDetail({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale, slug } = await params;
    const t = await getTranslations();

    let strapiProduct = await getProduct(slug, locale);
    if (!strapiProduct) notFound();

    strapiProduct = normalizeProduct(strapiProduct);

    const mainImageUrl = extractImageUrl(strapiProduct.image);
    const allImages = Array.isArray(strapiProduct.image)
        ? strapiProduct.image
        : strapiProduct.image
        ? [strapiProduct.image]
        : [];
    const fallbackImages = allImages.map((img: any) => extractImageUrl(img));

    const formattedColorVariants = (strapiProduct.colorVariants || [])
        .map((cv: any) => ({
            id: cv.id,
            color: cv.color?.attributes || cv.color,
            imageUrl: extractImageUrl(cv.image),
        }))
        .filter((cv: any) => cv.color);

    const sizeOptions = [
        { label: "XS", isAvailable: strapiProduct.sizeXS },
        { label: "S", isAvailable: strapiProduct.sizeS },
        { label: "M", isAvailable: strapiProduct.sizeM },
        { label: "L", isAvailable: strapiProduct.sizeL },
        { label: "XL", isAvailable: strapiProduct.sizeXL },
        { label: "XXL", isAvailable: strapiProduct.sizeXXL },
    ];

    return (
        <MaxWidthWrapper>
            <main className="py-10 px-6">
                <ProductInteractive
                    documentId={strapiProduct.documentId}
                    price={strapiProduct.price}
                    title={strapiProduct.title}
                    slug={strapiProduct.slug}
                    description={strapiProduct.description}
                    initialImage={mainImageUrl}
                    fallbackImages={fallbackImages}
                    colorVariants={formattedColorVariants}
                    sizeOptions={sizeOptions}
                    modelInfo={{
                        modelHeight: strapiProduct.modelHeight,
                        modelWeight: strapiProduct.modelWeight,
                        modelSize: strapiProduct.modelSize,
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
                    }}
                />
            </main>
        </MaxWidthWrapper>
    );
}
