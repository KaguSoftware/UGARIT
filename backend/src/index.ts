import type { Core } from "@strapi/strapi";

// ─── Shared config ───────────────────────────────────────────────────────────

const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"];

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Product sync ────────────────────────────────────────────────────────────

const PRODUCT_UID = "api::product.product";

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
    };
}

async function syncProductLocales(
    strapi: Core.Strapi,
    documentId: string,
    shouldPublish: boolean
) {
    console.log(
        `[Ugarit] Syncing product ${documentId} (publish: ${shouldPublish})`
    );

    const source = await strapi.documents(PRODUCT_UID as any).findOne({
        documentId,
        locale: SOURCE_LOCALE,
        status: shouldPublish ? "published" : "draft",
        populate: ["image", "category"],
    });

    if (!source) {
        console.warn(`[Ugarit] No product source found for ${documentId}`);
        return;
    }

    // Step 1: write all drafts sequentially
    for (const locale of TARGET_LOCALES) {
        const data = buildProductData(source, locale);
        try {
            await strapi.documents(PRODUCT_UID as any).update({
                documentId,
                locale,
                data: data as any,
                status: "draft",
            });
            console.log(`[Ugarit] ✅ Product draft written for '${locale}'`);
        } catch (err: any) {
            console.warn(
                `[Ugarit] update() failed for product '${locale}', trying direct insert: ${err.message}`
            );
            try {
                await strapi.db.query(PRODUCT_UID as any).create({
                    data: {
                        ...data,
                        locale,
                        document_id: documentId,
                        published_at: null,
                    },
                });
                console.log(
                    `[Ugarit] ✅ Product locale '${locale}' direct-inserted`
                );
            } catch (dbErr: any) {
                console.error(
                    `[Ugarit] ❌ Product locale '${locale}' failed: ${dbErr.message}`
                );
            }
        }
    }

    // Step 2: publish each locale explicitly — do NOT use wildcard,
    // as it may miss freshly created locale rows
    if (shouldPublish) {
        await wait(500);
        for (const locale of TARGET_LOCALES) {
            try {
                await strapi.documents(PRODUCT_UID as any).publish({
                    documentId,
                    locale,
                });
                console.log(`[Ugarit] ✅ Product locale '${locale}' published`);
            } catch (err: any) {
                console.error(
                    `[Ugarit] ❌ Product publish '${locale}' failed: ${err.message}`
                );
            }
        }
    }
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
        `[Ugarit] Syncing category ${documentId} (publish: ${shouldPublish})`
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

    // Step 1: write all drafts sequentially
    for (const locale of TARGET_LOCALES) {
        const data = buildCategoryData(source);
        try {
            await strapi.documents(CATEGORY_UID as any).update({
                documentId,
                locale,
                data: data as any,
                status: "draft",
            });
            console.log(`[Ugarit] ✅ Category draft written for '${locale}'`);
        } catch (err: any) {
            console.warn(
                `[Ugarit] update() failed for category '${locale}', trying direct insert: ${err.message}`
            );
            try {
                await strapi.db.query(CATEGORY_UID as any).create({
                    data: {
                        ...data,
                        locale,
                        document_id: documentId,
                        published_at: null,
                    },
                });
                console.log(
                    `[Ugarit] ✅ Category locale '${locale}' direct-inserted`
                );
            } catch (dbErr: any) {
                console.error(
                    `[Ugarit] ❌ Category locale '${locale}' failed: ${dbErr.message}`
                );
            }
        }
    }

    // Step 2: publish each locale explicitly
    if (shouldPublish) {
        await wait(500);
        for (const locale of TARGET_LOCALES) {
            try {
                await strapi.documents(CATEGORY_UID as any).publish({
                    documentId,
                    locale,
                });
                console.log(
                    `[Ugarit] ✅ Category locale '${locale}' published`
                );
            } catch (err: any) {
                console.error(
                    `[Ugarit] ❌ Category publish '${locale}' failed: ${err.message}`
                );
            }
        }
    }
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

            // "create" and "update" always carry locale in params
            const isSaveFromSource =
                (action === "create" || action === "update") &&
                locale === SOURCE_LOCALE;

            // "publish" from the admin panel may NOT carry locale at all,
            // or may carry it. Accept both cases.
            const isPublishFromSource =
                action === "publish" &&
                (locale === SOURCE_LOCALE ||
                    locale === undefined ||
                    locale === null);

            if (!isSaveFromSource && !isPublishFromSource) return result;

            // For publish with no locale, verify the source locale is actually
            // the one being published by checking the result
            if (isPublishFromSource && locale !== SOURCE_LOCALE) {
                // Check if the published version is the tr locale
                const publishedLocale =
                    result?.locale ?? result?.versions?.[0]?.locale;
                if (publishedLocale && publishedLocale !== SOURCE_LOCALE) {
                    return result;
                }
            }

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
