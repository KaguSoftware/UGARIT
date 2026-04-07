import type { Core } from "@strapi/strapi";

const PRODUCT_UID = "api::product.product";
const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"];

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

async function syncProductLocales(strapi: Core.Strapi, documentId: string) {
    console.log(`[Ugarit] Syncing locales for product: ${documentId}`);

    // Try published version first — that's what we want to mirror
    const sourcePublished = await strapi.documents(PRODUCT_UID as any).findOne({
        documentId,
        locale: SOURCE_LOCALE,
        status: "published",
        populate: ["image", "category"],
    });

    // Fall back to draft if not published yet
    const sourceDraft = !sourcePublished
        ? await strapi.documents(PRODUCT_UID as any).findOne({
              documentId,
              locale: SOURCE_LOCALE,
              status: "draft",
              populate: ["image", "category"],
          })
        : null;

    const source = sourcePublished ?? sourceDraft;
    const shouldPublish = !!sourcePublished;

    if (!source) {
        console.warn(`[Ugarit] No source found for ${documentId}`);
        return;
    }

    for (const locale of TARGET_LOCALES) {
        const data = buildLocalizedData(source, locale);
        try {
            // Step 1: Write the draft (creates locale row if it doesn't exist)
            await strapi.documents(PRODUCT_UID as any).update({
                documentId,
                locale,
                data: data as any,
                status: "draft",
            });

            // Step 2: Explicitly publish if source is published.
            // In Strapi v5, status:"published" on update() does NOT publish —
            // .publish() must be called separately.
            if (shouldPublish) {
                await strapi.documents(PRODUCT_UID as any).publish({
                    documentId,
                    locale,
                });
            }

            console.log(
                `[Ugarit] ✅ Synced locale '${locale}' for ${documentId} (published: ${shouldPublish})`
            );
        } catch (err: any) {
            // Fallback: direct DB insert if locale row doesn't exist yet
            console.warn(
                `[Ugarit] update() failed for '${locale}', trying direct insert: ${err.message}`
            );
            try {
                await strapi.db.query(PRODUCT_UID as any).create({
                    data: {
                        ...data,
                        locale,
                        document_id: documentId,
                        published_at: shouldPublish ? new Date() : null,
                    },
                });
                console.log(
                    `[Ugarit] ✅ Direct-inserted locale '${locale}' for ${documentId}`
                );
            } catch (dbErr: any) {
                console.error(
                    `[Ugarit] ❌ Failed to sync locale '${locale}': ${dbErr.message}`
                );
            }
        }
    }
}

export default {
    register({ strapi }: { strapi: Core.Strapi }) {
        // Document Service Middleware fires exactly once per document action.
        // Lifecycle hooks are NOT used because in Strapi v5 they fire multiple
        // times per action (once per DB row: draft + published).
        strapi.documents.use(async (context: any, next: any) => {
            const result = await next();

            const isProduct = context.uid === PRODUCT_UID;
            const isWriteAction =
                context.action === "create" || context.action === "update";
            const isSourceLocale = context.params?.locale === SOURCE_LOCALE;

            if (isProduct && isWriteAction && isSourceLocale) {
                const documentId = result?.documentId;
                if (documentId) {
                    // Fire async — don't block the save/publish response
                    setImmediate(() => {
                        syncProductLocales(strapi, documentId).catch((err) => {
                            console.error(
                                "[Ugarit] Locale sync error:",
                                err.message
                            );
                        });
                    });
                }
            }

            return result;
        });
    },

    bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
