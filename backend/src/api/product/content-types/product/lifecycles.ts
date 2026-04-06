import type { Core } from "@strapi/strapi";

const UID = "api::product.product";
const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"];
const SYNC_DELAY_MS = 1500;

/**
 * Builds the data object for the target locale based on the source product.
 * Maps relation fields (like images) to IDs as required by the Document Service.
 */
function buildLocalizedData(source: any, locale: string) {
    return {
        title: source.title ?? "",
        description: source.description ?? "",
        // Unique slug for each locale
        slug: source.slug
            ? `${source.slug}-${locale}`
            : `${locale}-${Date.now()}`,
        price: source.price ?? null,
        isFeatured: source.isFeatured ?? false,
        modelHeight: source.modelHeight ?? "",
        modelWeight: source.modelWeight ?? "",
        modelSize: source.modelSize ?? "",
        sizeXS: source.sizeXS ?? false,
        sizeS: source.sizeS ?? false,
        sizeM: source.sizeM ?? false,
        sizeL: source.sizeL ?? false,
        sizeXL: source.sizeXL ?? false,
        sizeXXL: source.sizeXXL ?? false,
        // Map image objects to an array of their IDs
        image: source.image?.map((img: any) => img.id) ?? [],
    };
}

/**
 * Main synchronization logic using Strapi's internal Document Service.
 */
async function syncProductLocalesFromSource(
    strapi: Core.Strapi,
    documentId: string
) {
    try {
        // 1. Fetch the source document (Turkish)
        const sourceData = await strapi.documents(UID as any).findOne({
            documentId,
            locale: SOURCE_LOCALE,
            populate: ["image"],
        });

        if (!sourceData) {
            console.warn(
                `[Sync] Source document ${documentId} not found for locale ${SOURCE_LOCALE}`
            );
            return;
        }

        // 2. Iterate through target locales and update/create them
        for (const locale of TARGET_LOCALES) {
            const data = buildLocalizedData(sourceData, locale);

            try {
                await strapi.documents(UID as any).update({
                    documentId,
                    locale,
                    // Use 'as any' to bypass strict TS index signature checks in Strapi 5
                    data: data as any,
                    // Sync the publishing status (if source is published, target becomes published)
                    status: sourceData.publishedAt ? "published" : "draft",
                });
                console.log(
                    `[Sync] Successfully synced ${locale} for document ${documentId}`
                );
            } catch (error) {
                console.error(
                    `[Sync] Failed to sync ${locale} for ${documentId}:`,
                    error
                );
            }
        }
    } catch (error) {
        console.error(
            `[Sync] Error fetching source document ${documentId}:`,
            error
        );
    }
}

export default {
    async afterCreate(event: any) {
        const { result } = event;
        const strapiInstance = (global as any).strapi;

        if (result?.locale === SOURCE_LOCALE && result?.documentId) {
            // Small delay to ensure the database transaction is fully committed
            setTimeout(() => {
                syncProductLocalesFromSource(strapiInstance, result.documentId);
            }, SYNC_DELAY_MS);
        }
    },

    async afterUpdate(event: any) {
        const { result } = event;
        const strapiInstance = (global as any).strapi;

        if (result?.locale === SOURCE_LOCALE && result?.documentId) {
            setTimeout(() => {
                syncProductLocalesFromSource(strapiInstance, result.documentId);
            }, SYNC_DELAY_MS);
        }
    },
};
