declare const strapi: any;

const COLOR_UID = "api::color.color";
const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"];

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildColorData(source: any) {
    return {
        name: source.name ?? "",
        hexCode: source.hexCode ?? "#000000",
    };
}

async function syncColorLocales(documentId: string) {
    console.log(`[Ugarit] ── Color sync start: ${documentId}`);

    const source = await strapi.documents(COLOR_UID as any).findOne({
        documentId,
        locale: SOURCE_LOCALE,
    });

    if (!source) {
        console.warn(`[Ugarit] No color source found for ${documentId}`);
        return;
    }

    const data = buildColorData(source);

    for (const locale of TARGET_LOCALES) {
        let success = false;

        // Try update first (locale already exists)
        for (let attempt = 1; attempt <= 3 && !success; attempt++) {
            try {
                await strapi.documents(COLOR_UID as any).update({
                    documentId,
                    locale,
                    data: data as any,
                });
                console.log(`[Ugarit] ✅ Color updated for '${locale}'`);
                success = true;
            } catch (updateErr: any) {
                const msg: string = updateErr?.message ?? "";
                const isNotFound =
                    msg.includes("not found") ||
                    msg.includes("does not exist") ||
                    updateErr?.details?.code === "DOCUMENT_NOT_FOUND";

                if (isNotFound) {
                    try {
                        await strapi
                            .plugin("i18n")
                            .service("localizations")
                            .createLocalization(
                                { documentId, locale: SOURCE_LOCALE },
                                { data: { ...data, locale }, populate: [] }
                            );
                        console.log(`[Ugarit] ✅ Color '${locale}' locale created via i18n service`);
                        success = true;
                    } catch (i18nErr: any) {
                        console.error(`[Ugarit] ❌ Color '${locale}' creation failed: ${i18nErr.message}`);
                    }
                } else {
                    if (attempt < 3) await wait(500 * attempt);
                    console.warn(`[Ugarit] update() attempt ${attempt} failed for color '${locale}': ${updateErr.message}`);
                }
            }
        }
    }

    console.log(`[Ugarit] ── Color sync end: ${documentId}`);
}

export default {
    async afterCreate(event: any) {
        const { result } = event;
        console.log(`[Ugarit] Color afterCreate — locale: ${result?.locale}, documentId: ${result?.documentId}`);

        if (result?.documentId) {
            setTimeout(() => syncColorLocales(result.documentId), 1000);
        }
    },

    async afterUpdate(event: any) {
        const { result } = event;
        console.log(`[Ugarit] Color afterUpdate — locale: ${result?.locale}, documentId: ${result?.documentId}`);

        if (result?.locale === SOURCE_LOCALE && result?.documentId) {
            setTimeout(() => syncColorLocales(result.documentId), 1000);
        }
    },
};
