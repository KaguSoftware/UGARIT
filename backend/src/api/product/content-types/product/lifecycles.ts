import type { Core } from "@strapi/strapi";

console.log("--------------------------------------------------");
console.log("🚀 UGARIT: Product Lifecycle Module Loaded!");
console.log("--------------------------------------------------");

const UID = "api::product.product";
const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"];
const SYNC_DELAY_MS = 2000;

// Simple lock to prevent infinite loops during updates
let isSyncing = false;

function buildLocalizedData(source: any, locale: string) {
    return {
        title: source.title ?? "",
        description: source.description ?? "",
        slug: source.slug
            ? `${source.slug}-${locale}`
            : `${locale}-${Date.now()}`,
        price: source.price ?? null,
        isFeatured: source.isFeatured ?? false,
        spOne: source.spOne ?? false,
        spTwo: source.spTwo ?? false,
        spThree: source.spThree ?? false,
        modelHeight: source.modelHeight ?? "",
        modelWeight: source.modelWeight ?? "",
        modelSize: source.modelSize ?? "",
        sizeXS: source.sizeXS ?? false,
        sizeS: source.sizeS ?? false,
        sizeM: source.sizeM ?? false,
        sizeL: source.sizeL ?? false,
        sizeXL: source.sizeXL ?? false,
        sizeXXL: source.sizeXXL ?? false,
        image: source.image?.map((img: any) => img.id) ?? [],
        category: source.category?.documentId ?? null,
    };
}

async function syncProductLocalesFromSource(
    strapi: Core.Strapi,
    documentId: string
) {
    if (isSyncing) return;
    isSyncing = true;

    console.log(`[Ugarit] Starting sync for Product: ${documentId}`);

    try {
        const sourceData = await strapi.documents(UID as any).findOne({
            documentId,
            locale: SOURCE_LOCALE,
            populate: ["image", "category"],
        });

        if (!sourceData) {
            console.log(
                `[Ugarit] Source (tr) not found yet for ${documentId}.`
            );
            return;
        }

        for (const locale of TARGET_LOCALES) {
            const data = buildLocalizedData(sourceData, locale);
            try {
                await strapi.documents(UID as any).update({
                    documentId,
                    locale,
                    data: data as any,
                    status: sourceData.publishedAt ? "published" : "draft",
                });
                console.log(`[Ugarit] ✅ Synced locale: ${locale}`);
            } catch (err) {
                console.error(
                    `[Ugarit] ❌ Error syncing ${locale}:`,
                    err.message
                );
            }
        }
    } catch (err) {
        console.error(`[Ugarit] 💥 Sync failed:`, err.message);
    } finally {
        isSyncing = false;
    }
}

export default {
    async afterCreate(event: any) {
        const { result, strapi } = event;
        console.log(
            `[Ugarit] afterCreate triggered for locale: ${result?.locale}`
        );

        if (result?.locale === SOURCE_LOCALE && result?.documentId) {
            setTimeout(
                () => syncProductLocalesFromSource(strapi, result.documentId),
                SYNC_DELAY_MS
            );
        }
    },

    async afterUpdate(event: any) {
        const { result, strapi } = event;
        console.log(
            `[Ugarit] afterUpdate triggered for locale: ${result?.locale}`
        );

        if (
            !isSyncing &&
            result?.locale === SOURCE_LOCALE &&
            result?.documentId
        ) {
            setTimeout(
                () => syncProductLocalesFromSource(strapi, result.documentId),
                SYNC_DELAY_MS
            );
        }
    },
};
