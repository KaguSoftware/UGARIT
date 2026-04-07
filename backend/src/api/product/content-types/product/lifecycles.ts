// Locale sync logic has been moved to src/index.ts — see that file.
// import type { Core } from "@strapi/strapi";

import { Core } from "@strapi/strapi";

console.log("--------------------------------------------------");
console.log("🚀 UGARIT: Product Lifecycle Module Loaded!");
console.log("--------------------------------------------------");

const UID = "api::product.product";
const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"];
const SYNC_DELAY_MS = 2000;
const MAX_RETRIES = 3;

// Simple lock to prevent infinite loops during updates
let isSyncing = false;

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function upsertLocale(
    strapi: Core.Strapi,
    documentId: string,
    locale: string,
    data: any,
    status: "published" | "draft"
) {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Try update first (locale already exists)
            await strapi.documents(UID as any).update({
                documentId,
                locale,
                data,
                status,
            });
            return; // success
        } catch (updateErr: any) {
            // If the locale doesn't exist yet, Strapi throws a "document not found" error.
            // In that case, create the locale version instead.
            const msg: string = updateErr?.message ?? "";
            const isNotFound =
                msg.includes("not found") ||
                msg.includes("does not exist") ||
                updateErr?.details?.code === "DOCUMENT_NOT_FOUND";

            if (isNotFound) {
                try {
                    await strapi.documents(UID as any).create({
                        data: { ...data, locale },
                        status,
                    });
                    // After creating with a new documentId we need to re-link —
                    // Strapi i18n requires using the `locale` param on the same
                    // documentId. Use the internal entity service as a fallback.
                    await strapi
                        .plugin("i18n")
                        .service("localizations")
                        .createLocalization(
                            { documentId, locale: SOURCE_LOCALE },
                            { data: { ...data, locale }, populate: [] }
                        );
                    return; // success via i18n service
                } catch (i18nErr: any) {
                    lastError = i18nErr;
                }
            } else {
                lastError = updateErr;
            }
        }

        if (attempt < MAX_RETRIES) {
            await wait(500 * attempt);
        }
    }

    throw lastError;
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

        const status = sourceData.publishedAt ? "published" : "draft";

        for (const locale of TARGET_LOCALES) {
            const data = buildLocalizedData(sourceData, locale);
            try {
                await upsertLocale(strapi, documentId, locale, data, status);
                console.log(`[Ugarit] ✅ Synced locale: ${locale}`);
            } catch (err: any) {
                console.error(
                    `[Ugarit] ❌ Error syncing ${locale}:`,
                    err.message
                );
            }
        }
    } catch (err: any) {
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
