import Image from "next/image";
import { MessageCircle, Ruler, Weight, Shirt } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PRODUCTPAGE } from "./constants";
import { getTranslations } from "next-intl/server";
import MaxWidthWrapper from "@/src/components/ui/MaxWidthWrapper";
import AddToCartSection from "./AddToCartSection";
import { getStrapiMedia, strapiPublicFetch } from "@/src/lib/strapi";

function extractImageUrl(image: any) {
    if (!image) return "/mock-images/mockshirt.png";

    if (Array.isArray(image)) {
        return extractImageUrl(image[0]);
    }

    if (typeof image === "string") {
        return getStrapiMedia(image);
    }

    if (image.url) {
        return getStrapiMedia(image.url);
    }

    if (image.data) {
        return extractImageUrl(image.data);
    }

    if (image.attributes?.url) {
        return getStrapiMedia(image.attributes.url);
    }

    return "/mock-images/mockshirt.png";
}

function normalizeProduct(product: any) {
    return product?.attributes ?? product;
}

function buildProductPopulate() {
    return {
        image: { fields: ["url"] },
        localizations: { fields: ["slug", "locale"] },
    };
}

async function getProduct(slug: string, locale: string) {
    try {
        const json = await strapiPublicFetch<{ data?: any[] }>(
            "/api/products",
            {
                query: {
                    locale,
                    filters: {
                        slug: {
                            $eq: slug,
                        },
                    },
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
        console.error("getProduct failed:", error);
        return null;
    }
}

async function findProductAcrossLocales(slug: string) {
    try {
        const json = await strapiPublicFetch<{ data?: any[] }>(
            "/api/products",
            {
                query: {
                    locale: "all",
                    filters: {
                        slug: {
                            $eq: slug,
                        },
                    },
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
                tags: [`product:any-locale:${slug}`],
            }
        );

        return json.data?.[0] || null;
    } catch (error) {
        console.error("findProductAcrossLocales failed:", error);
        return null;
    }
}

function getLocalizedSlug(
    productFromAnyLocale: any,
    targetLocale: string
): string | null {
    const directLocalizations = productFromAnyLocale?.localizations;

    if (Array.isArray(directLocalizations)) {
        const match = directLocalizations.find(
            (entry: any) => entry?.locale === targetLocale
        );
        if (match?.slug) return match.slug;
    }

    if (Array.isArray(directLocalizations?.data)) {
        const match = directLocalizations.data.find(
            (entry: any) => entry?.attributes?.locale === targetLocale
        );
        if (match?.attributes?.slug) return match.attributes.slug;
    }

    const nestedLocalizations = productFromAnyLocale?.attributes?.localizations;

    if (Array.isArray(nestedLocalizations)) {
        const match = nestedLocalizations.find(
            (entry: any) => entry?.locale === targetLocale
        );
        if (match?.slug) return match.slug;
    }

    if (Array.isArray(nestedLocalizations?.data)) {
        const match = nestedLocalizations.data.find(
            (entry: any) => entry?.attributes?.locale === targetLocale
        );
        if (match?.attributes?.slug) return match.attributes.slug;
    }

    return null;
}

export default async function ProductDetail({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale, slug } = await params;
    const t = await getTranslations();

    let strapiProduct = await getProduct(slug, locale);

    if (!strapiProduct) {
        const productFromAnyLocale = await findProductAcrossLocales(slug);
        const normalizedAnyLocaleProduct =
            normalizeProduct(productFromAnyLocale);

        if (productFromAnyLocale) {
            const localizedSlug = getLocalizedSlug(
                productFromAnyLocale,
                locale
            );

            if (localizedSlug && localizedSlug !== slug) {
                redirect(`/${locale}/products/${localizedSlug}`);
            }

            if (normalizedAnyLocaleProduct?.locale === locale) {
                strapiProduct = normalizedAnyLocaleProduct;
            }
        }
    }

    if (!strapiProduct) {
        notFound();
    }
    strapiProduct = normalizeProduct(strapiProduct);

    const mainImageUrl = extractImageUrl(strapiProduct.image);

    const allImages = Array.isArray(strapiProduct.image)
        ? strapiProduct.image
        : strapiProduct.image
        ? [strapiProduct.image]
        : [];

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
                <div className="md:grid md:grid-cols-2 grid-cols-1">
                    <div className="justify-items-center">
                        <Image
                            className="object-cover w-auto md:h-screen rounded-2xl"
                            alt={strapiProduct.title || "Product Image"}
                            src={mainImageUrl}
                            width={1000}
                            height={750}
                            unoptimized
                        />
                        <div className="justify-items-center">
                            <p className="font-bold text-sm mt-6">
                                {t(PRODUCTPAGE.colors)}
                            </p>
                            <div className="flex mt-2 gap-4 flex-wrap justify-center">
                                {allImages.map((img: any, index: number) => (
                                    <Image
                                        key={index}
                                        alt="gallery thumbnail"
                                        src={extractImageUrl(img)}
                                        width={75}
                                        height={75}
                                        unoptimized
                                        className="object-cover rounded-xl w-75px h-75px"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="px-6">
                        <h1 className="text-3xl tracking-tighter font-bold md:mt-0 mt-4 max-w-200">
                            {strapiProduct.title}
                        </h1>
                        <div className="flex items-center font-bold mt-2 gap-4">
                            <p className="text-black text-4xl">
                                ₺{strapiProduct.price}
                            </p>
                        </div>
                        {strapiProduct.description && (
                            <>
                                <h2 className="font-semibold text-xl mt-4">
                                    {t(PRODUCTPAGE.desc)}
                                </h2>
                                <p className="text-gray-500 tracking-tight text-xl mt-2 max-w-200">
                                    {strapiProduct.description}
                                </p>
                            </>
                        )}
                        <AddToCartSection
                            documentId={strapiProduct.documentId}
                            price={strapiProduct.price}
                            title={strapiProduct.title}
                            slug={strapiProduct.slug}
                            imageUrl={mainImageUrl}
                            sizeOptions={sizeOptions}
                            translations={{
                                sizetext: t(PRODUCTPAGE.sizetext),
                                addtocart: t(PRODUCTPAGE.addtocart),
                                linktext: t(PRODUCTPAGE.linktext),
                                whatsapp: t(PRODUCTPAGE.whatsapp),
                            }}
                        />
                        {(strapiProduct.modelHeight ||
                            strapiProduct.modelWeight ||
                            strapiProduct.modelSize) && (
                            <div className="text-lg text-center md:text-left mt-4">
                                <h4 className="font-bold">
                                    {t(PRODUCTPAGE.maniken)}:
                                </h4>
                                {strapiProduct.modelHeight && (
                                    <p className="flex gap-2">
                                        <Ruler className="hover:fill-gray-400" />
                                        {t(PRODUCTPAGE.height)}:
                                        {strapiProduct.modelHeight}
                                    </p>
                                )}
                                {strapiProduct.modelWeight && (
                                    <p className="flex gap-2">
                                        <Weight className="hover:fill-gray-400" />
                                        {t(PRODUCTPAGE.weight)}:
                                        {strapiProduct.modelWeight}
                                    </p>
                                )}
                                {strapiProduct.modelSize && (
                                    <p className="flex gap-2">
                                        <Shirt className="hover:fill-gray-400" />
                                        {t(PRODUCTPAGE.mansize)}:
                                        {strapiProduct.modelSize}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </MaxWidthWrapper>
    );
}
