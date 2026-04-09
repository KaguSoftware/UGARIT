import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { PRODUCTPAGE } from "./constants";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import ProductInteractive from "./ProductInteractive";
import { getStrapiMedia, strapiPublicFetch } from "@/src/lib/strapi";
import { getLikedProductIds } from "@/src/lib/user-db";

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
        colorVariants: {
            populate: {
                color: { fields: ["name", "hexCode"] },
                image: { fields: ["url"] },
            },
        },
    };
}

async function getProduct(slug: string, locale: string) {
    try {
        const json = await strapiPublicFetch<{ data?: any[] }>(
            "/api/products",
            {
                query: {
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

const LOCALES = ["tr", "en", "ar"];

export async function generateStaticParams() {
    const results: { locale: string; slug: string }[] = [];

    try {
        const json = await strapiPublicFetch<{ data: any[] }>("/api/products", {
            query: {
                fields: ["slug"],
                pagination: { pageSize: 100 },
            },
        });
        for (const product of json.data ?? []) {
            if (product.slug) {
                for (const locale of LOCALES) {
                    results.push({ locale, slug: product.slug });
                }
            }
        }
    } catch {
        // if Strapi is down at build time, skip static generation
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

    let strapiProduct = await getProduct(slug, locale);
    if (!strapiProduct) notFound();

    strapiProduct = normalizeProduct(strapiProduct);

    const cookieStore = await cookies();
    const jwt = cookieStore.get("jwt")?.value ?? null;
    const likedIds = jwt ? await getLikedProductIds(jwt) : [];
    const isLiked = likedIds.includes(strapiProduct.documentId);

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
                    isLiked={isLiked}
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
