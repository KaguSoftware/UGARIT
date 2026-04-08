import type { Core } from "@strapi/strapi";

// ─── Shared config ───────────────────────────────────────────────────────────

const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"];

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function publishWithRetry(
    strapi: Core.Strapi,
    uid: string,
    documentId: string,
    locale: string,
    retries = 5,
    delayMs = 2000
) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Confirm the draft exists before attempting to publish
            const draft = await strapi.documents(uid as any).findOne({
                documentId,
                locale,
                status: "draft",
            });
            console.log(
                `[Ugarit] Draft check for '${locale}' (attempt ${attempt}):`,
                draft ? `found (id: ${draft.id})` : "NOT FOUND"
            );

            if (!draft) {
                await wait(delayMs);
                continue;
            }

            const publishResult = await strapi.documents(uid as any).publish({
                documentId,
                locale,
            });
            console.log(
                `[Ugarit] ✅ Published '${locale}':`,
                JSON.stringify(
                    publishResult?.entries?.map((entry: any) => ({
                        locale: entry.locale,
                        publishedAt: entry.publishedAt,
                    })) ?? []
                )
            );
            return;
        } catch (err: any) {
            console.error(
                `[Ugarit] ❌ Publish attempt ${attempt} for '${locale}' failed: ${err.message}`
            );
            if (attempt < retries) await wait(delayMs * attempt);
        }
    }
    console.error(`[Ugarit] ❌ All publish attempts exhausted for '${locale}'`);
}

// ─── Product sync ────────────────────────────────────────────────────────────

const PRODUCT_UID = "api::product.product";

const PUBLISH_DELAY_MS = 4000; // extra wait on slow hosts before reading published source

function buildProductData(source: any, locale: string) {
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
        colorVariants: source.colorVariants?.map((cv: any) => ({
            color: cv.color?.documentId ?? cv.color?.id ?? null,
            image: cv.image?.id ?? null,
        })) ?? [],
    };
}

async function syncProductLocales(
    strapi: Core.Strapi,
    documentId: string,
    shouldPublish: boolean
) {
    console.log(
        `[Ugarit] ── Product sync start: ${documentId} (publish: ${shouldPublish})`
    );

    // On slow hosts the published record may not be readable yet — wait before querying
    if (shouldPublish) await wait(PUBLISH_DELAY_MS);

    const source = await strapi.documents(PRODUCT_UID as any).findOne({
        documentId,
        locale: SOURCE_LOCALE,
        status: shouldPublish ? "published" : "draft",
        populate: {
            image: true,
            category: true,
            colorVariants: {
                populate: { color: true, image: true },
            },
        } as any,
    });

    if (!source) {
        console.warn(`[Ugarit] No product source found for ${documentId}`);
        return;
    }

    for (const locale of TARGET_LOCALES) {
        const data = buildProductData(source, locale);
        try {
            const updated = await strapi.documents(PRODUCT_UID as any).update({
                documentId,
                locale,
                data: data as any,
                status: "draft",
            });
            console.log(
                `[Ugarit] ✅ Product draft written for '${locale}' (id: ${updated?.id})`
            );
        } catch (err: any) {
            console.warn(
                `[Ugarit] update() failed for product '${locale}': ${err.message}`
            );
            try {
                await strapi
                    .plugin("i18n")
                    .service("localizations")
                    .createLocalization(
                        { documentId, locale: SOURCE_LOCALE },
                        { data: { ...data, locale }, populate: [] }
                    );
                console.log(`[Ugarit] ✅ Product '${locale}' locale created via i18n service`);
            } catch (i18nErr: any) {
                console.error(
                    `[Ugarit] ❌ Product '${locale}' locale creation failed: ${i18nErr.message}`
                );
            }
        }
    }

    if (shouldPublish) {
        console.log(
            `[Ugarit] Starting publish phase for product ${documentId}`
        );
        for (const locale of TARGET_LOCALES) {
            await publishWithRetry(strapi, PRODUCT_UID, documentId, locale);
        }
    }

    console.log(`[Ugarit] ── Product sync end: ${documentId}`);
}

// ─── Category sync ───────────────────────────────────────────────────────────

const CATEGORY_UID = "api::category.category";

function buildCategoryData(source: any) {
    return {
        name: source.name ?? "",
        slug: source.slug ?? "",
        image: source.image?.id ? [source.image.id] : [],
        showInNavbar: source.showInNavbar ?? true,
        isMegaMenu: source.isMegaMenu ?? false,
        megaMenuContent: source.megaMenuContent ?? null,
    };
}

async function syncCategoryLocales(
    strapi: Core.Strapi,
    documentId: string,
    shouldPublish: boolean
) {
    console.log(
        `[Ugarit] ── Category sync start: ${documentId} (publish: ${shouldPublish})`
    );

    const source = await strapi.documents(CATEGORY_UID as any).findOne({
        documentId,
        locale: SOURCE_LOCALE,
        status: shouldPublish ? "published" : "draft",
        populate: ["image"],
    });

    if (!source) {
        console.warn(`[Ugarit] No category source found for ${documentId}`);
        return;
    }

    for (const locale of TARGET_LOCALES) {
        const data = buildCategoryData(source);
        try {
            const updated = await strapi.documents(CATEGORY_UID as any).update({
                documentId,
                locale,
                data: data as any,
                status: "draft",
            });
            console.log(
                `[Ugarit] ✅ Category draft written for '${locale}' (id: ${updated?.id})`
            );
        } catch (err: any) {
            console.warn(
                `[Ugarit] update() failed for category '${locale}': ${err.message}`
            );
            try {
                await strapi
                    .plugin("i18n")
                    .service("localizations")
                    .createLocalization(
                        { documentId, locale: SOURCE_LOCALE },
                        { data: { ...data, locale }, populate: [] }
                    );
                console.log(`[Ugarit] ✅ Category '${locale}' locale created via i18n service`);
            } catch (i18nErr: any) {
                console.error(
                    `[Ugarit] ❌ Category '${locale}' locale creation failed: ${i18nErr.message}`
                );
            }
        }
    }

    if (shouldPublish) {
        console.log(
            `[Ugarit] Starting publish phase for category ${documentId}`
        );
        for (const locale of TARGET_LOCALES) {
            await publishWithRetry(strapi, CATEGORY_UID, documentId, locale);
        }
    }

    console.log(`[Ugarit] ── Category sync end: ${documentId}`);
}

// ─── Registration ────────────────────────────────────────────────────────────

export default {
    register({ strapi }: { strapi: Core.Strapi }) {
        strapi.documents.use(async (context: any, next: any) => {
            const result = await next();

            const { action, uid, params } = context;
            const documentId = result?.documentId ?? params?.documentId;
            if (!documentId) return result;

            const locale = params?.locale;

            const isSaveFromSource =
                (action === "create" || action === "update") &&
                locale === SOURCE_LOCALE;

            const isPublishFromSource =
                action === "publish" &&
                (locale === SOURCE_LOCALE ||
                    locale === undefined ||
                    locale === null);

            if (!isSaveFromSource && !isPublishFromSource) return result;

            if (isPublishFromSource && locale !== SOURCE_LOCALE) {
                const publishedLocale =
                    result?.locale ?? result?.entries?.[0]?.locale;
                if (publishedLocale && publishedLocale !== SOURCE_LOCALE) {
                    return result;
                }
            }

            // Log full context so we can debug what Strapi passes
            console.log(
                `[Ugarit] Middleware hit — action: ${action}, uid: ${uid}, locale: ${locale}, documentId: ${documentId}`
            );

            const shouldPublish = isPublishFromSource;

            if (uid === PRODUCT_UID) {
                setImmediate(() => {
                    syncProductLocales(strapi, documentId, shouldPublish).catch(
                        (err) => {
                            console.error(
                                "[Ugarit] Product sync error:",
                                err.message
                            );
                        }
                    );
                });
            }

            if (uid === CATEGORY_UID) {
                setImmediate(() => {
                    syncCategoryLocales(
                        strapi,
                        documentId,
                        shouldPublish
                    ).catch((err) => {
                        console.error(
                            "[Ugarit] Category sync error:",
                            err.message
                        );
                    });
                });
            }

            return result;
        });
    },

    bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
