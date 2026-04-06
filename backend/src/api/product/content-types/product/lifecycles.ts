import type { Core } from "@strapi/strapi";

const UID = "api::product.product";
const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"];
const SYNC_DELAY_MS = 1500;

/**
 * Maps the Turkish source data to the target locale.
 * This includes all fields from your schema.json.
 */
function buildLocalizedData(source: any, locale: string) {
    return {
        // Basic Info
        title: source.title ?? "",
        description: source.description ?? "",
        // UID fields must be unique; appending locale ensures no collisions
        slug: source.slug
            ? `${source.slug}-${locale}`
            : `${locale}-${Date.now()}`,
        price: source.price ?? null,

        // Feature & Special Flags
        isFeatured: source.isFeatured ?? false,
        spOne: source.spOne ?? false,
        spTwo: source.spTwo ?? false,
        spThree: source.spThree ?? false,

        // Model Details
        modelHeight: source.modelHeight ?? "",
        modelWeight: source.modelWeight ?? "",
        modelSize: source.modelSize ?? "",

        // Sizes
        sizeXS: source.sizeXS ?? false,
        sizeS: source.sizeS ?? false,
        sizeM: source.sizeM ?? false,
        sizeL: source.sizeL ?? false,
        sizeXL: source.sizeXL ?? false,
        sizeXXL: source.sizeXXL ?? false,

        // Media (Multiple) - Maps objects to an array of IDs
        image: source.image?.map((img: any) => img.id) ?? [],

        // Relations - Linking the product to the same category
        category: source.category?.documentId ?? null,
    };
}

/**
 * Logic to sync locales using Strapi's internal Document Service.
 */
async function syncProductLocalesFromSource(
    strapi: Core.Strapi,
    documentId: string
) {
    try {
        // 1. Fetch source with necessary relations populated
        const sourceData = await strapi.documents(UID as any).findOne({
            documentId,
            locale: SOURCE_LOCALE,
            populate: ["image", "category"],
        });

        if (!sourceData) return;

        // 2. Sync to each target locale
        for (const locale of TARGET_LOCALES) {
            const data = buildLocalizedData(sourceData, locale);

            try {
                await strapi.documents(UID as any).update({
                    documentId,
                    locale,
                    data: data as any,
                    // Match the publishing status of the Turkish version
                    status: sourceData.publishedAt ? "published" : "draft",
                });
                console.log(
                    `[Ugarit Sync] Success: ${locale} for ${documentId}`
                );
            } catch (error) {
                console.error(`[Ugarit Sync] Failed: ${locale} |`, error);
            }
        }
    } catch (error) {
        console.error(`[Ugarit Sync] Error fetching source:`, error);
    }
}

export default {
    async afterCreate(event: any) {
        const { result, strapi } = event;
        // Only trigger if we are creating the TR version
        if (result?.locale === SOURCE_LOCALE && result?.documentId) {
            setTimeout(
                () => syncProductLocalesFromSource(strapi, result.documentId),
                SYNC_DELAY_MS
            );
        }
    },

    async afterUpdate(event: any) {
        const { result, strapi } = event;
        // Update other locales whenever TR version is saved
        if (result?.locale === SOURCE_LOCALE && result?.documentId) {
            setTimeout(
                () => syncProductLocalesFromSource(strapi, result.documentId),
                SYNC_DELAY_MS
            );
        }
    },
};
