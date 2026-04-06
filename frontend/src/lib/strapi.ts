const STRAPI_URL =
    process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "") ||
    "http://localhost:1337";

if (
    !process.env.NEXT_PUBLIC_STRAPI_URL &&
    process.env.NODE_ENV === "production"
) {
    console.warn(
        "NEXT_PUBLIC_STRAPI_URL is not set in production. Falling back to localhost, which will fail on the deployed site."
    );
}

type StrapiPrimitive = string | number | boolean;
type StrapiQueryValue =
    | StrapiPrimitive
    | null
    | undefined
    | StrapiQueryValue[]
    | { [key: string]: StrapiQueryValue };

type StrapiQuery = Record<string, StrapiQueryValue>;

type StrapiFetchOptions = {
    query?: StrapiQuery;
    headers?: HeadersInit;
    revalidate?: number;
    tags?: string[];
    cache?: RequestCache;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: BodyInit | null;
    next?: {
        revalidate?: number;
        tags?: string[];
    };
};

function appendQueryValue(
    params: URLSearchParams,
    key: string,
    value: StrapiQueryValue
): void {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
        value.forEach((item, index) => {
            appendQueryValue(params, `${key}[${index}]`, item);
        });
        return;
    }

    if (typeof value === "object") {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            appendQueryValue(params, `${key}[${nestedKey}]`, nestedValue);
        });
        return;
    }

    params.append(key, String(value));
}

export function buildStrapiQuery(query?: StrapiQuery) {
    const params = new URLSearchParams();

    if (!query) return "";

    Object.entries(query).forEach(([key, value]) => {
        appendQueryValue(params, key, value);
    });

    return params.toString();
}

export function getStrapiURL(path = "") {
    return `${STRAPI_URL}${path}`;
}

export function getStrapiMedia(url?: string | null) {
    if (!url) return "/mock-images/mockshirt.png";
    if (url.startsWith("http")) return url;
    return `${STRAPI_URL}${url}`;
}

export async function strapiFetch<T = any>(
    path: string,
    options: StrapiFetchOptions = {}
): Promise<T> {
    const {
        query,
        headers,
        revalidate,
        tags,
        cache,
        method = "GET",
        body,
        next,
    } = options;

    const queryString = buildStrapiQuery(query);
    const url = queryString
        ? `${getStrapiURL(path)}?${queryString}`
        : getStrapiURL(path);

    const res = await fetch(url, {
        method,
        body,
        headers,
        cache,
        next: {
            revalidate: next?.revalidate ?? revalidate,
            tags: next?.tags ?? tags,
        },
    });

    if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(
            `Strapi request failed: ${method} ${path} (${res.status})${
                errorText ? ` - ${errorText}` : ""
            }`
        );
    }

    if (res.status === 204) {
        return null as T;
    }

    const contentType = res.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
        return null as T;
    }

    const text = await res.text();

    if (!text.trim()) {
        return null as T;
    }

    return JSON.parse(text) as T;
}

export async function strapiPublicFetch<T = any>(
    path: string,
    options: Omit<StrapiFetchOptions, "cache"> = {}
): Promise<T> {
    return strapiFetch<T>(path, {
        ...options,
        cache: options.next ? undefined : "force-cache",
    });
}

export async function strapiPrivateFetch<T = any>(
    path: string,
    options: Omit<
        StrapiFetchOptions,
        "cache" | "revalidate" | "tags" | "next"
    > = {}
): Promise<T> {
    return strapiFetch<T>(path, {
        ...options,
        cache: "no-store",
    });
}
