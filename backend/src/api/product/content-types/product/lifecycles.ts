import type { Core } from "@strapi/strapi";
declare const strapi: Core.Strapi;

const UID = "api::product.product";
const SOURCE_LOCALE = "tr";
const TARGET_LOCALES = ["en", "ar"];
const SYNC_DELAY_MS = 1500;
const MAX_RETRIES = 3;

const syncedDocuments = new Map<string, NodeJS.Timeout>();

type ProductDoc = {
    documentId: string;
    locale?: string;
    title?: string | null;
    description?: string | null;
    slug?: string | null;
    price?: number | null;
    isFeatured?: boolean | null;
    modelHeight?: string | null;
    modelWeight?: string | null;
    modelSize?: string | null;
    sizeXS?: boolean | null;
    sizeS?: boolean | null;
    sizeM?: boolean | null;
    sizeL?: boolean | null;
    sizeXL?: boolean | null;
    sizeXXL?: boolean | null;
    publishedAt?: string | null;
    image?: Array<{ id: number }> | null;
};

type LocalizedProductData = {
    title: string;
    description: string;
    slug: string;
    price: number | null;
    isFeatured: boolean;
    modelHeight: string;
    modelWeight: string;
    modelSize: string;
    sizeXS: boolean;
    sizeS: boolean;
    sizeM: boolean;
    sizeL: boolean;
    sizeXL: boolean;
    sizeXXL: boolean;
    publishedAt: string;
    image: number[];
};

function getBaseUrl() {
    return (
        process.env.NEXT_PUBLIC_STRAPI_URL ||
        process.env.STRAPI_BASE_URL ||
        process.env.PUBLIC_URL ||
        process.env.STRAPI_ADMIN_BACKEND_URL ||
        "http://localhost:1337"
    ).replace(/\/$/, "");
}

function getApiToken() {
    return process.env.STRAPI_LOCALIZATION_TOKEN?.trim() || null;
}

function hasLocalizationSyncConfig() {
    return Boolean(getBaseUrl() && getApiToken());
}

function makeSlug(slug: string | null | undefined, locale: string) {
    if (!slug) return `${locale}-${Date.now()}`;
    return `${slug}-${locale}`;
}

function buildLocalizedData(
    source: ProductDoc,
    locale: string
): LocalizedProductData {
    return {
        title: source.title ?? "",
        description: source.description ?? "",
        slug: makeSlug(source.slug, locale),
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
        publishedAt: source.publishedAt ?? new Date().toISOString(),
        image: source.image?.map((file) => file.id) ?? [],
    };
}

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function strapiRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getApiToken();

    if (!token) {
        throw new Error(
            "Missing STRAPI_LOCALIZATION_TOKEN environment variable for localized product sync."
        );
    }

    const response = await fetch(`${getBaseUrl()}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }

    return (await response.json()) as T;
}

async function fetchSourceProduct(documentId: string) {
    const query =
        `/api/products/${documentId}` +
        `?locale=${SOURCE_LOCALE}` +
        `&status=published` +
        `&populate[image][populate]=true`;

    const response = await strapiRequest<{ data?: ProductDoc | null }>(query, {
        method: "GET",
    });

    return response.data ?? null;
}

async function upsertLocaleVersion(
    documentId: string,
    locale: string,
    data: LocalizedProductData
) {
    await strapiRequest(
        `/api/products/${documentId}?locale=${locale}&status=published`,
        {
            method: "PUT",
            body: JSON.stringify({ data }),
        }
    );
}

async function syncProductLocalesFromSource(source: ProductDoc) {
    if (!source.documentId) return;

    if (!hasLocalizationSyncConfig()) {
        console.warn(
            "Skipping localized product sync: missing STRAPI base URL or STRAPI_LOCALIZATION_TOKEN."
        );
        return;
    }

    const sourceData = await fetchSourceProduct(source.documentId);

    if (!sourceData) {
        throw new Error(
            `Source product ${source.documentId} was not returned by the API.`
        );
    }

    if (sourceData.locale !== SOURCE_LOCALE) {
        return;
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

function scheduleLocaleSync(source: ProductDoc) {
    const documentId = source.documentId;
    const existingTimeout = syncedDocuments.get(documentId);

    if (existingTimeout) {
        clearTimeout(existingTimeout);
    }

    const snapshot: ProductDoc = {
        documentId: source.documentId,
        locale: source.locale,
        title: source.title,
        description: source.description,
        slug: source.slug,
        price: source.price,
        isFeatured: source.isFeatured,
        modelHeight: source.modelHeight,
        modelWeight: source.modelWeight,
        modelSize: source.modelSize,
        sizeXS: source.sizeXS,
        sizeS: source.sizeS,
        sizeM: source.sizeM,
        sizeL: source.sizeL,
        sizeXL: source.sizeXL,
        sizeXXL: source.sizeXXL,
        publishedAt: source.publishedAt,
        image: source.image,
    };

    const timeout = setTimeout(() => {
        syncedDocuments.delete(documentId);
        void syncProductLocalesFromSource(snapshot).catch((error) => {
            console.error(
                `Localized product sync failed for ${documentId}:`,
                error
            );
        });
    }, SYNC_DELAY_MS);

    syncedDocuments.set(documentId, timeout);
}

export default {
    async afterCreate(event: { result?: ProductDoc }) {
        const documentId = event.result?.documentId;
        const locale = event.result?.locale;

        if (!documentId || locale !== SOURCE_LOCALE) return;
        scheduleLocaleSync(event.result as ProductDoc);
    },

    async afterUpdate(event: { result?: ProductDoc }) {
        const documentId = event.result?.documentId;
        const locale = event.result?.locale;

        if (!documentId || locale !== SOURCE_LOCALE) return;
        scheduleLocaleSync(event.result as ProductDoc);
    },
};
