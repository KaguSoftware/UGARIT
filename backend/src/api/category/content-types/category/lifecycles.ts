const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"] as const;
const MAX_RETRIES = 3;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function isJsonValue(value: unknown): value is JsonValue {
    if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return true;
    }

    if (Array.isArray(value)) {
        return value.every(isJsonValue);
    }

    if (typeof value === "object") {
        return Object.values(value as Record<string, unknown>).every(
            isJsonValue
        );
    }

    return false;
}

type CategoryDoc = {
    documentId?: string;
    locale?: string;
    name?: string | null;
    slug?: string | null;
    image?: { id: number } | null;
    showInNavbar?: boolean | null;
    isMegaMenu?: boolean | null;
    megaMenuContent?: JsonValue;
    publishedAt?: string | null;
};

type CategoryUpdateParams = Parameters<
    ReturnType<typeof strapi.documents<"api::category.category">>["update"]
>[0];

type CategoryUpdateData = NonNullable<CategoryUpdateParams["data"]>;

function buildLocalizedData(source: CategoryDoc): CategoryUpdateData {
    return {
        name: source.name ?? "",
        slug: source.slug ?? "",
        image: source.image?.id ? [source.image.id] : [],
        showInNavbar: source.showInNavbar ?? true,
        isMegaMenu: source.isMegaMenu ?? false,
        megaMenuContent: isJsonValue(source.megaMenuContent)
            ? source.megaMenuContent
            : null,
    };
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function upsertLocaleVersion(
    documentId: string,
    locale: string,
    data: CategoryUpdateData
) {
    await strapi.documents("api::category.category").update({
        documentId,
        locale,
        status: "published",
        data,
    });
}

async function syncCategoryLocalesFromSource(source: CategoryDoc) {
    if (!source.documentId) return;

    for (const locale of TARGET_LOCALES) {
        const data = buildLocalizedData(source);
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
            try {
                await upsertLocaleVersion(source.documentId, locale, data);
                lastError = null;
                break;
            } catch (error) {
                lastError = error;

                if (attempt < MAX_RETRIES) {
                    await wait(500 * attempt);
                }
            }
        }

        if (lastError) {
            throw lastError;
        }
    }
}

function scheduleLocaleSync(source: CategoryDoc) {
    const snapshot: CategoryDoc = {
        documentId: source.documentId,
        locale: source.locale,
        name: source.name,
        slug: source.slug,
        image: source.image,
        showInNavbar: source.showInNavbar,
        isMegaMenu: source.isMegaMenu,
        megaMenuContent: source.megaMenuContent,
        publishedAt: source.publishedAt,
    };

    setTimeout(() => {
        void syncCategoryLocalesFromSource(snapshot).catch((error) => {
            console.error("Failed to sync category locales:", error);
        });
    }, 250);
}

export default {
    async afterCreate(event: {
        result?: {
            documentId?: string;
            locale?: string;
            name?: string | null;
            slug?: string | null;
            image?: { id: number } | null;
            showInNavbar?: boolean | null;
            isMegaMenu?: boolean | null;
            megaMenuContent?: JsonValue;
            publishedAt?: string | null;
        };
    }) {
        const category = event.result;

        if (!category?.documentId) return;
        if (category.locale !== SOURCE_LOCALE) return;

        scheduleLocaleSync(category);
    },

    async afterUpdate(event: {
        result?: {
            documentId?: string;
            locale?: string;
            name?: string | null;
            slug?: string | null;
            image?: { id: number } | null;
            showInNavbar?: boolean | null;
            isMegaMenu?: boolean | null;
            megaMenuContent?: JsonValue;
            publishedAt?: string | null;
        };
    }) {
        const category = event.result;

        if (!category?.documentId) return;
        if (category.locale !== SOURCE_LOCALE) return;

        scheduleLocaleSync(category);
    },
};
