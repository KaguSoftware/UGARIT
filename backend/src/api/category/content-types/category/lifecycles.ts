const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"] as const;
const API_PATH = "/api/categories";
const MAX_RETRIES = 3;

type CategoryDoc = {
    documentId?: string;
    locale?: string;
    name?: string | null;
    slug?: string | null;
    image?: { id: number } | null;
    showInNavbar?: boolean | null;
    isMegaMenu?: boolean | null;
    megaMenuContent?: unknown;
    publishedAt?: string | null;
};

type CategoryApiResponse = {
    data?: CategoryDoc | null;
};

function getBaseUrl() {
    return (
        process.env.STRAPI_LOCAL_URL ||
        process.env.STRAPI_URL ||
        `http://127.0.0.1:${process.env.PORT || 1337}`
    ).replace(/\/$/, "");
}

function getApiToken() {
    const token = process.env.STRAPI_LOCALIZATION_TOKEN;

    if (!token) {
        throw new Error(
            "STRAPI_LOCALIZATION_TOKEN is missing. Add a full-access API token for internal localization sync."
        );
    }

    return token;
}

function buildLocalizedData(source: CategoryDoc, locale: string) {
    return {
        name: source.name ?? "",
        slug: source.slug ?? "",
        image: source.image?.id ? { set: [source.image.id] } : { set: [] },
        showInNavbar: source.showInNavbar ?? true,
        isMegaMenu: source.isMegaMenu ?? false,
        megaMenuContent: source.megaMenuContent ?? null,
        publishedAt: source.publishedAt ?? new Date().toISOString(),
        locale,
    };
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSourceCategory(documentId: string) {
    const url = `${getBaseUrl()}${API_PATH}/${documentId}?locale=${encodeURIComponent(
        SOURCE_LOCALE
    )}&status=published&populate=image`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${getApiToken()}`,
        },
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(
            `Failed to fetch source category ${documentId}: ${response.status}${
                text ? ` - ${text}` : ""
            }`
        );
    }

    return JSON.parse(text) as CategoryApiResponse;
}

async function upsertLocaleVersion(
    documentId: string,
    locale: string,
    data: ReturnType<typeof buildLocalizedData>
) {
    const url = `${getBaseUrl()}${API_PATH}/${documentId}?locale=${encodeURIComponent(
        locale
    )}&status=published`;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getApiToken()}`,
        },
        body: JSON.stringify({ data }),
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(
            `Failed to upsert locale ${locale}: ${response.status}${
                text ? ` - ${text}` : ""
            }`
        );
    }

    return text ? JSON.parse(text) : null;
}

async function syncCategoryLocalesFromSource(source: CategoryDoc) {
    if (!source.documentId) return;

    const sourceResponse = await fetchSourceCategory(source.documentId);
    const sourceData = sourceResponse.data;

    if (!sourceData) {
        throw new Error(
            `Source category ${source.documentId} was not returned by the API.`
        );
    }

    for (const locale of TARGET_LOCALES) {
        const data = buildLocalizedData(sourceData, locale);
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

    const timeout = setTimeout(() => {
        void syncCategoryLocalesFromSource(snapshot).catch((error) => {
            console.error("Failed to sync category locales:", error);
        });
    }, 250);

    return timeout;
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
            megaMenuContent?: unknown;
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
            megaMenuContent?: unknown;
            publishedAt?: string | null;
        };
    }) {
        const category = event.result;

        if (!category?.documentId) return;
        if (category.locale !== SOURCE_LOCALE) return;

        scheduleLocaleSync(category);
    },
};
